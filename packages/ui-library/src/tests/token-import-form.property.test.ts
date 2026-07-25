// Feature: ay-monorepo-foundation, Property 4: For any import statement in
// @ay/ui-library or in the Bürküt application whose target resolves inside
// packages/tokens, that import SHALL be written as an @ay/tokens package
// specifier and SHALL NOT be a relative filesystem path.
//
// **Validates: Requirements 5.3, 5.4**
//
// This is the library's side of the property. The scan starts at the package root
// rather than at src/, because the library's token import lives in
// .storybook/tailwind.css — the one place the library loads the stylesheet at all.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/** packages/ui-library */
const PKG = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
/** workspace root */
const ROOT = dirname(dirname(PKG));
const TOKENS_PKG = join(ROOT, "packages", "tokens");
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".css"];
const SKIP_DIRS = new Set(["node_modules", "dist", "storybook-static", "coverage"]);

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) out.push(...filesUnder(abs));
    else if (SOURCE_EXTENSIONS.some((extension) => entry.endsWith(extension))) out.push(abs);
  }
  return out;
}

function importSpecifiers(file: string): string[] {
  const text = readFileSync(file, "utf-8").replace(/\/\*[\s\S]*?\*\//g, "");
  const found: string[] = [];
  const patterns = [
    /@import\s+["']([^"']+)["']/g,
    /\bfrom\s+["']([^"']+)["']/g,
    /\bimport\s+["']([^"']+)["']/g,
  ];
  for (const re of patterns) {
    let m = re.exec(text);
    while (m !== null) {
      found.push(m[1]);
      m = re.exec(text);
    }
  }
  return found;
}

function isRelative(specifier: string): boolean {
  return specifier.startsWith(".") || specifier.startsWith("/");
}

function reachesTokenPackage(file: string, specifier: string): boolean {
  const target = resolve(dirname(file), specifier);
  if (!target.startsWith(TOKENS_PKG)) return false;
  return existsSync(target) || existsSync(target + ".css") || existsSync(target + ".ts");
}

const REFS = filesUnder(PKG).flatMap((file) =>
  importSpecifiers(file).map((specifier) => ({ file, specifier })),
);

describe("Property 4: token imports use the package specifier — @ay/ui-library", () => {
  it("reaches packages/tokens through no relative path", () => {
    const violations = REFS.filter(
      ({ file, specifier }) => isRelative(specifier) && reachesTokenPackage(file, specifier),
    ).map(({ file, specifier }) => relative(ROOT, file) + ' imports "' + specifier + '"');

    expect(violations, "relative import of the token package").toEqual([]);
  });

  it("imports the token stylesheet through the @ay/tokens specifier", () => {
    const tokenImports = REFS.filter(({ specifier }) => specifier.startsWith("@ay/tokens"));
    expect(tokenImports.length).toBeGreaterThan(0);
    for (const { specifier } of tokenImports) {
      expect(isRelative(specifier)).toBe(false);
    }
    expect(REFS.length).toBeGreaterThan(20);
  });

  it("declares no local token stylesheet", () => {
    // src/styles/tokens.css was the library's private copy of the shared tiers.
    expect(existsSync(join(PKG, "src", "styles", "tokens.css"))).toBe(false);
  });
});
