/**
 * Small CSS reading helpers shared by the @ay/ui-library token checks.
 *
 * Deliberately minimal: block extraction by brace matching and custom-property
 * name/value extraction. The full var()-chain resolution used by the baseline
 * diff comes from tools/tokens/resolve.mjs — the instrument that captured the
 * baseline — rather than being reimplemented here.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** packages/ui-library */
export const PKG = dirname(dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url))))));
/** workspace root */
export const ROOT = dirname(dirname(PKG));

export function read(...segments: string[]): string {
  return readFileSync(join(...segments), "utf-8");
}

export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Body of the first block whose prelude matches, by brace matching. Returns
 * null when no such block exists, so a caller can assert on its absence.
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

/** `--name: value` pairs declared directly in a block body, in source order. */
export function declarations(body: string): { name: string; value: string }[] {
  const found: { name: string; value: string }[] = [];
  const re = /(--[A-Za-z0-9_-]+)\s*:\s*([^;]+)/g;
  let m = re.exec(body);
  while (m !== null) {
    found.push({ name: m[1], value: m[2].trim().replace(/\s+/g, " ") });
    m = re.exec(body);
  }
  return found;
}

export function declaredNames(body: string): string[] {
  return declarations(body).map((d) => d.name);
}

/** Plain (non-custom-property) declarations, used for `color-scheme`. */
export function plainDeclaration(body: string, property: string): string | null {
  const re = new RegExp(`(?:^|;|\\})\\s*${property}\\s*:\\s*([^;}]+)`);
  const m = re.exec(body);
  return m ? m[1].trim() : null;
}
