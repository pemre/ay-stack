// Feature: ay-monorepo-foundation, Property 8: For any custom property declared
// by the @ay/ui-library Tailwind theme entry, the plain-CSS entry SHALL declare the
// same name with the same value and SHALL contain no Tailwind at-rule; and every
// core-tier token SHALL appear inside the theme entry's @theme block while no
// core-tier token appears outside it.
//
// **Validates: Requirements 9.1, 11.4, 11.5, 11.6, 11.8**
//
// Quantified over the declarations of both built entries, so the two consumption
// paths — Tailwind and plain CSS — are proved equivalent from the artifacts
// themselves rather than from the build script's intent.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { blockBody, declarations, PKG, read, stripComments } from "./helpers/css";

const TAILWIND_AT_RULES =
  /@(theme|tailwind|apply|utility|variant|custom-variant|plugin|source|config|reference)\b/;

const plain = read(PKG, "dist", "tokens.css");
const theme = read(PKG, "dist", "theme.css");
const coreSource = stripComments(read(PKG, "src", "tokens", "core.css"));

/** Every declaration in a stylesheet, flattened to name -> value. */
function allDeclarations(css: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const decl of declarations(stripComments(css))) map.set(decl.name, decl.value);
  return map;
}

const coreNames = new Set(
  declarations(blockBody(coreSource, /@theme\b[^{]*/) ?? "").map((d) => d.name),
);

describe("Property 8: theme entry and plain entry declare the same tokens", () => {
  it("emits all four artifacts the exports map names", () => {
    for (const file of ["core.css", "semantic.css", "tokens.css", "theme.css"]) {
      expect(existsSync(join(PKG, "dist", file)), `dist/${file} missing`).toBe(true);
    }
  });

  it("declares identical names with identical values in both entries", () => {
    const plainDecls = allDeclarations(plain);
    const themeDecls = allDeclarations(theme);

    expect([...themeDecls.keys()].sort()).toEqual([...plainDecls.keys()].sort());

    const differing: string[] = [];
    for (const [name, value] of themeDecls) {
      if (plainDecls.get(name) !== value) {
        differing.push(`${name}: theme ${value} vs plain ${plainDecls.get(name)}`);
      }
    }
    expect(differing).toEqual([]);
  });

  it("keeps the plain entry free of Tailwind at-rules", () => {
    expect(TAILWIND_AT_RULES.test(stripComments(plain))).toBe(false);
    // Concatenated, not composed with @import, so a raw <link> tag resolves it.
    expect(stripComments(plain)).not.toMatch(/@import\b/);
  });

  it("carries the core tier inside the theme entry's @theme static block", () => {
    expect(stripComments(theme)).toMatch(/@theme\s+static\b/);

    const themeBlock = blockBody(stripComments(theme), /@theme\b[^{]*/) ?? "";
    const inside = new Set(declarations(themeBlock).map((d) => d.name));

    expect(coreNames.size).toBeGreaterThan(0);
    expect([...coreNames].filter((name) => !inside.has(name))).toEqual([]);

    // And no core token leaks outside it: everything else in the theme entry is
    // semantic, which is exactly the tier that must stay out of @theme.
    const outside = stripComments(theme).replace(themeBlock, "");
    expect(declarations(outside).filter((d) => coreNames.has(d.name))).toEqual([]);
  });

  it("emits the core tier as :root in the plain entry", () => {
    const rootBlock = blockBody(stripComments(plain), /:root\b[^{]*/) ?? "";
    const inside = new Set(declarations(rootBlock).map((d) => d.name));
    expect([...coreNames].filter((name) => !inside.has(name))).toEqual([]);
  });
});
