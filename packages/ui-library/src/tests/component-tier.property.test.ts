// Feature: ay-monorepo-foundation, Property 7: For any var() reference appearing
// in an @ay/ui-library component stylesheet, the referenced custom property SHALL
// belong to the semantic tier or the component tier and SHALL NOT belong to the
// core tier.
//
// **Validates: Requirements 5.7**
//
// Scope of "reference", per the design's SpiralTimeline snippet: a component's
// own token-declaration block is the one sanctioned place a core token may be
// named, because that block *is* the indirection layer the tier rules exist to
// create. Everything downstream — every ordinary CSS declaration in every rule —
// must go through a component or semantic token. So the property is checked as:
// a var() whose target is core-tier may appear only on the right-hand side of a
// component-token declaration, never in an ordinary property declaration.
//
// The owned name sets are read from packages/tokens/src/*.css rather than
// hardcoded, so adding a core token automatically widens the check.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/** packages/ui-library */
const PKG = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
/** workspace root */
const ROOT = dirname(dirname(PKG));
const TOKENS_SRC = join(ROOT, "packages", "tokens", "src");

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function declaredNames(css: string): string[] {
  const found: string[] = [];
  const body = stripComments(css);
  const re = /(--[A-Za-z0-9_-]+)\s*:/g;
  let m = re.exec(body);
  while (m !== null) {
    found.push(m[1]);
    m = re.exec(body);
  }
  return found;
}

/** Every custom property @ay/tokens declares in its core tier. */
function coreNames(): Set<string> {
  return new Set(declaredNames(readFileSync(join(TOKENS_SRC, "core.css"), "utf-8")));
}

/** Every custom property @ay/tokens declares in its semantic tier. */
function semanticNames(): Set<string> {
  return new Set(declaredNames(readFileSync(join(TOKENS_SRC, "semantic.css"), "utf-8")));
}

function cssFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) out.push(...cssFiles(abs));
    else if (entry.endsWith(".css")) out.push(abs);
  }
  return out;
}

interface Declaration {
  property: string;
  value: string;
}

/**
 * Declarations in source order. A selector such as `.data-node:hover {` cannot
 * match, because the value pattern excludes `{` and a declaration must end at
 * `;` or `}`.
 */
function declarations(css: string): Declaration[] {
  const found: Declaration[] = [];
  const body = stripComments(css);
  const re = /(--[A-Za-z0-9_-]+|[a-zA-Z-]+)\s*:\s*([^;{}]*?)\s*(?=[;}])/g;
  let m = re.exec(body);
  while (m !== null) {
    found.push({ property: m[1], value: m[2] });
    m = re.exec(body);
  }
  return found;
}

function varTargets(value: string): string[] {
  const found: string[] = [];
  const re = /var\(\s*(--[A-Za-z0-9_-]+)/g;
  let m = re.exec(value);
  while (m !== null) {
    found.push(m[1]);
    m = re.exec(value);
  }
  return found;
}

const CORE = coreNames();
const SEMANTIC = semanticNames();
const FILES = cssFiles(join(PKG, "src"));

describe("Property 7: component CSS never reaches the core tier", () => {
  it("routes every ordinary declaration through a component or semantic token", () => {
    const violations: string[] = [];
    let referencesChecked = 0;

    for (const file of FILES) {
      const css = readFileSync(file, "utf-8");
      for (const { property, value } of declarations(css)) {
        const isComponentTokenDeclaration =
          property.startsWith("--") && !CORE.has(property) && !SEMANTIC.has(property);
        for (const target of varTargets(value)) {
          referencesChecked++;
          if (!CORE.has(target)) continue;
          if (isComponentTokenDeclaration) continue;
          violations.push(`${relative(ROOT, file)}: ${property} references core token ${target}`);
        }
      }
    }

    expect(violations, "core-tier references outside a component-token declaration").toEqual([]);
    // Non-vacuity: the scan actually read the block stylesheets.
    expect(referencesChecked).toBeGreaterThan(20);
  });

  it("resolves every core token a component-token declaration names", () => {
    // A typo in the mapping block would otherwise fall through to the literal
    // fallback and go unnoticed.
    const unknown: string[] = [];
    for (const file of FILES) {
      for (const { property, value } of declarations(readFileSync(file, "utf-8"))) {
        if (!property.startsWith("--")) continue;
        for (const target of varTargets(value)) {
          if (CORE.has(target) || SEMANTIC.has(target)) continue;
          if (target.startsWith("--spiral-") || target.startsWith("--image-zoom-")) continue;
          unknown.push(`${relative(ROOT, file)}: ${property} -> ${target}`);
        }
      }
    }
    expect(unknown, "component tokens referencing an unknown custom property").toEqual([]);
  });

  it("reads a non-empty core and semantic name set", () => {
    expect(CORE.size).toBeGreaterThan(0);
    expect(SEMANTIC.size).toBeGreaterThan(0);
    expect(FILES.length).toBeGreaterThan(0);
  });
});
