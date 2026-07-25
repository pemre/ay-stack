/**
 * CSS reading helpers shared by Bürküt's token-tier checks.
 *
 * Deliberately small: block extraction by brace matching plus declaration and
 * var()-reference extraction. Nothing here resolves var() chains — that is the
 * baseline resolver's job, and it lives once in tools/tokens/resolve.mjs.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** apps/burkut — this file sits at apps/burkut/src/tests/helpers/css.ts */
export const APP = dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
/** workspace root */
export const ROOT = dirname(dirname(APP));
/** packages/tokens/src */
export const TOKENS_SRC = join(ROOT, "packages", "tokens", "src");

export const APP_TOKENS_CSS = join(APP, "src", "styles", "app-tokens.css");

export function read(path: string): string {
  return readFileSync(path, "utf-8");
}

export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Files under `dir` whose name ends with one of `extensions`, recursively. */
export function filesUnder(dir: string, extensions: string[]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist") continue;
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) out.push(...filesUnder(abs, extensions));
    else if (extensions.some((extension) => entry.endsWith(extension))) out.push(abs);
  }
  return out;
}

/**
 * Body of the first block whose prelude matches, by brace matching. Returns null
 * when no such block exists, so a caller can assert on its absence.
 */
export function blockBody(css: string, preludeRe: RegExp): string | null {
  const match = preludeRe.exec(css);
  if (!match) return null;
  const open = css.indexOf("{", match.index);
  if (open === -1) return null;
  let depth = 1;
  let i = open + 1;
  while (i < css.length && depth > 0) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") depth--;
    i++;
  }
  return css.slice(open + 1, depth === 0 ? i - 1 : css.length);
}

export interface Declaration {
  name: string;
  value: string;
}

/** `--name: value` pairs declared in a block body, in source order. */
export function declarations(body: string): Declaration[] {
  const found: Declaration[] = [];
  const source = stripComments(body);
  const re = /(--[A-Za-z0-9_-]+)\s*:\s*([^;}]+)/g;
  let m = re.exec(source);
  while (m !== null) {
    found.push({ name: m[1], value: m[2].trim().replace(/\s+/g, " ") });
    m = re.exec(source);
  }
  return found;
}

export function declaredNames(body: string): string[] {
  return declarations(body).map((declaration) => declaration.name);
}

/** Every custom property named by a var() reference in `text`. */
export function varTargets(text: string): string[] {
  const found: string[] = [];
  const re = /var\(\s*(--[A-Za-z0-9_-]+)/g;
  let m = re.exec(text);
  while (m !== null) {
    found.push(m[1]);
    m = re.exec(text);
  }
  return found;
}

/** The core-tier names @ay/tokens owns. */
export function coreNames(): Set<string> {
  return new Set(declaredNames(read(join(TOKENS_SRC, "core.css"))));
}

/** The semantic-tier names @ay/tokens owns. */
export function semanticNames(): Set<string> {
  const css = read(join(TOKENS_SRC, "semantic.css"));
  const root = blockBody(css, /:root\s*\{/) ?? "";
  const dark = blockBody(css, /\[data-theme="dark"\]\s*\{/) ?? "";
  return new Set([...declaredNames(root), ...declaredNames(dark)]);
}

/**
 * The region of app-tokens.css that holds legacy aliases, per theme. Marked in
 * the stylesheet with explicit begin/end comments so the region is a fact about
 * the file rather than a guess by the test.
 */
export function aliasRegion(css: string, theme: "light" | "dark"): string {
  const themeBody =
    theme === "light"
      ? (blockBody(css, /:root\s*\{/) ?? "")
      : (blockBody(css, /\[data-theme="dark"\]\s*\{/) ?? "");
  const start = themeBody.indexOf("── Legacy Aliases");
  const end = themeBody.indexOf("── End Legacy Aliases");
  if (start === -1 || end === -1) {
    throw new Error("app-tokens.css is missing the Legacy Aliases region markers for " + theme);
  }
  return themeBody.slice(start, end);
}
