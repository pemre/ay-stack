// Feature: ay-monorepo-foundation, Property 10: For any workspace package, every
// dependency of that package whose name matches another workspace package SHALL
// use the workspace: protocol, and that package's directory SHALL contain no
// package-lock.json and no yarn.lock.
//
// **Validates: Requirements 1.6, 1.8, 5.1, 5.2**
//
// The property quantifies over the workspace packages the globs match and the
// dependency entries those manifests declare, so it is checked exhaustively over
// the real manifest set rather than over generated input.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { dependencyEntries, rootPackage, workspacePackages } from "./helpers/workspace";

const FOREIGN_LOCKFILES = ["package-lock.json", "yarn.lock"];

describe("Property 10: manifest hygiene", () => {
  it("declares every intra-workspace dependency with the workspace: protocol", () => {
    const packages = workspacePackages();
    const workspaceNames = new Set(packages.map((pkg) => pkg.name));
    const violations: string[] = [];

    for (const pkg of [rootPackage(), ...packages]) {
      for (const { field, name, range } of dependencyEntries(pkg.manifest)) {
        if (!workspaceNames.has(name) || name === pkg.name) continue;
        // peerDependencies intentionally carry semver ranges for external consumers
        if (field === "peerDependencies") continue;
        if (!range.startsWith("workspace:")) {
          violations.push(`${pkg.dir}: ${field}.${name} = "${range}" (expected workspace:*)`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("contains no npm or yarn lockfile in any package directory or at the root", () => {
    const found: string[] = [];
    for (const pkg of [rootPackage(), ...workspacePackages()]) {
      for (const lockfile of FOREIGN_LOCKFILES) {
        if (existsSync(join(pkg.absDir, lockfile))) found.push(`${pkg.dir}/${lockfile}`);
      }
    }
    expect(found).toEqual([]);
  });

  it("keeps exactly one pnpm lockfile, at the workspace root", () => {
    const root = rootPackage();
    expect(existsSync(join(root.absDir, "pnpm-lock.yaml"))).toBe(true);
    const strays = workspacePackages()
      .filter((pkg) => existsSync(join(pkg.absDir, "pnpm-lock.yaml")))
      .map((pkg) => `${pkg.dir}/pnpm-lock.yaml`);
    expect(strays).toEqual([]);
  });

  it("keeps the root manifest private and free of publishable fields", () => {
    const { manifest } = rootPackage();
    expect(manifest.name).toBe("ay-stack");
    expect(manifest.private).toBe(true);
    for (const field of ["bin", "files", "main", "module", "types"]) {
      expect(manifest[field], `root manifest declares ${field}`).toBeUndefined();
    }
    expect(String(manifest.packageManager)).toMatch(/^pnpm@\d+\.\d+\.\d+$/);
  });
});
