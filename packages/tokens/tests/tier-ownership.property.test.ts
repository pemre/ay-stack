// Feature: ay-monorepo-foundation, Property 3: For any CSS file in @ay/ui-library
// or in the Bürküt application, that file SHALL declare no custom property whose
// name belongs to the core or semantic tier owned by @ay/tokens; and for any
// custom property declared by @ay/tokens, that property's name SHALL belong to
// the core or semantic tier and SHALL match no legacy-alias name, no
// app-specific prefix, and no component-tier prefix.
//
// **Validates: Requirements 4.1, 4.5, 4.8, 4.9, 4.10, 4.11, 6.4, 16.7**
//
// This is the @ay/tokens half. It quantifies over every CSS file both consumers
// contain — found by glob, not listed — so a new stylesheet in either consumer is
// covered the moment it appears. The Bürküt half lives in
// apps/burkut/src/tests/tier-ownership.property.test.ts and is what satisfies
// Requirement 16.7.

import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { blockBody, declaredNames, PKG, ROOT, read } from "./helpers/css";

/** Names @ay/tokens must never declare, because another tier owns them. */
const APP_SPECIFIC_PREFIXES = ["--tl-bg-", "--vis-"];
const APP_SPECIFIC_NAMES = ["--font-serif"];
const COMPONENT_PREFIXES = ["--spiral-", "--image-zoom-", "--btn-"];

const CONSUMER_DIRS = [
  join(ROOT, "packages", "ui-library", "src"),
  join(ROOT, "apps", "burkut", "src"),
];

function cssFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist") continue;
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) out.push(...cssFiles(abs));
    else if (entry.endsWith(".css")) out.push(abs);
  }
  return out;
}

const CORE = new Set(declaredNames(read(PKG, "src", "core.css")));
const SEMANTIC_CSS = read(PKG, "src", "semantic.css");
const SEMANTIC = new Set([
  ...declaredNames(blockBody(SEMANTIC_CSS, /:root\s*\{/) ?? ""),
  ...declaredNames(blockBody(SEMANTIC_CSS, /\[data-theme="dark"\]\s*\{/) ?? ""),
]);

/** Legacy alias names, read from the consumer that declares them. */
function legacyAliasNames(): string[] {
  const css = read(ROOT, "apps", "burkut", "src", "styles", "app-tokens.css");
  const root = blockBody(css, /:root\s*\{/) ?? "";
  return declaredNames(root).filter(
    (name) =>
      !APP_SPECIFIC_PREFIXES.some((prefix) => name.startsWith(prefix)) &&
      !APP_SPECIFIC_NAMES.includes(name),
  );
}

describe("Property 3: bidirectional tier ownership — @ay/tokens half", () => {
  it("declares only core-tier and semantic-tier names", () => {
    const declaredByPackage = cssFiles(join(PKG, "src")).flatMap((file) =>
      declaredNames(read(file)).map((name) => ({ file, name })),
    );

    const foreign = declaredByPackage
      .filter(({ name }) => !CORE.has(name) && !SEMANTIC.has(name))
      .map(({ file, name }) => relative(ROOT, file) + ": " + name);
    expect(foreign, "@ay/tokens declares a name in neither owned tier").toEqual([]);

    const aliases = new Set(legacyAliasNames());
    const trespassing = [...CORE, ...SEMANTIC].filter(
      (name) =>
        aliases.has(name) ||
        APP_SPECIFIC_PREFIXES.some((prefix) => name.startsWith(prefix)) ||
        APP_SPECIFIC_NAMES.includes(name) ||
        COMPONENT_PREFIXES.some((prefix) => name.startsWith(prefix)),
    );
    expect(trespassing, "@ay/tokens declares a legacy alias, app, or component token").toEqual([]);

    expect(aliases.size).toBeGreaterThan(0);
    expect(CORE.size).toBeGreaterThan(0);
    expect(SEMANTIC.size).toBeGreaterThan(0);
  });

  it("finds no owned token declared by either consumer", () => {
    const violations: string[] = [];
    let filesScanned = 0;

    for (const dir of CONSUMER_DIRS) {
      for (const file of cssFiles(dir)) {
        filesScanned++;
        for (const name of declaredNames(read(file))) {
          if (CORE.has(name)) {
            violations.push(relative(ROOT, file) + " declares core token " + name);
          } else if (SEMANTIC.has(name)) {
            violations.push(relative(ROOT, file) + " declares semantic token " + name);
          }
        }
      }
    }

    expect(violations, "a consumer declares a token @ay/tokens owns").toEqual([]);
    // Non-vacuity: both consumers really were scanned.
    expect(filesScanned).toBeGreaterThan(1);
  });
});
