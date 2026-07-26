import type { PersistenceAdapter } from "@ay/dashboard-engine";
import type { PersistedDashboardState } from "../shared/types.ts";
import { CURRENT_LAYOUT_VERSION, migrateLayoutDocument } from "./layoutMigrations.ts";

class HttpPersistenceError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpPersistenceError";
  }
}

/** Persistence adapter for the Bürküt dev-server `/api/layouts` endpoint. */
export const httpLayoutPersistenceAdapter: PersistenceAdapter<PersistedDashboardState> = {
  async load(): Promise<PersistedDashboardState | null> {
    const response = await fetch("/api/layouts");
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new HttpPersistenceError(
        response.status,
        `GET /api/layouts failed: ${response.status}`,
      );
    }

    const data: unknown = await response.json();
    const migrated = migrateLayoutDocument(data);
    return {
      version: migrated.version || CURRENT_LAYOUT_VERSION,
      dashboards: migrated.dashboards,
    };
  },

  async save(state: PersistedDashboardState): Promise<void> {
    const response = await fetch("/api/layouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...state, version: CURRENT_LAYOUT_VERSION }),
    });
    if (response.status === 404) {
      throw new HttpPersistenceError(404, "POST /api/layouts was not found");
    }
    if (!response.ok) {
      throw new HttpPersistenceError(
        response.status,
        `POST /api/layouts failed: ${response.status}`,
      );
    }
  },
};
