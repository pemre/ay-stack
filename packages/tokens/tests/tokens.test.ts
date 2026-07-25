// Unit (example-based) assertions on the authored token set: the twelve amber
// alpha variants, the sixteen semantic names, and the four green tokens that back
// the promoted status pair.
//
// These complement the properties rather than duplicating them: the properties
// quantify over whatever is declared, so they cannot notice a token that was
// never written. Requirements 4.2 and 4.6 name specific tokens, so specific
// assertions are what check them.

import { describe, expect, it } from "vitest";
import { blockBody, declarations, PKG, read, stripComments } from "./helpers/css";

const core = stripComments(read(PKG, "src", "core.css"));
const semantic = stripComments(read(PKG, "src", "semantic.css"));

const coreDecls = new Map(
  declarations(blockBody(core, /@theme\b[^{]*/) ?? "").map((d) => [d.name, d.value]),
);
const semanticLight = declarations(blockBody(semantic, /:root\b[^{]*/) ?? "").map((d) => d.name);

describe("@ay/tokens authored token set", () => {
  it("declares the six alpha variants for both amber shades (Requirement 4.6)", () => {
    const missing: string[] = [];
    for (const shade of ["400", "500"]) {
      for (const alpha of ["a12", "a15", "a20", "a30", "a44", "a66"]) {
        const name = "--color-amber-" + shade + "-" + alpha;
        if (!coreDecls.has(name)) missing.push(name);
      }
    }
    expect(missing).toEqual([]);
  });

  it("preserves the a44/a66 notation drift verbatim", () => {
    // Normalizing either notation shifts the rendered 8-bit alpha by up to
    // 1/255, which Requirements 8.1–8.4 forbid.
    expect(coreDecls.get("--color-amber-500-a44")).toBe("#f29b1744");
    expect(coreDecls.get("--color-amber-500-a66")).toBe("#f29b1766");
    expect(coreDecls.get("--color-amber-400-a44")).toBe("rgba(245, 171, 53, 0.27)");
    expect(coreDecls.get("--color-amber-400-a66")).toBe("rgba(245, 171, 53, 0.4)");
  });

  it("declares the four green tokens behind the success status pair", () => {
    expect(coreDecls.get("--color-green-500")).toBe("#2da44e");
    expect(coreDecls.get("--color-green-400")).toBe("#3fb950");
    expect(coreDecls.get("--color-green-500-a30")).toBe("rgba(45, 164, 78, 0.3)");
    expect(coreDecls.get("--color-green-400-a30")).toBe("rgba(63, 185, 80, 0.3)");
  });

  it("declares the sixteen semantic tokens (Requirement 4.2 plus the promotions)", () => {
    expect(semanticLight.slice().sort()).toEqual(
      [
        "--color-bg-body",
        "--color-bg-code",
        "--color-bg-surface",
        "--color-bg-surface-alt",
        "--color-border-default",
        "--color-border-hover",
        "--color-border-subtle",
        "--color-hover-bg",
        "--color-primary",
        "--color-status-success",
        "--color-status-success-subtle",
        "--color-text-muted",
        "--color-text-on-primary",
        "--color-text-primary",
        "--color-text-secondary",
        "--radius-control",
      ].sort(),
    );
  });

  it("declares no legacy alias and no app-specific token", () => {
    const forbidden = [
      /^--accent/,
      /^--bg-/,
      /^--text-(primary|secondary|muted|on-accent)$/,
      /^--border-/,
      /^--code-bg$/,
      /^--success/,
      /^--hover-bg$/,
      /^--tl-bg-/,
      /^--vis-/,
      /^--font-serif$/,
    ];
    const declared = [...coreDecls.keys(), ...semanticLight];
    expect(declared.filter((name) => forbidden.some((re) => re.test(name)))).toEqual([]);
  });
});
