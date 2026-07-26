import { describe, expect, it } from "vitest";
import type {
  MapWidgetConfig,
  SidebarWidgetConfig,
  TimelineWidgetConfig,
  WidgetConfig,
} from "../../shared/types.ts";
import { getWidgetType } from "./widgetTypeRegistry.ts";

function roundTrip(typeId: string, config: WidgetConfig): WidgetConfig {
  const typeDef = getWidgetType(typeId);
  if (!typeDef) throw new Error(`Missing widget type: ${typeId}`);
  return typeDef.fromSchemaConfig(typeDef.toSchemaConfig(config));
}

describe("widget type options schema mappings", () => {
  it("round-trips TreeList filters and the all-as-null convention", () => {
    const config: SidebarWidgetConfig = { type: "sidebar", tags: ["history"], contentType: null };
    expect(roundTrip("tree-list", config)).toEqual(config);
  });

  it("round-trips MarkdownViewer pinned item IDs", () => {
    const config: WidgetConfig = { type: "content", pinnedItemId: "item-1" };
    expect(roundTrip("markdown-viewer", config)).toEqual(config);
    expect(roundTrip("markdown-viewer", { type: "content", pinnedItemId: null })).toEqual({
      type: "content",
      pinnedItemId: null,
    });
  });

  it("round-trips GeoMap bounds and zoom", () => {
    const config: MapWidgetConfig = {
      type: "map",
      boundingBox: { north: 42.1, south: 35.2, east: 110.4, west: 100.8 },
      zoomLevel: 7,
    };
    expect(roundTrip("geo-map", config)).toEqual(config);
  });

  it("round-trips LinearTimeline date bounds", () => {
    const config: TimelineWidgetConfig = {
      type: "timeline",
      startDate: "0581-01-01",
      endDate: "0618-01-01",
    };
    expect(roundTrip("linear-timeline", config)).toEqual(config);
  });
});
