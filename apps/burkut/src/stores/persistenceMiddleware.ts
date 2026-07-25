import type { StateCreator, StoreMutatorIdentifier } from "zustand";
import { getWidgetType } from "../components/WidgetGrid/widgetTypeRegistry.ts";
import type {
  Dashboard,
  PersistedDashboardState,
  WidgetConfig,
  WidgetInstance,
} from "../shared/types.ts";
import {
  CURRENT_LAYOUT_VERSION,
  migrateLayoutDocument,
  V1_TO_V2_WIDGET_TYPE_ID_MAP,
} from "./layoutMigrations.ts";

const SESSION_KEY = "burkut-active-dashboard";
const LEGACY_LAYOUTS_KEY = "burkut-widget-layouts";
const LEGACY_VISIBILITY_KEY = "burkut-widget-visibility";
// Pre-dashboard localStorage layouts predate the widget-purity-contract rename,
// so their widgetTypeId values are the old (v1) IDs -- map them through the
// same table the v1→v2 document migration uses, rather than duplicating it.
const KNOWN_WIDGET_TYPE_IDS = new Set(Object.keys(V1_TO_V2_WIDGET_TYPE_ID_MAP));

interface StoreWithPersistence {
  dashboards: Dashboard[];
  activeDashboardId: string;
  _mergeSharedState: (incoming: { dashboards: Dashboard[] }) => void;
}

type PersistenceMiddleware = <
  T extends StoreWithPersistence,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
) => StateCreator<T, Mps, Mcs>;

// ── Legacy localStorage migration ──

interface LegacyLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export function migrateFromLocalStorage(): { dashboards: Dashboard[] } | null {
  try {
    const rawLayouts = localStorage.getItem(LEGACY_LAYOUTS_KEY);
    const rawVisibility = localStorage.getItem(LEGACY_VISIBILITY_KEY);

    if (!rawLayouts && !rawVisibility) return null;

    let lgItems: LegacyLayoutItem[] = [];
    if (rawLayouts) {
      const parsed = JSON.parse(rawLayouts);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.lg)) {
        lgItems = parsed.lg;
      }
    }

    let visibility: Record<string, boolean> = {};
    if (rawVisibility) {
      try {
        const parsed = JSON.parse(rawVisibility);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          visibility = parsed;
        }
      } catch {
        // Partially corrupt visibility — use empty (all visible by default)
      }
    }

    const instances: WidgetInstance[] = [];
    for (const item of lgItems) {
      const legacyWidgetTypeId = item.i;
      if (!KNOWN_WIDGET_TYPE_IDS.has(legacyWidgetTypeId)) continue;
      const widgetTypeId = V1_TO_V2_WIDGET_TYPE_ID_MAP[legacyWidgetTypeId];

      // If visibility data exists, skip hidden widgets
      const isVisible =
        Object.keys(visibility).length > 0 ? visibility[legacyWidgetTypeId] !== false : true;
      if (!isVisible) continue;

      const typeDef = getWidgetType(widgetTypeId);
      const defaultConfig: WidgetConfig = typeDef
        ? { ...typeDef.defaultConfig }
        : ({ type: "sidebar", tags: [], contentType: null } as WidgetConfig);

      instances.push({
        instanceId: crypto.randomUUID(),
        widgetTypeId,
        position: {
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          ...(item.minW != null ? { minW: item.minW } : {}),
          ...(item.minH != null ? { minH: item.minH } : {}),
        },
        config: defaultConfig,
      });
    }

    const dashboard: Dashboard = {
      id: crypto.randomUUID(),
      name: "Dashboard",
      instances,
      filter: {},
    };

    // Remove legacy keys
    try {
      localStorage.removeItem(LEGACY_LAYOUTS_KEY);
    } catch {
      /* private browsing */
    }
    try {
      localStorage.removeItem(LEGACY_VISIBILITY_KEY);
    } catch {
      /* private browsing */
    }

    return { dashboards: [dashboard] };
  } catch {
    return null;
  }
}

// ── sessionStorage helpers ──

function readSessionActiveDashboard(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function writeSessionActiveDashboard(id: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, id);
  } catch {
    // private browsing mode — silently ignore
  }
}

// ── Debounced persist with retry ──

function createDebouncedPersist(delayMs: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function persistWithRetry(dashboards: Dashboard[], attempt = 0): Promise<void> {
    const maxAttempts = 3;
    const backoffDelays = [1000, 2000, 4000];

    const payload: PersistedDashboardState = {
      version: CURRENT_LAYOUT_VERSION,
      dashboards,
    };

    try {
      const response = await fetch("/api/layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        // 404 means the endpoint doesn't exist (not running via burkut serve) — don't retry
        if (response.status === 404) {
          return;
        }
        throw new Error(`POST /api/layouts failed: ${response.status}`);
      }
    } catch (err) {
      if (attempt < maxAttempts - 1) {
        const delay = backoffDelays[attempt] ?? 4000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return persistWithRetry(dashboards, attempt + 1);
      }
      console.warn("Failed to persist dashboard layouts after retries:", err);
    }
  }

  return (dashboards: Dashboard[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      persistWithRetry(dashboards);
    }, delayMs);
  };
}

// ── Hydration ──

async function hydrateFromServer(): Promise<Dashboard[] | null> {
  try {
    const response = await fetch("/api/layouts");
    if (!response.ok) return null;

    const data: unknown = await response.json();
    if (
      data &&
      typeof data === "object" &&
      "dashboards" in data &&
      Array.isArray((data as PersistedDashboardState).dashboards)
    ) {
      // Upgrade documents written by an older version of the app (e.g. one
      // that still used pre-rename widgetTypeId values) before they reach
      // the store, so a stale on-disk version never surfaces "Unknown Widget".
      const { dashboards } = migrateLayoutDocument(data);
      return dashboards;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Middleware implementation ──

const persistenceMiddlewareImpl: PersistenceMiddleware = (f) => (set, get, api) => {
  let prevDashboards: Dashboard[] | null = null;
  const debouncedPersist = createDebouncedPersist(500);

  // biome-ignore lint/suspicious/noExplicitAny: Zustand v5 set() overloads require cast for middleware wrapping
  const wrappedSet: typeof set = ((partial: any, replace: any) => {
    // biome-ignore lint/suspicious/noExplicitAny: forwarding args to original set
    (set as any)(partial, replace);

    const state = get();
    const currentDashboards = state.dashboards;

    // Persist shared state on dashboards change (shallow reference check)
    if (currentDashboards !== prevDashboards) {
      prevDashboards = currentDashboards;
      debouncedPersist(currentDashboards);
    }

    // Persist active dashboard ID to sessionStorage on change
    writeSessionActiveDashboard(state.activeDashboardId);
  }) as typeof set;

  const initialState = f(wrappedSet, get, api);
  prevDashboards = initialState.dashboards ?? null;

  // Async hydration — runs after store creation without blocking
  queueMicrotask(async () => {
    // 1. Try server hydration
    let dashboards = await hydrateFromServer();

    // 2. If server has no data, try legacy migration
    if (!dashboards) {
      const migrated = migrateFromLocalStorage();
      if (migrated) {
        dashboards = migrated.dashboards;
        // Persist the migrated data to server
        debouncedPersist(dashboards);
      }
    }

    // 3. If we got dashboards, hydrate the store
    if (dashboards && dashboards.length > 0) {
      const state = get();
      state._mergeSharedState({ dashboards });
      prevDashboards = dashboards;

      // Resolve active dashboard from sessionStorage
      const storedActiveId = readSessionActiveDashboard();
      const activeExists = storedActiveId ? dashboards.some((d) => d.id === storedActiveId) : false;

      const resolvedActiveId = activeExists && storedActiveId ? storedActiveId : dashboards[0].id;

      // biome-ignore lint/suspicious/noExplicitAny: need to set activeDashboardId directly
      (set as any)({ activeDashboardId: resolvedActiveId });
      writeSessionActiveDashboard(resolvedActiveId);
    } else {
      // No persisted data — resolve active dashboard from sessionStorage against defaults
      const state = get();
      const storedActiveId = readSessionActiveDashboard();
      const activeExists = storedActiveId
        ? state.dashboards.some((d) => d.id === storedActiveId)
        : false;

      if (activeExists && storedActiveId !== state.activeDashboardId) {
        // biome-ignore lint/suspicious/noExplicitAny: need to set activeDashboardId directly
        (set as any)({ activeDashboardId: storedActiveId });
      }
      writeSessionActiveDashboard(state.activeDashboardId);
    }
  });

  return initialState;
};

export const persistenceMiddleware = persistenceMiddlewareImpl as PersistenceMiddleware;
