import type { ContentFilter, GridPosition, WidgetConfig } from "../shared/types.ts";

export interface DashboardTemplate {
  templateId: string;
  nameKey: string;
  descriptionKey: string;
  instances: Array<{
    widgetTypeId: string;
    position: GridPosition;
    config: WidgetConfig;
  }>;
  filter: ContentFilter;
}

const templates: Record<string, DashboardTemplate> = {};

function registerBuiltInTemplates(): void {
  const builtIns: DashboardTemplate[] = [
    {
      templateId: "daily",
      nameKey: "template.daily",
      descriptionKey: "template.daily.description",
      instances: [
        {
          widgetTypeId: "tree-list",
          position: { x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 2 },
          config: { type: "sidebar", tags: [], contentType: null },
        },
        {
          widgetTypeId: "markdown-viewer",
          position: { x: 3, y: 0, w: 5, h: 8, minW: 2, minH: 2 },
          config: { type: "content", pinnedItemId: null },
        },
        {
          widgetTypeId: "linear-timeline",
          position: { x: 0, y: 8, w: 12, h: 4, minW: 2, minH: 2 },
          config: { type: "timeline", startDate: null, endDate: null },
        },
      ],
      filter: {},
    },
    {
      templateId: "monthly",
      nameKey: "template.monthly",
      descriptionKey: "template.monthly.description",
      instances: [
        {
          widgetTypeId: "linear-timeline",
          position: { x: 0, y: 0, w: 8, h: 6, minW: 2, minH: 2 },
          config: { type: "timeline", startDate: null, endDate: null },
        },
        {
          widgetTypeId: "geo-map",
          position: { x: 8, y: 0, w: 4, h: 6, minW: 2, minH: 2 },
          config: { type: "map", boundingBox: null, zoomLevel: null },
        },
      ],
      filter: {},
    },
    {
      templateId: "travel",
      nameKey: "template.travel",
      descriptionKey: "template.travel.description",
      instances: [
        {
          widgetTypeId: "geo-map",
          position: { x: 0, y: 0, w: 6, h: 8, minW: 2, minH: 2 },
          config: { type: "map", boundingBox: null, zoomLevel: null },
        },
        {
          widgetTypeId: "markdown-viewer",
          position: { x: 6, y: 0, w: 6, h: 8, minW: 2, minH: 2 },
          config: { type: "content", pinnedItemId: null },
        },
        {
          widgetTypeId: "tree-list",
          position: { x: 0, y: 8, w: 12, h: 4, minW: 2, minH: 2 },
          config: { type: "sidebar", tags: ["travel"], contentType: null },
        },
      ],
      filter: {},
    },
    {
      templateId: "overview",
      nameKey: "template.overview",
      descriptionKey: "template.overview.description",
      instances: [
        {
          widgetTypeId: "tree-list",
          position: { x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 2 },
          config: { type: "sidebar", tags: [], contentType: null },
        },
        {
          widgetTypeId: "markdown-viewer",
          position: { x: 3, y: 0, w: 5, h: 8, minW: 2, minH: 2 },
          config: { type: "content", pinnedItemId: null },
        },
        {
          widgetTypeId: "geo-map",
          position: { x: 8, y: 0, w: 4, h: 8, minW: 2, minH: 2 },
          config: { type: "map", boundingBox: null, zoomLevel: null },
        },
        {
          widgetTypeId: "linear-timeline",
          position: { x: 0, y: 8, w: 12, h: 4, minW: 2, minH: 2 },
          config: { type: "timeline", startDate: null, endDate: null },
        },
      ],
      filter: {},
    },
  ];

  for (const template of builtIns) {
    templates[template.templateId] = template;
  }
}

registerBuiltInTemplates();

export function registerTemplate(template: DashboardTemplate): void {
  templates[template.templateId] = template;
}

export function getTemplate(templateId: string): DashboardTemplate | undefined {
  return templates[templateId];
}

export function getAllTemplates(): DashboardTemplate[] {
  return Object.values(templates);
}
