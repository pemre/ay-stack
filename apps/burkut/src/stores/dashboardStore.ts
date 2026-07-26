import { validateWidgetConfig } from "@ay/ui-library";
import { create } from "zustand";
import { getWidgetType } from "../components/WidgetGrid/widgetTypeRegistry.ts";
import type {
  ContentFilter,
  Dashboard,
  GridPosition,
  WidgetConfig,
  WidgetInstance,
} from "../shared/types.ts";
import { broadcastMiddleware } from "./broadcastMiddleware.ts";
import { persistenceMiddleware } from "./persistenceMiddleware.ts";
import { getTemplate } from "./templateRegistry.ts";

// ── Shared state (synced across tabs, persisted to disk) ──

export interface SharedState {
  dashboards: Dashboard[];
}

// ── Local state (per-tab, NOT synced) ──

interface LocalState {
  activeDashboardId: string;
}

// ── Actions ──

interface DashboardActions {
  createDashboard: (templateId?: string) => void;
  deleteDashboard: (dashboardId: string) => void;
  renameDashboard: (dashboardId: string, name: string) => void;
  setActiveDashboard: (dashboardId: string) => void;
  reorderDashboards: (fromIndex: number, toIndex: number) => void;

  addWidgetInstance: (dashboardId: string, widgetTypeId: string) => void;
  removeWidgetInstance: (dashboardId: string, instanceId: string) => void;
  duplicateWidgetInstance: (dashboardId: string, instanceId: string) => void;
  updateWidgetConfig: (
    dashboardId: string,
    instanceId: string,
    config: Partial<WidgetConfig>,
  ) => void;
  updateWidgetLayout: (dashboardId: string, instanceId: string, layout: GridPosition) => void;

  updateDashboardFilter: (dashboardId: string, filter: ContentFilter) => void;
  resetDashboardLayout: (dashboardId: string) => void;
  onLayoutChange: (dashboardId: string, layouts: any) => void;

  _mergeSharedState: (incoming: SharedState) => void;
}

export type DashboardStore = SharedState & LocalState & DashboardActions;

// ── Default widget instance definitions ──

const DEFAULT_INSTANCE_DEFS: {
  widgetTypeId: string;
  position: GridPosition;
}[] = [
  { widgetTypeId: "tree-list", position: { x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 2 } },
  { widgetTypeId: "markdown-viewer", position: { x: 3, y: 0, w: 5, h: 8, minW: 2, minH: 2 } },
  { widgetTypeId: "geo-map", position: { x: 8, y: 0, w: 4, h: 8, minW: 2, minH: 2 } },
  { widgetTypeId: "linear-timeline", position: { x: 0, y: 8, w: 12, h: 4, minW: 2, minH: 2 } },
];

// ── Helpers ──

function createWidgetInstance(widgetTypeId: string, position: GridPosition): WidgetInstance {
  const typeDef = getWidgetType(widgetTypeId);
  const config: WidgetConfig = typeDef
    ? { ...typeDef.defaultConfig }
    : { type: "sidebar", tags: [], contentType: null };

  return {
    instanceId: crypto.randomUUID(),
    widgetTypeId,
    position,
    config,
  };
}

export function createDefaultDashboard(): Dashboard {
  return {
    id: crypto.randomUUID(),
    name: "Dashboard",
    instances: DEFAULT_INSTANCE_DEFS.map((def) =>
      createWidgetInstance(def.widgetTypeId, { ...def.position }),
    ),
    filter: {},
  };
}

export function findNearestDashboard(
  dashboards: Dashboard[],
  deletedIndex: number,
): Dashboard | undefined {
  if (dashboards.length === 0) return undefined;
  if (deletedIndex > 0) return dashboards[deletedIndex - 1];
  return dashboards[0];
}

function mapDashboard(
  dashboards: Dashboard[],
  dashboardId: string,
  fn: (d: Dashboard) => Dashboard,
): Dashboard[] {
  return dashboards.map((d) => (d.id === dashboardId ? fn(d) : d));
}

// ── Store ──

const defaultDashboard = createDefaultDashboard();

export const useDashboardStore = create<DashboardStore>()(
  persistenceMiddleware(
    broadcastMiddleware((set, get) => ({
      // ── Shared state ──
      dashboards: [defaultDashboard],

      // ── Local state ──
      activeDashboardId: defaultDashboard.id,

      // ── Dashboard CRUD ──

      createDashboard: (templateId?: string) => {
        const state = get();

        let newDashboard: Dashboard;

        if (templateId === "blank") {
          newDashboard = {
            id: crypto.randomUUID(),
            name: `Dashboard ${state.dashboards.length + 1}`,
            instances: [],
            filter: {},
          };
        } else if (templateId !== undefined) {
          const template = getTemplate(templateId);
          if (template) {
            newDashboard = {
              id: crypto.randomUUID(),
              name: templateId.charAt(0).toUpperCase() + templateId.slice(1),
              instances: template.instances.map((inst) => ({
                instanceId: crypto.randomUUID(),
                widgetTypeId: inst.widgetTypeId,
                position: { ...inst.position },
                config: { ...inst.config } as WidgetConfig,
              })),
              filter: { ...template.filter },
            };
          } else {
            // Unknown template ID — fall back to defaults
            newDashboard = {
              id: crypto.randomUUID(),
              name: `Dashboard ${state.dashboards.length + 1}`,
              instances: DEFAULT_INSTANCE_DEFS.map((def) =>
                createWidgetInstance(def.widgetTypeId, { ...def.position }),
              ),
              filter: {},
            };
          }
        } else {
          // No templateId — current default behavior
          newDashboard = {
            id: crypto.randomUUID(),
            name: `Dashboard ${state.dashboards.length + 1}`,
            instances: DEFAULT_INSTANCE_DEFS.map((def) =>
              createWidgetInstance(def.widgetTypeId, { ...def.position }),
            ),
            filter: {},
          };
        }

        set({
          dashboards: [...state.dashboards, newDashboard],
          activeDashboardId: newDashboard.id,
        });
      },

      deleteDashboard: (dashboardId: string) => {
        const state = get();
        if (state.dashboards.length <= 1) return;

        const deletedIndex = state.dashboards.findIndex((d) => d.id === dashboardId);
        if (deletedIndex === -1) return;

        const remaining = state.dashboards.filter((d) => d.id !== dashboardId);
        const updates: Partial<DashboardStore> = { dashboards: remaining };

        if (state.activeDashboardId === dashboardId) {
          const nearest = findNearestDashboard(remaining, deletedIndex);
          if (nearest) {
            updates.activeDashboardId = nearest.id;
          }
        }

        set(updates);
      },

      renameDashboard: (dashboardId: string, name: string) => {
        const trimmed = name.trim();
        if (trimmed.length === 0) return;

        set({
          dashboards: mapDashboard(get().dashboards, dashboardId, (d) => ({
            ...d,
            name: trimmed,
          })),
        });
      },

      setActiveDashboard: (dashboardId: string) => {
        set({ activeDashboardId: dashboardId });
      },

      reorderDashboards: (fromIndex: number, toIndex: number) => {
        const state = get();
        const dashboards = [...state.dashboards];
        if (
          fromIndex < 0 ||
          fromIndex >= dashboards.length ||
          toIndex < 0 ||
          toIndex >= dashboards.length
        ) {
          return;
        }
        const [moved] = dashboards.splice(fromIndex, 1);
        dashboards.splice(toIndex, 0, moved);
        set({ dashboards });
      },

      // ── Widget instance management ──

      addWidgetInstance: (dashboardId: string, widgetTypeId: string) => {
        const typeDef = getWidgetType(widgetTypeId);
        if (!typeDef) return;

        const instance = createWidgetInstance(widgetTypeId, {
          x: 0,
          y: 0,
          w: typeDef.defaultSize.w,
          h: typeDef.defaultSize.h,
          minW: typeDef.minSize.w,
          minH: typeDef.minSize.h,
        });

        set({
          dashboards: mapDashboard(get().dashboards, dashboardId, (d) => ({
            ...d,
            instances: [...d.instances, instance],
          })),
        });
      },

      removeWidgetInstance: (dashboardId: string, instanceId: string) => {
        set({
          dashboards: mapDashboard(get().dashboards, dashboardId, (d) => ({
            ...d,
            instances: d.instances.filter((inst) => inst.instanceId !== instanceId),
          })),
        });
      },

      duplicateWidgetInstance: (dashboardId: string, instanceId: string) => {
        const state = get();
        const dashboard = state.dashboards.find((d) => d.id === dashboardId);
        if (!dashboard) return;

        const source = dashboard.instances.find((inst) => inst.instanceId === instanceId);
        if (!source) return;

        const duplicate: WidgetInstance = {
          instanceId: crypto.randomUUID(),
          widgetTypeId: source.widgetTypeId,
          position: { ...source.position, x: source.position.x + 1, y: source.position.y + 1 },
          config: { ...source.config },
        };

        set({
          dashboards: mapDashboard(state.dashboards, dashboardId, (d) => ({
            ...d,
            instances: [...d.instances, duplicate],
          })),
        });
      },

      updateWidgetConfig: (
        dashboardId: string,
        instanceId: string,
        config: Partial<WidgetConfig>,
      ) => {
        set({
          dashboards: mapDashboard(get().dashboards, dashboardId, (d) => ({
            ...d,
            instances: d.instances.map((inst) =>
              inst.instanceId === instanceId
                ? {
                    ...inst,
                    config: validateWidgetConfig(
                      getWidgetType(inst.widgetTypeId) ?? { defaultConfig: inst.config },
                      { ...inst.config, ...config },
                    ) as WidgetConfig,
                  }
                : inst,
            ),
          })),
        });
      },

      updateWidgetLayout: (dashboardId: string, instanceId: string, layout: GridPosition) => {
        set({
          dashboards: mapDashboard(get().dashboards, dashboardId, (d) => ({
            ...d,
            instances: d.instances.map((inst) =>
              inst.instanceId === instanceId ? { ...inst, position: layout } : inst,
            ),
          })),
        });
      },

      // ── Dashboard-level filter ──

      updateDashboardFilter: (dashboardId: string, filter: ContentFilter) => {
        set({
          dashboards: mapDashboard(get().dashboards, dashboardId, (d) => ({
            ...d,
            filter,
          })),
        });
      },

      // ── Layout operations ──

      resetDashboardLayout: (dashboardId: string) => {
        set({
          dashboards: mapDashboard(get().dashboards, dashboardId, (d) => ({
            ...d,
            instances: DEFAULT_INSTANCE_DEFS.map((def) =>
              createWidgetInstance(def.widgetTypeId, { ...def.position }),
            ),
          })),
        });
      },

      onLayoutChange: (dashboardId: string, layouts: any) => {
        if (!Array.isArray(layouts)) return;

        set({
          dashboards: mapDashboard(get().dashboards, dashboardId, (d) => ({
            ...d,
            instances: d.instances.map((inst) => {
              const layoutItem = layouts.find((l: any) => l.i === inst.instanceId);
              if (!layoutItem) return inst;
              return {
                ...inst,
                position: {
                  x: layoutItem.x,
                  y: layoutItem.y,
                  w: layoutItem.w,
                  h: layoutItem.h,
                  minW: layoutItem.minW ?? inst.position.minW,
                  minH: layoutItem.minH ?? inst.position.minH,
                },
              };
            }),
          })),
        });
      },

      // ── Cross-tab sync ──

      _mergeSharedState: (incoming: SharedState) => {
        const state = get();
        const updates: Partial<DashboardStore> = { dashboards: incoming.dashboards };

        // If the active dashboard was deleted in the incoming state, fall back
        const activeStillExists = incoming.dashboards.some((d) => d.id === state.activeDashboardId);

        if (!activeStillExists && incoming.dashboards.length > 0) {
          // Find the nearest remaining dashboard based on old position
          const oldIndex = state.dashboards.findIndex((d) => d.id === state.activeDashboardId);
          const nearest = findNearestDashboard(incoming.dashboards, oldIndex);
          if (nearest) {
            updates.activeDashboardId = nearest.id;
          } else {
            updates.activeDashboardId = incoming.dashboards[0].id;
          }
        }

        set(updates);
      },
    })),
  ),
);
