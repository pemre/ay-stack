// Feature: ay-monorepo-foundation, Property 20: For any workspace package, git
// SHALL report that package's node_modules, dist, and coverage paths as ignored.
//
// **Validates: Requirements 2.9**
//
// The property quantifies over the workspace packages the globs match crossed
// with the three candidate paths, so it is checked exhaustively against git's own
// ignore resolution (`git check-ignore`) rather than by pattern-matching the
// .gitignore text — which would only prove what the file says, not what git does.

import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { ROOT, rootPackage, workspacePackages } from "./helpers/workspace";

const IGNORED_PATHS = ["node_modules", "dist", "coverage"];

/**
 * True when git reports `relativePath` as ignored. The path need not exist: a
 * trailing slash tells git to treat it as a directory, which is what makes
 * directory-only patterns such as `dist/` checkable before the directory exists.
 */
function isIgnored(relativePath: string): boolean {
  try {
    execFileSync("git", ["check-ignore", "-q", "--no-index", relativePath], {
      cwd: ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

describe("Property 20: gitignore covers every package path", () => {
  it("ignores node_modules, dist, and coverage for every workspace package and the root", () => {
    const notIgnored: string[] = [];
    for (const pkg of [rootPackage(), ...workspacePackages()]) {
      for (const path of IGNORED_PATHS) {
        const candidate = pkg.dir === "." ? `${path}/` : `${pkg.dir}/${path}/`;
        if (!isIgnored(candidate)) notIgnored.push(candidate);
      }
    }
    expect(notIgnored).toEqual([]);
  });

  it("ignores editor state under every workspace package", () => {
    const notIgnored = workspacePackages()
      .map((pkg) => `${pkg.dir}/.idea/`)
      .filter((candidate) => !isIgnored(candidate));
    expect(notIgnored).toEqual([]);
  });

  it("does not ignore package sources or manifests", () => {
    // Guards against an over-broad pattern silently hiding real files.
    const wrongly = workspacePackages()
      .flatMap((pkg) => [`${pkg.dir}/package.json`, `${pkg.dir}/src`])
      .filter((candidate) => isIgnored(candidate));
    expect(wrongly).toEqual([]);
  });
});
