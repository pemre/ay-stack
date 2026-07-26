export interface MigrationResult<T> {
  version: number;
  state: T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Creates a sequential migration runner for versioned state envelopes.
 * Unversioned input starts at version 1, matching Bürküt's legacy format.
 */
export function createMigrationRunner<T>(
  currentVersion: number,
  migrations: Record<number, (state: T) => T>,
): (input: unknown, defaultState: T) => MigrationResult<T> {
  return (input, defaultState) => {
    const raw = isRecord(input) ? input : {};
    let version = typeof raw.version === "number" ? raw.version : 1;
    let state = isRecord(input) ? ({ ...raw } as T) : defaultState;

    if (isRecord(state) && "version" in state) {
      const { version: _version, ...withoutVersion } = state as T & { version: unknown };
      state = withoutVersion as T;
    }

    while (version < currentVersion) {
      const migrate = migrations[version];
      if (!migrate) break;
      state = migrate(state);
      version += 1;
    }

    return { version, state };
  };
}
