import { describe, expect, it } from "vitest";
import type { Dashboard } from "../shared/types.ts";
import {
  CURRENT_LAYOUT_VERSION,
  migrateLayoutDocument,
  V1_TO_V2_WIDGET_TYPE_ID_MAP,
} from "./layoutMigrations.ts";

function v1Dashboard(): Dashboard {
  return {
    id: "dash-1",
    name: "Dashboard",
    instances: [
      {
        instanceId: "inst-1",
        widgetTypeId: "sidebar",
        position: { x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 2 },
        config: { type: "sidebar", tags: [], contentType: null },
      },
      {
        instanceId: "inst-2",
        widgetTypeId: "content",
        position: { x: 3, y: 0, w: 5, h: 8, minW: 2, minH: 2 },
        config: { type: "content", pinnedItemId: null },
      },
      {
        instanceId: "inst-3",
        widgetTypeId: "map",
        position: { x: 8, y: 0, w: 4, h: 8, minW: 2, minH: 2 },
        config: { type: "map", boundingBox: null, zoomLevel: null },
      },
      {
        instanceId: "inst-4",
        widgetTypeId: "timeline",
        position: { x: 0, y: 8, w: 12, h: 4, minW: 2, minH: 2 },
        config: { type: "timeline", startDate: null, endDate: null },
      },
    ],
    filter: {},
  };
}

describe("migrateLayoutDocument", () => {
  it("upgrades a v1 document's widgetTypeId values to v2 and bumps version", () => {
    const input = { version: 1, dashboards: [v1Dashboard()] };
    const result = migrateLayoutDocument(input);

    expect(result.version).toBe(CURRENT_LAYOUT_VERSION);
    const ids = result.dashboards[0].instances.map((i) => i.widgetTypeId);
    expect(ids).toEqual(["tree-list", "markdown-viewer", "geo-map", "linear-timeline"]);
  });

  it("preserves everything else about the instance (position, config, instanceId)", () => {
    const input = { version: 1, dashboards: [v1Dashboard()] };
    const result = migrateLayoutDocument(input);
    const original = v1Dashboard().instances[0];
    const migrated = result.dashboards[0].instances[0];

    expect(migrated.instanceId).toBe(original.instanceId);
    expect(migrated.position).toEqual(original.position);
    expect(migrated.config).toEqual(original.config);
  });

  it("is a no-op for a document already at CURRENT_LAYOUT_VERSION", () => {
    const dashboards = [
      {
        ...v1Dashboard(),
        instances: v1Dashboard().instances.map((i) => ({
          ...i,
          widgetTypeId: V1_TO_V2_WIDGET_TYPE_ID_MAP[i.widgetTypeId],
        })),
      },
    ];
    const input = { version: CURRENT_LAYOUT_VERSION, dashboards };
    const result = migrateLayoutDocument(input);
    expect(result).toEqual(input);
  });

  it("treats a document with no version field as v1 and migrates it", () => {
    const input = { dashboards: [v1Dashboard()] };
    const result = migrateLayoutDocument(input);
    expect(result.version).toBe(CURRENT_LAYOUT_VERSION);
    expect(result.dashboards[0].instances[0].widgetTypeId).toBe("tree-list");
  });

  it("passes unknown/custom widgetTypeId values through unmigrated", () => {
    const custom: Dashboard = {
      id: "dash-2",
      name: "Custom",
      instances: [
        {
          instanceId: "inst-x",
          widgetTypeId: "third-party-widget",
          position: { x: 0, y: 0, w: 2, h: 2 },
          config: { type: "sidebar", tags: [], contentType: null },
        },
      ],
      filter: {},
    };
    const result = migrateLayoutDocument({ version: 1, dashboards: [custom] });
    expect(result.dashboards[0].instances[0].widgetTypeId).toBe("third-party-widget");
  });

  it("handles malformed input gracefully (missing dashboards array)", () => {
    const result = migrateLayoutDocument({ version: 1 });
    expect(result).toEqual({ version: CURRENT_LAYOUT_VERSION, dashboards: [] });
  });

  it("handles null/undefined input gracefully", () => {
    expect(migrateLayoutDocument(null)).toEqual({
      version: CURRENT_LAYOUT_VERSION,
      dashboards: [],
    });
    expect(migrateLayoutDocument(undefined)).toEqual({
      version: CURRENT_LAYOUT_VERSION,
      dashboards: [],
    });
  });
});
