// Feature: ay-monorepo-foundation, Property 13: For any alias target directory
// produced by ayLocalAlias, resolving react and react-dom from that directory
// SHALL yield the same realpath as resolving them from the Bürküt application
// root.
//
// **Validates: Requirements 12.4**
//
// This is the check that the Local Dev Alias does not reintroduce the duplicate
// React that `npm link` produces. It resolves through Node's own algorithm from
// each alias target directory rather than inspecting the lockfile, because the
// failure mode is a resolution outcome, not a declared version.
//
// Scope note, stated rather than hidden: React resolution is only meaningful for
// alias targets that participate in the JS module graph. The `@ay/tokens`
// entries are stylesheets — nothing in them can import React — so the resolution
// assertion covers the JS/TS targets, and a separate assertion keeps that set
// from silently becoming empty.

import { existsSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { AY_DEDUPE, ayLocalAlias, ayResolve, ayWorkspaceRoot } from "../src/index";

const ROOT = ayWorkspaceRoot();
const BURKUT = join(ROOT, "apps", "burkut");
const JS_ENTRY = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/;

/** Realpath of `specifier` as resolved from `fromDir`, or null when unresolvable. */
function resolveFrom(fromDir: string, specifier: string): string | null {
  try {
    const require = createRequire(join(fromDir, "__resolve__.js"));
    return realpathSync(require.resolve(specifier));
  } catch {
    return null;
  }
}

const alias = ayLocalAlias("1", ROOT);
const targets = Object.entries(alias);
const jsTargetDirs = [
  ...new Set(
    targets.filter(([, target]) => JS_ENTRY.test(target)).map(([, target]) => dirname(target)),
  ),
];

describe("Property 13: React singleton under the local dev alias", () => {
  it("has JS alias targets to check, so the property is not vacuous", () => {
    expect(targets.length).toBeGreaterThan(0);
    expect(jsTargetDirs.length).toBeGreaterThan(0);
  });

  it("resolves react and react-dom identically from the app root and every JS alias target", () => {
    expect(existsSync(BURKUT), "apps/burkut is missing").toBe(true);

    for (const dependency of AY_DEDUPE) {
      const fromApp = resolveFrom(BURKUT, dependency);
      expect(fromApp, "the Bürküt app cannot resolve " + dependency).not.toBeNull();

      for (const dir of jsTargetDirs) {
        const fromTarget = resolveFrom(dir, dependency);
        expect(fromTarget, dir + " cannot resolve " + dependency).not.toBeNull();
        expect(fromTarget, dependency + " resolves to a second copy from " + dir).toBe(fromApp);
      }
    }
  });

  it("declares dedupe for react and react-dom on both branches", () => {
    // Even with the alias off, a transitive path could otherwise produce a second
    // copy, so dedupe is what makes the guarantee hold either way.
    expect(ayResolve({ ayLocal: "1", workspaceRoot: ROOT }).dedupe).toEqual(["react", "react-dom"]);
    expect(ayResolve({ ayLocal: undefined, workspaceRoot: ROOT }).dedupe).toEqual([
      "react",
      "react-dom",
    ]);
  });

  it("returns a fresh dedupe array each call", () => {
    // Vite configs mutate the fragments they are given; a shared array would leak
    // one consumer's edits into the other.
    const first = ayResolve({ ayLocal: "0", workspaceRoot: ROOT }).dedupe;
    first.push("mutated");
    expect(ayResolve({ ayLocal: "0", workspaceRoot: ROOT }).dedupe).toEqual(["react", "react-dom"]);
  });
});
