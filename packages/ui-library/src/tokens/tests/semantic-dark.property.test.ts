// Feature: ay-monorepo-foundation, Property 2: For any custom property declared
// in the semantic :root block of @ay/ui-library, the [data-theme="dark"] block SHALL
// declare a property with the same name, and both blocks SHALL declare
// color-scheme.
//
// **Validates: Requirements 4.3, 4.7, 8.5**
//
// Quantified over the declarations parsed out of the semantic block rather than a
// hardcoded list, so a token added to :root without a dark counterpart fails
// here — which is the failure mode that would silently break theme switching.

import { describe, expect, it } from "vitest";
import {
  blockBody,
  declaredNames,
  PKG,
  plainDeclaration,
  read,
  stripComments,
} from "./helpers/css";

const semantic = stripComments(read(PKG, "src", "tokens", "semantic.css"));

const light = blockBody(semantic, /:root\b[^{]*/);
const dark = blockBody(semantic, /\[data-theme\s*=\s*["']dark["']\][^{]*/);

describe("Property 2: semantic tier dark completeness", () => {
  it("declares both theme blocks", () => {
    expect(light, "semantic.css has no :root block").not.toBeNull();
    expect(dark, 'semantic.css has no [data-theme="dark"] block').not.toBeNull();
  });

  it("re-declares every :root semantic token in the dark block", () => {
    const lightNames = declaredNames(light ?? "");
    const darkNames = new Set(declaredNames(dark ?? ""));
    expect(lightNames.length).toBeGreaterThan(0);
    expect(lightNames.filter((name) => !darkNames.has(name))).toEqual([]);
  });

  it("declares no dark-only semantic token", () => {
    // The reverse direction: a token only the dark block declares would resolve
    // to nothing in light, which is the same defect seen from the other side.
    const lightNames = new Set(declaredNames(light ?? ""));
    expect(declaredNames(dark ?? "").filter((name) => !lightNames.has(name))).toEqual([]);
  });

  it("declares color-scheme in both blocks", () => {
    expect(plainDeclaration(light ?? "", "color-scheme")).toBe("light");
    expect(plainDeclaration(dark ?? "", "color-scheme")).toBe("dark");
  });
});
