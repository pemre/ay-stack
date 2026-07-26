// Feature: ay-monorepo-foundation, Property 4: For any import statement in
// @ay/ui-library or in the Bürküt application whose target resolves inside
// packages/ui-library/src/tokens, that import SHALL remain inside this package;
// no source may reference the retired standalone token package specifier.
//
// **Validates: Requirements 5.3, 5.4**
//
// This is the library's side of the property. The scan starts at the package root
// rather than at src/, because Storybook loads the source Tailwind entry from
// .storybook/tailwind.css.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/** packages/ui-library */
const PKG = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
/** workspace root */
const ROOT = dirname(dirname(PKG));
const TOKENS_SRC = join(PKG, "src", "tokens");
const RETIRED_TOKEN_SPECIFIER = ["@ay", "tokens"].join("/");
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

function reachesTokenSource(file: string, specifier: string): boolean {
  const target = resolve(dirname(file), specifier);
  if (!target.startsWith(TOKENS_SRC)) return false;
  return existsSync(target) || existsSync(`${target}.css`) || existsSync(`${target}.ts`);
}

const REFS = filesUnder(PKG).flatMap((file) =>
  importSpecifiers(file).map((specifier) => ({ file, specifier })),
);

describe("Property 4: token imports use the package specifier — @ay/ui-library", () => {
  it("keeps local token-source imports within the unified package", () => {
    const outside = REFS.filter(
      ({ file, specifier }) => isRelative(specifier) && reachesTokenSource(file, specifier),
    ).map(({ file, specifier }) => `${relative(ROOT, file)} imports "${specifier}"`);

    expect(outside).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/src\/styles\.css imports "\.\/tokens\/tokens\.css"/),
      ]),
    );
  });

  it("contains no import of the retired token package", () => {
    const tokenImports = REFS.filter(({ specifier }) =>
      specifier.startsWith(RETIRED_TOKEN_SPECIFIER),
    );
    expect(tokenImports).toEqual([]);
    expect(REFS.length).toBeGreaterThan(20);
  });

  it("owns token sources under src/tokens", () => {
    for (const file of ["core.css", "semantic.css", "theme.css", "tokens.css"]) {
      expect(existsSync(join(TOKENS_SRC, file)), file).toBe(true);
    }
  });
});
