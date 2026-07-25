import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildContentGraph } from "../src/cli/contentGraph.ts";
import { scanDirectory } from "../src/cli/scanner.ts";
import burkutContent, { RESOLVED_ID } from "./burkut-content.ts";
import { collectMiddlewares, dispatch, loadVirtualPayload } from "./testHarness.ts";

// Feature: ay-monorepo-foundation, Property 15: For any scanned content directory, the
// virtual:burkut-content module payload SHALL parse back to a ContentGraph equal to the graph built
// from the same scan; and for any layout document written through POST /api/layouts, a subsequent
// GET /api/layouts SHALL return that same document from .burkut/layouts/dashboard.json inside the
// active content directory.

/** File base names: ASCII, spaced, and non-ASCII. */
const baseName = fc.constantFrom("note", "günlük", "日記", "naïve name", "trip report", "a_b-c");

/** Extensions the content type registry recognizes, plus one it does not. */
const extension = fc.constantFrom(
  ".md",
  ".mdx",
  ".markdown",
  ".jpg",
  ".png",
  ".mp4",
  ".mp3",
  ".txt",
);

/** Optional `YYYY-MM-DD ` filename prefix. */
const datePrefix = fc.option(
  fc
    .tuple(
      fc.integer({ min: 1900, max: 2099 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 }),
    )
    .map(([y, m, d]) => {
      const pad = (value: number) => String(value).padStart(2, "0");
      return [y, pad(m), pad(d)].join("-") + " ";
    }),
  { nil: undefined },
);

interface FileSpec {
  dirs: string[];
  prefix: string | undefined;
  base: string;
  ext: string;
  frontmatterTitle: string | undefined;
  tags: string[];
}

const fileSpec: fc.Arbitrary<FileSpec> = fc.record({
  dirs: fc.array(fc.constantFrom("nested", "iç klasör", "2024", "photos"), { maxLength: 2 }),
  prefix: datePrefix,
  base: baseName,
  ext: extension,
  frontmatterTitle: fc.option(fc.constantFrom("Given Title", "Başlık", "", "  "), {
    nil: undefined,
  }),
  tags: fc.array(fc.constantFrom("travel", "günlük", "notes"), { maxLength: 2 }),
});

const contentTree = fc.array(fileSpec, { minLength: 0, maxLength: 5 });

/** Arbitrary JSON layout document, as a dashboard layout POST body would carry. */
const layoutDocument = fc.dictionary(
  fc.constantFrom("lg", "md", "sm", "xs", "xxs"),
  fc.array(
    fc.record({
      i: fc.constantFrom("sidebar", "content", "map", "timeline"),
      x: fc.integer({ min: 0, max: 11 }),
      y: fc.integer({ min: 0, max: 40 }),
      w: fc.integer({ min: 1, max: 12 }),
      h: fc.integer({ min: 1, max: 20 }),
    }),
    { maxLength: 4 },
  ),
  { maxKeys: 3 },
);

let contentDir: string;

beforeEach(() => {
  contentDir = mkdtempSync(join(tmpdir(), "burkut-p15-"));
});

afterEach(() => {
  rmSync(contentDir, { recursive: true, force: true });
});

/** Materialize a generated tree inside a fresh subdirectory of the temp root. */
function writeTree(root: string, specs: FileSpec[]): void {
  specs.forEach((spec, index) => {
    const dir = join(root, ...spec.dirs);
    mkdirSync(dir, { recursive: true });
    // The index keeps generated names unique without changing their shape.
    const name = `${spec.prefix ?? ""}${spec.base}-${index}${spec.ext}`;
    const frontmatterLines: string[] = [];
    if (spec.frontmatterTitle !== undefined) {
      frontmatterLines.push(`title: "${spec.frontmatterTitle}"`);
    }
    if (spec.tags.length > 0) {
      frontmatterLines.push(`tags: [${spec.tags.map((tag) => `"${tag}"`).join(", ")}]`);
    }
    const body =
      frontmatterLines.length > 0
        ? `---\n${frontmatterLines.join("\n")}\n---\n\nBody of ${spec.base}\n`
        : `Body of ${spec.base}\n`;
    writeFileSync(join(dir, name), body, "utf-8");
  });
}

describe("Property 15: Content plugin payload round-trips", () => {
  /**
   * The virtual module payload parses back to exactly the graph built from the
   * same scan of the same directory.
   *
   * **Validates: Requirements 13.3**
   */
  it("round-trips the scanned ContentGraph through the virtual module payload", () => {
    let run = 0;

    fc.assert(
      fc.property(contentTree, (specs) => {
        const root = join(contentDir, `run-${run++}`);
        mkdirSync(root, { recursive: true });
        writeTree(root, specs);

        const plugin = burkutContent({ contentDir: root });
        const buildStart = plugin.buildStart;
        if (typeof buildStart !== "function") throw new Error("buildStart is not a function hook");
        buildStart.call({} as never, {} as never);

        const payload = loadVirtualPayload(plugin, RESOLVED_ID);
        const expected = JSON.parse(JSON.stringify(buildContentGraph(scanDirectory(root), root)));

        expect(payload).toEqual(expected);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * A layout document written through `POST /api/layouts` comes back verbatim
   * from `GET /api/layouts`, and lands in `.burkut/layouts/dashboard.json`
   * inside the active content directory.
   *
   * **Validates: Requirements 13.5**
   */
  it("round-trips layout documents through /api/layouts", async () => {
    let run = 0;

    await fc.assert(
      fc.asyncProperty(layoutDocument, async (document) => {
        const root = join(contentDir, `layouts-${run++}`);
        mkdirSync(root, { recursive: true });

        const plugin = burkutContent({ contentDir: root });
        const middlewares = collectMiddlewares(plugin);
        const body = JSON.stringify(document);

        const post = await dispatch(middlewares, "POST", "/api/layouts", body);
        expect(post.statusCode).toBe(200);

        const written = join(root, ".burkut", "layouts", "dashboard.json");
        expect(existsSync(written)).toBe(true);
        expect(JSON.parse(readFileSync(written, "utf-8"))).toEqual(document);

        const get = await dispatch(middlewares, "GET", "/api/layouts");
        expect(get.statusCode).toBe(200);
        expect(JSON.parse(get.body)).toEqual(document);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * With no layout written yet, `GET /api/layouts` reports 404 rather than
   * inventing a document.
   *
   * **Validates: Requirements 13.5**
   */
  it("reports 404 before any layout is written", async () => {
    const plugin = burkutContent({ contentDir });
    const middlewares = collectMiddlewares(plugin);
    const get = await dispatch(middlewares, "GET", "/api/layouts");
    expect(get.statusCode).toBe(404);
    expect(JSON.parse(get.body)).toEqual({ error: "Not found" });
  });
});
