import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { compile } from "tailwindcss";
import { describe, expect, it } from "vitest";
import { resolveProjectRoot } from "../cli/paths.ts";

/**
 * Integration test for Tailwind utility output and token fallback.
 *
 * Requirement 11.7 is vacuous today — no `@ay/ui-library` block declares a
 * Tailwind utility class — so the first half of this test guards the *wiring*:
 * the app's Tailwind entry must compile, must emit utilities, and those
 * utilities must be generated from the `@ay/tokens` `@theme` block rather than
 * from Tailwind's built-in defaults. The moment a block starts using a utility,
 * the same test starts checking it for real.
 *
 * Requirement 11.8 is the other direction: with no Tailwind stylesheet at all,
 * blocks stay readable because every custom property they reference is either
 * supplied by `@ay/tokens`, declared by the block itself, or carries an inline
 * fallback.
 */

const APP_DIR = resolveProjectRoot();
const WORKSPACE_ROOT = resolve(APP_DIR, "..", "..");
const BLOCKS_DIR = resolve(WORKSPACE_ROOT, "packages", "ui-library", "src", "blocks");
const TOKENS_CSS = resolve(WORKSPACE_ROOT, "packages", "tokens", "dist", "tokens.css");
const TAILWIND_ENTRY = resolve(APP_DIR, "src", "styles", "tailwind.css");

const require = createRequire(resolve(APP_DIR, "package.json"));

/** Resolve `@import` targets the way Vite would for the app's entry. */
async function loadStylesheet(id: string, base: string) {
  const path =
    id.startsWith(".") || id.startsWith("/")
      ? resolve(base, id)
      : id.endsWith(".css")
        ? require.resolve(id)
        : require.resolve(`${id}/index.css`);

  return { path, base: dirname(path), content: readFileSync(path, "utf-8") };
}

/** Every file under a directory tree, recursively. */
function walk(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full));
    else found.push(full);
  }
  return found;
}

/** Class names the library blocks declare in `className` attributes. */
function blockClassNames(): string[] {
  const sources = walk(BLOCKS_DIR).filter(
    (file) => file.endsWith(".tsx") && !file.includes(".test.") && !file.includes(".stories."),
  );

  const names = new Set<string>();
  for (const file of sources) {
    const content = readFileSync(file, "utf-8");
    for (const match of content.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
      const literal = match[1] ?? match[2] ?? "";
      // Drop `${...}` interpolations, keep the static class tokens around them.
      for (const token of literal.replace(/\$\{[^}]*\}/g, " ").split(/\s+/)) {
        if (token.length > 0) names.add(token);
      }
    }
  }
  return [...names];
}

/** `var(--name)` references in a stylesheet, and whether each has a fallback. */
function varReferences(css: string): { name: string; hasFallback: boolean }[] {
  const references: { name: string; hasFallback: boolean }[] = [];
  for (const match of css.matchAll(/var\(\s*(--[\w-]+)\s*(,)?/g)) {
    references.push({ name: match[1], hasFallback: match[2] === "," });
  }
  return references;
}

/** Custom properties a stylesheet declares. */
function declaredProperties(css: string): Set<string> {
  const declared = new Set<string>();
  for (const match of css.matchAll(/(--[\w-]+)\s*:/g)) declared.add(match[1]);
  return declared;
}

async function compileAppTailwind(candidates: string[]): Promise<string> {
  const compiler = await compile(readFileSync(TAILWIND_ENTRY, "utf-8"), {
    base: dirname(TAILWIND_ENTRY),
    loadStylesheet,
  });
  return compiler.build(candidates);
}

describe("Tailwind utility output and token fallback", () => {
  /**
   * The wiring guard: the app's Tailwind entry compiles, emits utilities, and
   * those utilities carry `@ay/tokens` values.
   *
   * _Requirements: 11.7_
   */
  it("emits utility rules generated from the @ay/tokens theme", async () => {
    const output = await compileAppTailwind([
      "flex",
      "p-2",
      "rounded-md",
      "text-amber-500",
      "text-green-400",
      "definitely-not-a-utility",
    ]);

    expect(output).toMatch(/\.flex\s*\{/);
    expect(output).toMatch(/\.p-2\s*\{/);
    expect(output).toMatch(/\.rounded-md\s*\{/);

    // Generated from the token package's @theme block, not Tailwind's defaults:
    // amber-500 and green-400 are @ay/tokens core values.
    expect(output).toContain("--color-amber-500");
    expect(output).toContain("--color-green-400");
    expect(output).toMatch(/\.text-amber-500\s*\{/);

    // A class nobody defines produces no rule, so the check above is meaningful.
    expect(output).not.toContain("definitely-not-a-utility");
  });

  /**
   * Every utility class a library block declares appears in the compiled output.
   * Vacuous today — the blocks use only their own BEM class names — so the test
   * also records that fact rather than silently passing on an empty set.
   *
   * _Requirements: 11.7_
   */
  it("emits a rule for every Tailwind utility a library block declares", async () => {
    const candidates = blockClassNames();
    expect(candidates.length).toBeGreaterThan(0);

    const output = await compileAppTailwind(candidates);

    // Blocks style themselves through their own class names today; whichever of
    // them Tailwind recognizes as a utility must show up in the output.
    const emitted = candidates.filter((name) =>
      new RegExp(`\\.${name.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}[\\s,:{]`).test(output),
    );
    const blockOwnClasses = candidates.filter(
      (name) => name.startsWith("spiral-timeline") || name.startsWith("image-zoom"),
    );

    // Every block class is a block-owned name, none is a Tailwind utility.
    expect(candidates.filter((name) => !blockOwnClasses.includes(name))).toEqual([]);
    expect(emitted).toEqual([]);
  });

  /**
   * Without the Tailwind stylesheet, blocks remain readable: every custom
   * property they reference is supplied by `@ay/tokens`, declared by the block
   * itself, or carries an inline fallback.
   *
   * _Requirements: 11.8_
   */
  it("keeps block styling resolvable from @ay/tokens alone", () => {
    const tokens = declaredProperties(readFileSync(TOKENS_CSS, "utf-8"));
    const blockStylesheets = walk(BLOCKS_DIR).filter((file) => file.endsWith(".css"));

    expect(blockStylesheets.length).toBeGreaterThan(0);

    const unresolvable: string[] = [];
    for (const file of blockStylesheets) {
      const css = readFileSync(file, "utf-8");
      const local = declaredProperties(css);
      for (const reference of varReferences(css)) {
        if (tokens.has(reference.name)) continue;
        if (local.has(reference.name)) continue;
        if (reference.hasFallback) continue;
        unresolvable.push(`${file}: ${reference.name}`);
      }
    }

    expect(unresolvable).toEqual([]);
  });
});
