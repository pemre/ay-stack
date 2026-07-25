import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { createMigrationRunner } from "./createMigrationRunner.ts";

describe("createMigrationRunner", () => {
  it("never skips a missing version in an arbitrary migration chain", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 12 }),
        fc.integer({ min: 1, max: 11 }),
        fc.array(fc.integer({ min: 1, max: 11 }), { maxLength: 11 }),
        (currentVersion, startingVersion, registeredVersions) => {
          fc.pre(startingVersion <= currentVersion);
          const versions = new Set(
            registeredVersions.filter((version) => version < currentVersion),
          );
          const migrations: Record<
            number,
            (state: { visited: number[] }) => { visited: number[] }
          > = {};
          for (const version of versions) {
            migrations[version] = (state) => ({ visited: [...state.visited, version] });
          }

          const result = createMigrationRunner(currentVersion, migrations)(
            { version: startingVersion, visited: [] },
            { visited: [] },
          );
          let expectedVersion = startingVersion;
          while (expectedVersion < currentVersion && versions.has(expectedVersion)) {
            expectedVersion += 1;
          }

          expect(result.version).toBe(expectedVersion);
          expect(result.state.visited).toEqual(
            Array.from(
              { length: expectedVersion - startingVersion },
              (_, index) => startingVersion + index,
            ).filter((version) => versions.has(version)),
          );
        },
      ),
    );
  });
});
