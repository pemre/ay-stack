// Feature: ay-monorepo-foundation, Property 5: For any declaration inside the
// Bürküt legacy alias region, in either the light or the dark block, the declared
// value SHALL consist solely of var() references and SHALL contain no hex or
// rgba() color literal.
//
// **Validates: Requirements 6.1, 6.2, 6.3**
//
// The region is delimited by explicit begin/end comments in app-tokens.css, so
// which declarations count as aliases is a fact about the stylesheet rather than
// an assumption in the test. Every declaration the region contains is checked —
// exhaustively, not sampled.

import { describe, expect, it } from "vitest";
import { APP_TOKENS_CSS, aliasRegion, declarations, read, varTargets } from "./helpers/css";

const THEMES = ["light", "dark"] as const;

/** Any hex color or rgb/rgba/hsl/hsla function call. */
const LITERAL_PATTERNS = [/#[0-9a-fA-F]{3,8}\b/, /\b(rgba?|hsla?)\s*\(/];

describe("Property 5: legacy alias block is literal-free", () => {
  for (const theme of THEMES) {
    it("declares every " + theme + " alias as var() references only", () => {
      const region = aliasRegion(read(APP_TOKENS_CSS), theme);
      const declared = declarations(region);

      const violations: string[] = [];
      for (const { name, value } of declared) {
        for (const pattern of LITERAL_PATTERNS) {
          if (pattern.test(value)) {
            violations.push(theme + " " + name + ": " + value);
            break;
          }
        }
        // "solely of var() references": stripping every var(...) reference must
        // leave nothing that could carry a value of its own.
        const withoutVars = value.replace(/var\(\s*--[A-Za-z0-9_-]+\s*\)/g, "").trim();
        if (withoutVars !== "") {
          violations.push(theme + " " + name + " has a non-var() part: " + withoutVars);
        }
      }

      expect(violations, "legacy aliases carrying a literal").toEqual([]);
      // Non-vacuity: the region really held the alias set.
      expect(declared.length).toBeGreaterThan(15);
      expect(declared.every(({ value }) => varTargets(value).length === 1)).toBe(true);
    });
  }

  it("preserves the deliberate --accent-a66 asymmetry", () => {
    // The dark block does not redeclare --accent-a66: it inherits the amber-500
    // value from :root, exactly as it did pre-migration. Redeclaring it to
    // amber-400 would change what renders, so its absence is load-bearing.
    const css = read(APP_TOKENS_CSS);
    const light = declarations(aliasRegion(css, "light")).map(({ name }) => name);
    const dark = declarations(aliasRegion(css, "dark")).map(({ name }) => name);

    expect(light).toContain("--accent-a66");
    expect(dark).not.toContain("--accent-a66");
    // Everything else in light is redeclared in dark.
    expect(light.filter((name) => name !== "--accent-a66" && !dark.includes(name))).toEqual([]);
  });

  it("maps --bg-sidebar to a different semantic token per theme", () => {
    // The light literal was #f6f8fa (surface-alt) and the dark literal #22272e
    // (surface, not surface-alt). A single mapping would change dark rendering.
    const css = read(APP_TOKENS_CSS);
    const light = declarations(aliasRegion(css, "light"));
    const dark = declarations(aliasRegion(css, "dark"));

    expect(light.find(({ name }) => name === "--bg-sidebar")?.value).toBe(
      "var(--color-bg-surface-alt)",
    );
    expect(dark.find(({ name }) => name === "--bg-sidebar")?.value).toBe("var(--color-bg-surface)");
  });
});
