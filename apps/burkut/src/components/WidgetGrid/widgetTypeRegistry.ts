import type { ComponentType } from "react";
import type { WidgetConfig } from "../../shared/types.ts";
import ContentPanel from "../ContentPanel/ContentPanel.tsx";
import MapPanel from "../MapPanel/MapPanel.tsx";
import Sidebar from "../Sidebar/Sidebar.tsx";
import TimelinePanel from "../TimelinePanel/TimelinePanel.tsx";

export interface WidgetTypeDefinition {
  typeId: string;
  titleKey: string;
  descriptionKey: string;
  component: ComponentType<any>;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  defaultConfig: WidgetConfig;
}

const widgetTypes: Record<string, WidgetTypeDefinition> = {};

function registerBuiltInTypes(): void {
  const builtIns: WidgetTypeDefinition[] = [
    {
      typeId: "sidebar",
      titleKey: "panels.sidebar",
      descriptionKey: "panels.sidebar.description",
      component: Sidebar,
      defaultSize: { w: 3, h: 8 },
      minSize: { w: 2, h: 2 },
      defaultConfig: { type: "sidebar", tags: [], contentType: null },
    },
    {
      typeId: "content",
      titleKey: "panels.content",
      descriptionKey: "panels.content.description",
      component: ContentPanel,
      defaultSize: { w: 5, h: 8 },
      minSize: { w: 2, h: 2 },
      defaultConfig: { type: "content", pinnedItemId: null },
    },
    {
      typeId: "map",
      titleKey: "panels.map",
      descriptionKey: "panels.map.description",
      component: MapPanel,
      defaultSize: { w: 4, h: 8 },
      minSize: { w: 2, h: 2 },
      defaultConfig: { type: "map", boundingBox: null, zoomLevel: null },
    },
    {
      typeId: "timeline",
      titleKey: "panels.timeline",
      descriptionKey: "panels.timeline.description",
      component: TimelinePanel,
      defaultSize: { w: 12, h: 4 },
      minSize: { w: 2, h: 2 },
      defaultConfig: { type: "timeline", startDate: null, endDate: null },
    },
  ];

  for (const def of builtIns) {
    widgetTypes[def.typeId] = def;
  }
}

registerBuiltInTypes();

export function registerWidgetType(definition: WidgetTypeDefinition): void {
  widgetTypes[definition.typeId] = definition;
}

export function getWidgetType(typeId: string): WidgetTypeDefinition | undefined {
  return widgetTypes[typeId];
}

export function getAllWidgetTypes(): WidgetTypeDefinition[] {
  return Object.values(widgetTypes);
}
