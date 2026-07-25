// Feature: ay-monorepo-foundation, Property 9: For any dependency name in the
// shared-tool catalog, the resolved dependency graph SHALL contain exactly one
// version of that dependency across every workspace importer.
//
// **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7**
//
// The property quantifies over the catalog name set and the set of workspace
// importers the lockfile actually records, so it is checked exhaustively rather
// than sampled — every catalog name is examined on every run, and a new catalog
// entry or a new workspace package is picked up without editing the test.

import { describe, expect, it } from "vitest";
import { catalogNames, lockfileImporters } from "./helpers/lockfile";

/** name → version → importers that resolved that version. */
function resolvedVersionsByName(): Map<string, Map<string, string[]>> {
  const byName = new Map<string, Map<string, string[]>>();
  for (const [importer, dependencies] of lockfileImporters()) {
    for (const dependency of dependencies) {
      // workspace links carry no version of their own
      if (dependency.rawVersion.startsWith("link:")) continue;
      const versions = byName.get(dependency.name) ?? new Map<string, string[]>();
      const importers = versions.get(dependency.version) ?? [];
      importers.push(`${importer} (${dependency.field})`);
      versions.set(dependency.version, importers);
      byName.set(dependency.name, versions);
    }
  }
  return byName;
}

describe("Property 9: single version per shared tool", () => {
  it("resolves at most one version of every catalogued tool across all importers", () => {
    const byName = resolvedVersionsByName();
    const violations: string[] = [];

    for (const name of catalogNames()) {
      const versions = byName.get(name);
      if (!versions) continue; // catalogued but unused: no version to disagree about
      if (versions.size > 1) {
        const detail = [...versions.entries()]
          .map(([version, importers]) => `    ${version} ← ${importers.join(", ")}`)
          .join("\n");
        violations.push(`  ${name} resolves to ${versions.size} versions:\n${detail}`);
      }
    }

    expect(
      violations,
      `catalogued tools with more than one resolved version:\n${violations.join("\n")}`,
    ).toEqual([]);
  });

  it("reads a non-empty catalog and a non-empty importer set", () => {
    // Guards the check above against passing vacuously on a parse failure.
    expect(catalogNames().length).toBeGreaterThan(0);
    expect(lockfileImporters().size).toBeGreaterThan(0);
  });

  it("declares every tool Requirement 10 names in the catalog", () => {
    const required = [
      "@testing-library/react",
      "jsdom",
      "vitest",
      "@biomejs/biome",
      "fast-check",
      "typescript",
      "react",
      "react-dom",
    ];
    const names = catalogNames();
    expect(required.filter((name) => !names.includes(name))).toEqual([]);
  });
});
