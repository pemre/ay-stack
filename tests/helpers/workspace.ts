/**
 * Shared helpers for the workspace-level static checks.
 *
 * These read the repository as it actually is — the workspace globs, the package
 * manifests, and the lockfile — so the checks keep covering new packages as they
 * are added instead of asserting against a hardcoded list.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export interface WorkspacePackage {
  /** Path relative to the workspace root, e.g. "packages/ui-library". "." for the root. */
  dir: string;
  /** Absolute path to the package directory. */
  absDir: string;
  name: string;
  manifest: Record<string, unknown>;
}

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const;

export type DependencyField = (typeof DEPENDENCY_FIELDS)[number];

/** The `packages:` globs declared by pnpm-workspace.yaml, e.g. ["packages/*", "apps/*"]. */
export function workspaceGlobs(): string[] {
  const yaml = readFileSync(join(ROOT, "pnpm-workspace.yaml"), "utf-8");
  const globs: string[] = [];
  let inPackages = false;
  for (const line of yaml.split("\n")) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }
    if (inPackages) {
      const item = line.match(/^\s+-\s*["']?([^"'\s]+)["']?\s*$/);
      if (item) {
        globs.push(item[1]);
        continue;
      }
      if (line.trim() !== "" && !line.startsWith("#")) break;
    }
  }
  if (globs.length === 0) throw new Error("no packages globs found in pnpm-workspace.yaml");
  return globs;
}

function readManifest(absDir: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(absDir, "package.json"), "utf-8"));
}

/** Every workspace package the globs match. The root is not included. */
export function workspacePackages(): WorkspacePackage[] {
  const found: WorkspacePackage[] = [];
  for (const glob of workspaceGlobs()) {
    const [parent, star] = glob.split("/");
    if (star !== "*") throw new Error(`unsupported workspace glob: ${glob}`);
    const parentAbs = join(ROOT, parent);
    if (!existsSync(parentAbs)) continue;
    for (const entry of readdirSync(parentAbs, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const absDir = join(parentAbs, entry.name);
      if (!existsSync(join(absDir, "package.json"))) continue;
      const manifest = readManifest(absDir);
      found.push({
        dir: `${parent}/${entry.name}`,
        absDir,
        name: String(manifest.name ?? ""),
        manifest,
      });
    }
  }
  if (found.length === 0) throw new Error("no workspace packages discovered");
  return found;
}

/** The root manifest as a WorkspacePackage, for checks that include it. */
export function rootPackage(): WorkspacePackage {
  const manifest = readManifest(ROOT);
  return { dir: ".", absDir: ROOT, name: String(manifest.name ?? ""), manifest };
}

/** Flattened dependency entries of a manifest across all four dependency fields. */
export function dependencyEntries(
  manifest: Record<string, unknown>,
): { field: DependencyField; name: string; range: string }[] {
  const entries: { field: DependencyField; name: string; range: string }[] = [];
  for (const field of DEPENDENCY_FIELDS) {
    const block = manifest[field];
    if (!block || typeof block !== "object") continue;
    for (const [name, range] of Object.entries(block as Record<string, string>)) {
      entries.push({ field, name, range: String(range) });
    }
  }
  return entries;
}
