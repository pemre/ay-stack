/**
 * Schema versioning and migration for the persisted dashboard document
 * (`.burkut/layouts/dashboard.json`, shape: `PersistedDashboardState`).
 *
 * `.burkut/layouts/dashboard.json` is user-editable disk state. Bumping
 * `CURRENT_LAYOUT_VERSION` and adding an entry to `MIGRATIONS` is required
 * any time a change to the persisted shape would otherwise turn existing
 * layouts into "Unknown Widget" placeholders or silently drop data.
 */

import { createMigrationRunner } from "@ay/dashboard-engine";
import type { Dashboard, PersistedDashboardState, WidgetInstance } from "../shared/types.ts";

/** The current persisted-document schema version. Bump when adding a migration. */
export const CURRENT_LAYOUT_VERSION = 2;

/**
 * v1 → v2: widget type IDs were renamed to describe what a widget shows
 * rather than its historical component name (Requirements: widget-purity-contract).
 * Exported so the legacy pre-dashboard localStorage migration
 * (`migrateFromLocalStorage` in `persistenceMiddleware.ts`) can reuse the same
 * mapping instead of duplicating it.
 */
export const V1_TO_V2_WIDGET_TYPE_ID_MAP: Record<string, string> = {
  sidebar: "tree-list",
  content: "markdown-viewer",
  map: "geo-map",
  timeline: "linear-timeline",
};

function migrateInstanceV1ToV2(instance: WidgetInstance): WidgetInstance {
  const mapped = V1_TO_V2_WIDGET_TYPE_ID_MAP[instance.widgetTypeId];
  // Unknown/custom IDs pass through untouched rather than being discarded --
  // an unrecognized ID today might be a third-party widget type registered
  // via registerWidgetType(), not a stale built-in ID.
  if (!mapped) return instance;
  return { ...instance, widgetTypeId: mapped };
}

function migrateDashboardV1ToV2(dashboard: Dashboard): Dashboard {
  return { ...dashboard, instances: dashboard.instances.map(migrateInstanceV1ToV2) };
}

/** Upgrades a v1 document (old widget type IDs) to v2 (renamed IDs). */
function migrateV1ToV2(state: { dashboards: Dashboard[] }): { dashboards: Dashboard[] } {
  return { dashboards: state.dashboards.map(migrateDashboardV1ToV2) };
}

type LayoutState = { dashboards: Dashboard[] };
type Migration = (state: LayoutState) => LayoutState;

/** Keyed by the version a migration upgrades FROM. */
const MIGRATIONS: Record<number, Migration> = {
  1: migrateV1ToV2,
};

const runMigrations = createMigrationRunner(CURRENT_LAYOUT_VERSION, MIGRATIONS);

/**
 * Upgrades a persisted dashboard document to `CURRENT_LAYOUT_VERSION` by
 * applying registered migrations in sequence.
 *
 * Unversioned or malformed input is treated as version 1 -- the only shape
 * that predates the `version` field being meaningful. Documents newer than
 * `CURRENT_LAYOUT_VERSION`, or ones for which no migration is registered from
 * their current version, are returned as-is at whatever version they reached:
 * this function never invents data or guesses at an unknown future shape.
 */
export function migrateLayoutDocument(input: unknown): PersistedDashboardState {
  const raw = (input ?? {}) as Partial<PersistedDashboardState>;
  const document = {
    version: typeof raw.version === "number" ? raw.version : 1,
    dashboards: Array.isArray(raw.dashboards) ? raw.dashboards : [],
  };
  const result = runMigrations(document, { dashboards: [] });
  return { version: result.version, dashboards: result.state.dashboards };
}
