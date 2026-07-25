// Feature: ay-monorepo-foundation, Property 12: For any value of the AY_LOCAL
// environment variable, ayResolve SHALL include react and react-dom in
// resolve.dedupe; and the alias map SHALL contain an entry mapping every known
// @ay/* specifier to a path under packages/*/src when the value is exactly "1",
// and SHALL be empty for every other value including absence.
//
// **Validates: Requirements 12.1, 12.2, 12.3**
//
// This is a genuine property test: `ayLocalAlias` takes the env value as an
// argument and reads no `process.env`, so the whole input space is reachable from
// a test. The generator deliberately includes the near-misses that a truthiness
// check would get wrong — "0", "", "1 ", " 1", "true", "01" — because "exactly
// one enables it" is the part of the contract worth pinning down.

import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import fc from "fast-check";
import { afterEach, describe, expect, it } from "vitest";
import { AY_LOCAL_ENTRIES, ayLocalAlias, ayResolve, ayWorkspaceRoot } from "../src/index";

const ROOT = ayWorkspaceRoot();
const SPECIFIERS = Object.keys(AY_LOCAL_ENTRIES);

/** True when `target` lives under some `packages/<name>/src/`. */
function isUnderPackagesSrc(target: string): boolean {
  const parts = relative(ROOT, target).split(sep);
  return parts.length > 3 && parts[0] === "packages" && parts[2] === "src";
}

/**
 * AY_LOCAL values worth generating: the enabling value, the near-misses that a
 * truthy check would accept, absence, and arbitrary strings on top.
 */
const ayLocalArb = fc.oneof(
  { arbitrary: fc.constant<string | undefined>(undefined), weight: 2 },
  { arbitrary: fc.constant<string | undefined>("1"), weight: 4 },
  {
    arbitrary: fc.constantFrom<string | undefined>(
      "0",
      "",
      "1 ",
      " 1",
      "1\n",
      "01",
      "1.0",
      "true",
      "TRUE",
      "yes",
      "on",
      "11",
    ),
    weight: 4,
  },
  { arbitrary: fc.string() as fc.Arbitrary<string | undefined>, weight: 2 },
);

const specifierSubsetArb = fc.subarray(SPECIFIERS);

const originalAyLocal = process.env.AY_LOCAL;
afterEach(() => {
  if (originalAyLocal === undefined) delete process.env.AY_LOCAL;
  else process.env.AY_LOCAL = originalAyLocal;
});

describe("Property 12: local dev alias map correctness", () => {
  it("aliases every known specifier to packages/*/src exactly when AY_LOCAL is 1", () => {
    fc.assert(
      fc.property(ayLocalArb, specifierSubsetArb, (ayLocal, subset) => {
        const { alias, dedupe } = ayResolve({ ayLocal, workspaceRoot: ROOT });

        // dedupe is unconditional — the published-entry branch needs the single
        // React guarantee just as much as the aliased branch does.
        expect(dedupe).toContain("react");
        expect(dedupe).toContain("react-dom");

        if (ayLocal === "1") {
          expect(Object.keys(alias).sort()).toEqual(SPECIFIERS.slice().sort());
          for (const specifier of subset) {
            const target = alias[specifier];
            expect(target, "no alias for " + specifier).toBeDefined();
            expect(isUnderPackagesSrc(target), target + " is not under packages/*/src").toBe(true);
            expect(existsSync(target), target + " does not exist").toBe(true);
          }
        } else {
          expect(alias).toEqual({});
          for (const specifier of subset) {
            expect(Object.hasOwn(alias, specifier)).toBe(false);
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  it("reads no process.env, so the argument alone decides", () => {
    // The purity that makes the property above possible. If ayLocalAlias ever
    // consulted the environment, this would start aliasing.
    process.env.AY_LOCAL = "1";
    expect(ayLocalAlias(undefined, ROOT)).toEqual({});
    expect(ayLocalAlias("0", ROOT)).toEqual({});
    expect(Object.keys(ayLocalAlias("1", ROOT))).toHaveLength(SPECIFIERS.length);
  });

  it("defaults ayResolve to process.env.AY_LOCAL", () => {
    process.env.AY_LOCAL = "1";
    expect(Object.keys(ayResolve({ workspaceRoot: ROOT }).alias)).toHaveLength(SPECIFIERS.length);
    process.env.AY_LOCAL = "0";
    expect(ayResolve({ workspaceRoot: ROOT }).alias).toEqual({});
    delete process.env.AY_LOCAL;
    expect(ayResolve({ workspaceRoot: ROOT }).alias).toEqual({});
  });

  it("throws at config load naming every missing source path", () => {
    const empty = mkdtempSync(join(tmpdir(), "ay-vite-config-"));
    let message = "";
    try {
      ayLocalAlias("1", empty);
      throw new Error("expected ayLocalAlias to throw");
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    // The absolute path is the whole point: Vite's own failure would be opaque.
    for (const [specifier, entry] of Object.entries(AY_LOCAL_ENTRIES)) {
      expect(message).toContain(specifier);
      expect(message).toContain(join(empty, entry));
    }
  });

  it("keeps every known specifier pointed at a source entry, not a dist artifact", () => {
    for (const entry of Object.values(AY_LOCAL_ENTRIES)) {
      expect(entry.startsWith("packages/")).toBe(true);
      expect(entry).toContain("/src/");
      expect(entry).not.toContain("/dist/");
    }
  });
});
