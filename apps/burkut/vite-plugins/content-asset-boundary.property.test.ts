import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, normalize, resolve } from "node:path";
import fc from "fast-check";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resolveTargetDir, validateTargetDir } from "../src/cli/paths.ts";
import burkutContent, { isPathWithinBoundary } from "./burkut-content.ts";
import { collectMiddlewares, dispatch } from "./testHarness.ts";

// Feature: ay-monorepo-foundation, Property 16: For any request path under /content-assets/, the
// plugin SHALL serve the file only when it resolves inside the scanned content directory and SHALL
// reject it otherwise; and for any unresolvable path reached by the CLI or the plugin, the reported
// error message SHALL contain that path.

/** A canary that only exists outside the content directory. */
const SECRET = "PROPERTY-16-CANARY-SHOULD-NEVER-BE-SERVED";

let sandbox: string;
let contentDir: string;
let middlewares: ReturnType<typeof collectMiddlewares>;

beforeAll(() => {
  sandbox = mkdtempSync(join(tmpdir(), "burkut-p16-"));
  contentDir = join(sandbox, "content");
  mkdirSync(join(contentDir, "nested"), { recursive: true });
  writeFileSync(join(contentDir, "inside.md"), "inside the boundary\n", "utf-8");
  writeFileSync(join(contentDir, "nested", "photo.png"), "not really a png\n", "utf-8");

  // Siblings of the content directory, reachable only by escaping it.
  writeFileSync(join(sandbox, "secret.txt"), SECRET, "utf-8");
  mkdirSync(join(sandbox, "content-sibling"), { recursive: true });
  writeFileSync(join(sandbox, "content-sibling", "secret.txt"), SECRET, "utf-8");

  middlewares = collectMiddlewares(burkutContent({ contentDir }));
});

afterAll(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

/** Path segments, including the ones that make traversal interesting. */
const segment = fc.constantFrom(
  "inside.md",
  "nested",
  "photo.png",
  "..",
  ".",
  "",
  "secret.txt",
  "content-sibling",
  "günlük",
  "with space",
  "%2e%2e",
  "%2E%2E%2F",
  "..%2f",
  "....//",
);

/** Arbitrary relative request path, possibly percent-encoded, possibly escaping. */
const requestPath = fc
  .array(segment, { minLength: 1, maxLength: 6 })
  .map((parts) => parts.join("/"));

/** What the plugin will actually resolve for a given raw request path. */
function decodedPath(raw: string): string | null {
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

describe("Property 16: Content asset boundary and error reporting", () => {
  /**
   * The boundary is a security property: no request path, however encoded, may
   * cause a file outside the content directory to be served.
   *
   * **Validates: Requirements 13.4**
   */
  it("never serves a file from outside the content directory", async () => {
    await fc.assert(
      fc.asyncProperty(requestPath, async (raw) => {
        const res = await dispatch(middlewares, "GET", `/content-assets/${raw}`);

        // The canary lives only outside the content directory.
        expect(res.body).not.toContain(SECRET);

        const relative = decodedPath(raw);
        if (relative === null) return; // malformed encoding: decodeURIComponent throws upstream

        const inside = isPathWithinBoundary(contentDir, relative);
        if (!inside) {
          expect(res.statusCode).toBe(403);
          expect(res.body).toBe("Forbidden: path traversal detected");
        } else {
          // Inside the boundary: 200 for a real file, 404 otherwise. Never 403.
          expect([200, 404]).toContain(res.statusCode);
          const resolved = resolve(contentDir, relative);
          expect(normalize(resolved).startsWith(normalize(contentDir))).toBe(true);
        }
      }),
      { numRuns: 300 },
    );
  });

  /**
   * The boundary predicate itself: any resolved path it accepts is inside the
   * content directory, and any it rejects is outside.
   *
   * **Validates: Requirements 13.4**
   */
  it("accepts exactly the paths that resolve inside the content directory", () => {
    fc.assert(
      fc.property(requestPath, (raw) => {
        const relative = decodedPath(raw);
        if (relative === null) return;

        const resolved = normalize(resolve(contentDir, relative));
        const base = normalize(contentDir);
        const actuallyInside = resolved === base || resolved.startsWith(`${base}/`);

        expect(isPathWithinBoundary(contentDir, relative)).toBe(actuallyInside);
      }),
      { numRuns: 300 },
    );
  });

  /**
   * Files that do exist inside the boundary are served, so the boundary check is
   * not vacuously safe by rejecting everything.
   *
   * **Validates: Requirements 13.4**
   */
  it("serves files that exist inside the content directory", async () => {
    const direct = await dispatch(middlewares, "GET", "/content-assets/inside.md");
    expect(direct.statusCode).toBe(200);
    expect(direct.body).toContain("inside the boundary");

    const nested = await dispatch(middlewares, "GET", "/content-assets/nested/photo.png");
    expect(nested.statusCode).toBe(200);

    const throughDotDot = await dispatch(middlewares, "GET", "/content-assets/nested/../inside.md");
    expect(throughDotDot.statusCode).toBe(200);
  });

  /**
   * Known traversal vectors, kept explicit so the property above cannot pass
   * vacuously if the generator stops producing escaping paths. Includes the
   * sibling-prefix case (`../content-sibling/...`), which a naive
   * `startsWith(base)` check would wave through.
   *
   * **Validates: Requirements 13.4**
   */
  it("rejects every known traversal vector", async () => {
    const escaping = [
      "../secret.txt",
      "../../secret.txt",
      "nested/../../secret.txt",
      "..%2fsecret.txt",
      "%2e%2e%2fsecret.txt",
      "%2E%2E%2F%2E%2E%2Fsecret.txt",
      "../content-sibling/secret.txt",
      "nested/../../content-sibling/secret.txt",
    ];

    for (const vector of escaping) {
      const res = await dispatch(middlewares, "GET", `/content-assets/${vector}`);
      expect(res.body).not.toContain(SECRET);
      expect(res.statusCode).toBe(403);
    }

    // Looks like traversal but is not: `....` is an ordinary directory name,
    // so this stays inside the boundary and simply does not exist.
    const insideLookalike = await dispatch(middlewares, "GET", "/content-assets/....//secret.txt");
    expect(insideLookalike.statusCode).toBe(404);
    expect(insideLookalike.body).not.toContain(SECRET);
  });

  /**
   * A content directory that cannot be read is reported with its path, both by
   * the plugin's scan and by the CLI's validation.
   *
   * **Validates: Requirements 13.7**
   */
  it("names the unresolvable path in the reported error", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom("missing", "günlük", "nope", "with space"), {
          minLength: 1,
          maxLength: 4,
        }),
        (parts) => {
          const missing = join(sandbox, "absent", ...parts);

          // CLI side: the message names the resolved absolute path.
          const message = validateTargetDir(resolveTargetDir(sandbox, missing));
          expect(message).not.toBeNull();
          expect(message).toContain(missing);

          // Plugin side: the scan failure surfaces the same path.
          const plugin = burkutContent({ contentDir: missing });
          const buildStart = plugin.buildStart;
          if (typeof buildStart !== "function") throw new Error("buildStart is not a hook fn");
          let thrown: unknown;
          try {
            buildStart.call({} as never, {} as never);
          } catch (err) {
            thrown = err;
          }
          expect(thrown).toBeInstanceOf(Error);
          expect((thrown as Error).message).toContain(missing);
        },
      ),
      { numRuns: 100 },
    );
  });
});
