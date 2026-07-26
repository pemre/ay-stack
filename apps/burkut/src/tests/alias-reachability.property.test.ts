// Feature: ay-monorepo-foundation, Property 6: For any legacy alias declared by
// the Bürküt application, at least one var() reference to that alias SHALL exist
// in Bürküt source.
//
// **Validates: Requirements 6.6**
//
// The alias set comes from the stylesheet's own region markers and the reference
// index from the application plus extracted ui-library Blocks, so adding an alias
// without using it fails automatically. A reference from inside the alias region
// itself does not count — otherwise an alias could justify its own existence.

import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  APP,
  APP_TOKENS_CSS,
  aliasRegion,
  declarations,
  filesUnder,
  ROOT,
  read,
  stripComments,
  varTargets,
} from "./helpers/css";

const SOURCE_EXTENSIONS = [".css", ".ts", ".tsx"];
const BLOCKS = join(ROOT, "packages", "ui-library", "src", "blocks");

/** Every alias name declared in either theme's alias region. */
function aliasNames(): string[] {
  const css = read(APP_TOKENS_CSS);
  const names = new Set<string>();
  for (const theme of ["light", "dark"] as const) {
    for (const { name } of declarations(aliasRegion(css, theme))) names.add(name);
  }
  return [...names];
}

/** alias name → the Bürküt files that reference it through var(). */
function referenceIndex(): Map<string, string[]> {
  const index = new Map<string, string[]>();
  const aliasRegions = ["light", "dark"].map((theme) =>
    aliasRegion(read(APP_TOKENS_CSS), theme as "light" | "dark"),
  );

  for (const file of [
    ...filesUnder(APP, SOURCE_EXTENSIONS),
    ...filesUnder(BLOCKS, SOURCE_EXTENSIONS),
  ]) {
    let text = file.endsWith(".css") ? stripComments(read(file)) : read(file);
    // A reference from inside the alias region is self-justifying, so remove it.
    if (file === APP_TOKENS_CSS) {
      for (const region of aliasRegions) text = text.replace(stripComments(region), "");
    }
    for (const target of varTargets(text)) {
      const files = index.get(target) ?? [];
      files.push(relative(ROOT, file));
      index.set(target, files);
    }
  }
  return index;
}

describe("Property 6: legacy aliases are reachable", () => {
  it("finds at least one reference to every declared alias", () => {
    const index = referenceIndex();
    const names = aliasNames();

    const unreferenced = names.filter((name) => !index.has(name));
    expect(
      unreferenced,
      "aliases declared but never referenced — Requirement 6.6 says omit them",
    ).toEqual([]);

    // Non-vacuity: the alias set and the reference index are both real.
    expect(names.length).toBeGreaterThan(15);
    expect(index.size).toBeGreaterThan(names.length);
  });
});
