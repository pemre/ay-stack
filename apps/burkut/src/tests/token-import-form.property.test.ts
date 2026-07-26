// Feature: ay-monorepo-foundation, Property 4: For any import statement in
// @ay/ui-library or in the Bürküt application whose target resolves inside
// packages/ui-library/src/tokens, that import SHALL be written as an @ay/ui-library package
// specifier and SHALL NOT be a relative filesystem path.
//
// **Validates: Requirements 5.3, 5.4**
//
// This is Bürküt's side of the property. It quantifies over every import string
// in every Bürküt source and stylesheet, so a relative reach into the token
// package cannot slip in through a file the test does not know about.

import { existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { APP, filesUnder, ROOT, read, stripComments } from "./helpers/css";

const TOKENS_PKG = join(ROOT, "packages", "ui-library", "src", "tokens");
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".css"];

interface ImportRef {
  file: string;
  specifier: string;
}

/** Every module or stylesheet specifier a file imports. */
function importSpecifiers(file: string): string[] {
  const text = file.endsWith(".css") ? stripComments(read(file)) : read(file);
  const found: string[] = [];
  const patterns = [
    /@import\s+["']([^"']+)["']/g, // CSS
    /\bfrom\s+["']([^"']+)["']/g, // ES import/export ... from
    /\bimport\s+["']([^"']+)["']/g, // side-effect import
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

/** True when a relative specifier lands inside the unified token sources. */
function reachesTokenPackage(file: string, specifier: string): boolean {
  const target = resolve(dirname(file), specifier);
  if (!target.startsWith(TOKENS_PKG)) return false;
  // Only count a real reach: an extensionless guess that matches nothing is not
  // an import of the token package.
  return existsSync(target) || existsSync(target + ".css") || existsSync(target + ".ts");
}

const REFS: ImportRef[] = filesUnder(APP, SOURCE_EXTENSIONS).flatMap((file) =>
  importSpecifiers(file).map((specifier) => ({ file, specifier })),
);

describe("Property 4: token imports use the package specifier — Bürküt", () => {
  it("reaches token sources through no relative path", () => {
    const violations = REFS.filter(
      ({ file, specifier }) => isRelative(specifier) && reachesTokenPackage(file, specifier),
    ).map(({ file, specifier }) => relative(ROOT, file) + ' imports "' + specifier + '"');

    expect(violations, "relative import of the token package").toEqual([]);
  });

  it("imports the token stylesheet through the @ay/ui-library specifier", () => {
    // Non-vacuity: the app really does consume the unified token theme, so the check above is
    // constraining a live import rather than an empty set.
    const tokenImports = REFS.filter(({ specifier }) => specifier === "@ay/ui-library/theme.css");
    expect(tokenImports.length).toBeGreaterThan(0);
    for (const { specifier } of tokenImports) {
      expect(isRelative(specifier)).toBe(false);
    }
    expect(REFS.length).toBeGreaterThan(20);
  });
});
