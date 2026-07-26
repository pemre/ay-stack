/**
 * @ay/vite-config — shared Vite resolution for the ay-stack workspace.
 *
 * Private, never published. It exists because there are two consumers that must
 * agree on the same alias map (the Bürküt app and the library's Storybook Vite
 * config), because the map has to stay in step with the set of `@ay/*` packages
 * and their entry subpaths, and because a function is unit-testable once while a
 * copied snippet is not addressable by a test at all.
 *
 * The Local Dev Alias: with `AY_LOCAL=1`, every `@ay/*` specifier resolves to
 * that package's source under `packages/<name>/src` instead of its published entry.
 * The aliased files then compile as ordinary members of the app's module graph,
 * so their bare `react` imports resolve from the app root — which is exactly
 * what `npm link` cannot do, and why linking produces a second React copy and
 * the "Invalid hook call" failure.
 */

import { existsSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Every `@ay/*` package specifier the workspace can alias, mapped to its source
 * entry relative to the workspace root.
 */
export const AY_LOCAL_ENTRIES: Record<string, string> = {
  "@ay/dashboard-engine/styles.css": "packages/dashboard-engine/src/styles.css",
  "@ay/tokens/theme.css": "packages/tokens/src/theme.css",
  "@ay/tokens/core.css": "packages/tokens/src/core.css",
  "@ay/tokens/semantic.css": "packages/tokens/src/semantic.css",
  "@ay/ui-library": "packages/ui-library/src/index.ts",
  "@ay/dashboard-engine": "packages/dashboard-engine/src/index.ts",
  "@ay/tokens": "packages/tokens/src/tokens.css",
};

/** The modules deduped on every branch, so one React instance is guaranteed. */
export const AY_DEDUPE: string[] = ["react", "react-dom"];

/** packages/vite-config */
const PKG_DIR = dirname(dirname(fileURLToPath(import.meta.url)));

/** The workspace root, derived from this file's own location. */
export function ayWorkspaceRoot(): string {
  return dirname(dirname(PKG_DIR));
}

/**
 * Pure: (env value, workspace root) → alias entries. Empty unless the value is
 * exactly `"1"`.
 *
 * It reads no `process.env` — the env value is an argument. That is what makes
 * the alias map testable across arbitrary values instead of only the one the
 * test process happens to carry.
 *
 * @throws when aliasing is enabled but a source entry is absent, naming the
 * missing absolute path. Failing at config load beats letting Vite fail later
 * with an opaque resolution error.
 */
export function ayLocalAlias(
  ayLocal: string | undefined,
  workspaceRoot: string,
): Record<string, string> {
  if (ayLocal !== "1") return {};

  const root = isAbsolute(workspaceRoot) ? workspaceRoot : resolve(workspaceRoot);
  const alias: Record<string, string> = {};
  const missing: string[] = [];

  for (const [specifier, relativeEntry] of Object.entries(AY_LOCAL_ENTRIES)) {
    const target = join(root, relativeEntry);
    if (!existsSync(target)) {
      missing.push(specifier + " -> " + target);
      continue;
    }
    alias[specifier] = target;
  }

  if (missing.length > 0) {
    throw new Error(
      "[@ay/vite-config] AY_LOCAL=1 but these package sources are missing:\n  " +
        missing.join("\n  ") +
        "\nUnset AY_LOCAL to resolve @ay/* through published entry points instead.",
    );
  }

  return alias;
}

export interface AyResolveOptions {
  /** Defaults to `process.env.AY_LOCAL`. */
  ayLocal?: string;
  /** Defaults to the workspace root derived from this package's location. */
  workspaceRoot?: string;
}

/**
 * Vite `resolve` fragment. `dedupe` is present on every branch: the published
 * entry path needs the same single-React guarantee that the aliased path does.
 */
export function ayResolve(opts: AyResolveOptions = {}): {
  alias: Record<string, string>;
  dedupe: string[];
} {
  const ayLocal = opts.ayLocal ?? process.env.AY_LOCAL;
  const workspaceRoot = opts.workspaceRoot ?? ayWorkspaceRoot();
  return {
    alias: ayLocalAlias(ayLocal, workspaceRoot),
    dedupe: [...AY_DEDUPE],
  };
}
