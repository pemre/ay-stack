/**
 * Minimal readers for `pnpm-lock.yaml` and the `catalog:` block of
 * `pnpm-workspace.yaml`.
 *
 * Only two shapes are needed — the catalog name set and the resolved version each
 * workspace importer got for a dependency — and both are emitted by pnpm with
 * fixed indentation, so an indentation-aware scan is enough and the workspace
 * avoids a YAML dependency. Every reader throws when the section it expects is
 * missing, so a parse that silently finds nothing cannot masquerade as a pass.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./workspace";

export interface ImporterDependency {
  field: string;
  name: string;
  /** Resolved version with any peer-suffix stripped, e.g. "1.6.1". */
  version: string;
  /** Raw lockfile value, e.g. "1.6.1(@types/node@25.9.5)" or "link:../tokens". */
  rawVersion: string;
}

const indentOf = (line: string): number => line.length - line.trimStart().length;

const unquote = (key: string): string => key.replace(/^['"]|['"]$/g, "");

/** Strips pnpm's peer-dependency suffix: "1.6.1(@types/node@25.9.5)" → "1.6.1". */
export function baseVersion(rawVersion: string): string {
  const cut = rawVersion.indexOf("(");
  return (cut === -1 ? rawVersion : rawVersion.slice(0, cut)).trim();
}

/** Names declared in the `catalog:` block of pnpm-workspace.yaml. */
export function catalogNames(): string[] {
  const yaml = readFileSync(join(ROOT, "pnpm-workspace.yaml"), "utf-8");
  const names: string[] = [];
  let inCatalog = false;
  for (const line of yaml.split("\n")) {
    if (/^catalog:\s*$/.test(line)) {
      inCatalog = true;
      continue;
    }
    if (!inCatalog) continue;
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    if (indentOf(line) === 0) break;
    const entry = line.match(/^\s+(['"]?[^:]+?['"]?):\s*/);
    if (entry) names.push(unquote(entry[1]));
  }
  if (names.length === 0) throw new Error("no catalog entries found in pnpm-workspace.yaml");
  return names;
}

/**
 * The `importers:` section of pnpm-lock.yaml, keyed by importer path
 * ("." for the root, "apps/burkut", …).
 */
export function lockfileImporters(): Map<string, ImporterDependency[]> {
  const lock = readFileSync(join(ROOT, "pnpm-lock.yaml"), "utf-8");
  const lines = lock.split("\n");
  const start = lines.findIndex((line) => /^importers:\s*$/.test(line));
  if (start === -1) throw new Error("no importers section found in pnpm-lock.yaml");

  const importers = new Map<string, ImporterDependency[]>();
  let importer: string | null = null;
  let field: string | null = null;
  let dependency: string | null = null;

  for (const line of lines.slice(start + 1)) {
    if (line.trim() === "") continue;
    const indent = indentOf(line);
    if (indent === 0) break; // next top-level section

    const key = line.match(/^\s+(['"]?.+?['"]?):\s*(.*)$/);
    if (!key) continue;
    const name = unquote(key[1]);
    const value = key[2].trim();

    if (indent === 2) {
      importer = name;
      field = null;
      dependency = null;
      if (!importers.has(importer)) importers.set(importer, []);
    } else if (indent === 4) {
      field = name;
      dependency = null;
    } else if (indent === 6) {
      dependency = name;
    } else if (indent === 8 && name === "version" && importer && field && dependency) {
      importers.get(importer)?.push({
        field,
        name: dependency,
        version: baseVersion(value),
        rawVersion: value,
      });
    }
  }

  if (importers.size === 0) throw new Error("importers section of pnpm-lock.yaml parsed as empty");
  return importers;
}
