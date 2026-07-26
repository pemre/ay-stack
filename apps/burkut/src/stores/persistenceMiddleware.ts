import type { PersistenceAdapter } from "@ay/ui-library";
import { createPersistenceMiddleware, validateWidgetConfig } from "@ay/ui-library";
import type { StateCreator, StoreMutatorIdentifier } from "zustand";
import { getWidgetType } from "../components/WidgetGrid/widgetTypeRegistry.ts";
import type {
  Dashboard,
  PersistedDashboardState,
  WidgetConfig,
  WidgetInstance,
} from "../shared/types.ts";
import { httpLayoutPersistenceAdapter } from "./httpPersistenceAdapter.ts";
import { CURRENT_LAYOUT_VERSION, V1_TO_V2_WIDGET_TYPE_ID_MAP } from "./layoutMigrations.ts";

const persistenceAdapter: PersistenceAdapter<PersistedDashboardState> = {
  async load() {
    let persisted: PersistedDashboardState | null = null;
    try {
      persisted = await httpLayoutPersistenceAdapter.load();
    } catch {
      // The dev endpoint may be unavailable when the app is opened statically.
    }
    if (persisted) return persisted;

    const migrated = migrateFromLocalStorage();
    return migrated ? { version: CURRENT_LAYOUT_VERSION, ...migrated } : null;
  },
  save: (state) => httpLayoutPersistenceAdapter.save(state),
};

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
      const isVisible = Object.keys(visibility).length > 0 ? visibility[legacyWidgetTypeId] : true;
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

// ── Middleware implementation ──

const persistenceMiddlewareImpl = (f: StateCreator<StoreWithPersistence>) =>
  (
    createPersistenceMiddleware<PersistedDashboardState, StoreWithPersistence>({
      adapter: persistenceAdapter,
      currentVersion: CURRENT_LAYOUT_VERSION,
      migrations: {},
      getPersistedSlice: (state) => ({
        version: CURRENT_LAYOUT_VERSION,
        dashboards: state.dashboards,
      }),
      mergeHydratedState: (set, hydrated) => {
        const dashboards = hydrated.dashboards.map((dashboard) => ({
          ...dashboard,
          instances: dashboard.instances.map((instance) => {
            const typeDef = getWidgetType(instance.widgetTypeId);
            return typeDef
              ? {
                  ...instance,
                  config: validateWidgetConfig(typeDef, instance.config) as WidgetConfig,
                }
              : instance;
          }),
        }));
        const storedActiveId = readSessionActiveDashboard();
        const activeDashboardId =
          storedActiveId && dashboards.some((dashboard) => dashboard.id === storedActiveId)
            ? storedActiveId
            : dashboards[0]?.id;
        set({ dashboards, ...(activeDashboardId ? { activeDashboardId } : {}) });
        if (activeDashboardId) writeSessionActiveDashboard(activeDashboardId);
      },
    }) as unknown as (
      creator: StateCreator<StoreWithPersistence>,
    ) => StateCreator<StoreWithPersistence>
  )((set, get, api) => {
    const wrappedSet: typeof set = ((partial, replace) => {
      (set as (partial: unknown, replace?: boolean) => void)(partial, replace);
      writeSessionActiveDashboard(get().activeDashboardId);
    }) as typeof set;
    const initialState = f(wrappedSet, get, api);
    writeSessionActiveDashboard(initialState.activeDashboardId);
    return initialState;
  });

export const persistenceMiddleware = persistenceMiddlewareImpl as unknown as PersistenceMiddleware;
