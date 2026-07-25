export const WIDGET_IDS = {
  sidebar: "sidebar",
  content: "content",
  map: "map",
  timeline: "timeline",
} as const;

export type WidgetId = (typeof WIDGET_IDS)[keyof typeof WIDGET_IDS];

export interface WidgetRegistryEntry {
  id: WidgetId;
  titleKey: string;
}

export const WIDGET_REGISTRY: WidgetRegistryEntry[] = [
  { id: WIDGET_IDS.sidebar, titleKey: "panels.sidebar" },
  { id: WIDGET_IDS.content, titleKey: "panels.content" },
  { id: WIDGET_IDS.map, titleKey: "panels.map" },
  { id: WIDGET_IDS.timeline, titleKey: "panels.timeline" },
];
