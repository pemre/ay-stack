import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Path resolution for the Bürküt CLI, split along the line Requirement 13
 * draws: package-internal paths resolve relative to the `apps/burkut` package
 * directory, while the target content directory resolves relative to the
 * caller's working directory.
 *
 * The two rules live here rather than inline in the CLI so both the CLI and its
 * tests observe the same functions.
 */

/**
 * The `apps/burkut` package directory — the Vite project root the dev server
 * uses. Derived from this module's own location, so it is independent of the
 * caller's working directory (Requirement 13.1).
 */
export function resolveProjectRoot(): string {
  return resolve(import.meta.dirname, "..", "..");
}

/**
 * Resolve the CLI's target content directory argument relative to the caller's
 * working directory, independently of where the package lives (Requirement 13.2).
 * An absent or empty argument means "the working directory itself".
 */
export function resolveTargetDir(cwd: string, argument?: string): string {
  return resolve(cwd, argument && argument.length > 0 ? argument : ".");
}

/**
 * Validate a resolved target directory, returning the error message to report
 * or `null` when the directory is usable. Every message names the unresolved
 * absolute path (Requirement 13.7).
 */
export function validateTargetDir(targetDir: string): string | null {
  if (!existsSync(targetDir)) {
    return `Error: Directory not found: ${targetDir}`;
  }
  if (!statSync(targetDir).isDirectory()) {
    return `Error: Expected a directory, got a file: ${targetDir}`;
  }
  return null;
}
