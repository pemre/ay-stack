import {
  createWidgetRegistry,
  type WidgetTypeDefinition as EngineWidgetTypeDefinition,
  GeoMap,
  LinearTimeline,
  MarkdownViewer,
  type OptionsSchema,
  TreeList,
} from "@ay/ui-library";
import type { TFunction } from "i18next";
import {
  buildContentViewModel,
  buildGeoFeatures,
  buildSidebarTree,
  buildTimelineItems,
} from "../../adapters/contentAdapters.ts";
import type {
  ContentIndex,
  ContentType,
  MapWidgetConfig,
  SidebarWidgetConfig,
  TimelineWidgetConfig,
  WidgetConfig,
} from "../../shared/types.ts";

export type SchemaConfig = Record<string, unknown>;

export interface WidgetRenderContext {
  index: ContentIndex;
  getFilteredIndex: (config: WidgetConfig) => ContentIndex;
  getContent: (id: string) => string | null;
  selectedId: string | null;
  onSelectItem: (id: string) => void;
  isComplete?: (id: string) => boolean;
  onToggleComplete?: (id: string) => void;
  completedSet?: Set<string>;
  hiddenGroups: Set<string>;
  theme: "light" | "dark";
  t: TFunction;
}

export interface WidgetTypeDefinition
  extends Omit<EngineWidgetTypeDefinition<WidgetRenderContext>, "defaultConfig" | "buildProps"> {
  defaultConfig: WidgetConfig;
  toSchemaConfig: (config: WidgetConfig) => SchemaConfig;
  fromSchemaConfig: (config: SchemaConfig) => WidgetConfig;
  buildProps: (ctx: WidgetRenderContext, config: SchemaConfig) => Record<string, unknown>;
}

/**
 * Shared context every widget's `buildProps` is invoked with. Assembled once
 * per render by `WidgetGrid` from app-level state (selection, progress,
 * theme, i18n) and handed to whichever widget type is being rendered --
 * this is what lets `WidgetGrid` resolve props generically instead of
 * switching on `widgetTypeId`.
 */
const TILE_LIGHT = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export const treeListOptionsSchema: OptionsSchema = [
  { kind: "stringArray", key: "tags", label: "Tags", default: [] },
  {
    kind: "enum",
    key: "contentType",
    label: "Content type",
    options: ["all", "markdown", "image", "video", "audio"],
    default: "all",
  },
];

export const markdownViewerOptionsSchema: OptionsSchema = [
  { kind: "string", key: "pinnedItemId", label: "Pinned item ID", default: "" },
];

export const geoMapOptionsSchema: OptionsSchema = [
  { kind: "number", key: "boundingBoxNorth", label: "North", default: 0 },
  { kind: "number", key: "boundingBoxSouth", label: "South", default: 0 },
  { kind: "number", key: "boundingBoxEast", label: "East", default: 0 },
  { kind: "number", key: "boundingBoxWest", label: "West", default: 0 },
  {
    kind: "number",
    key: "zoomLevel",
    label: "Zoom level",
    default: null,
    min: 0,
    max: 20,
    step: 1,
  },
];

export const linearTimelineOptionsSchema: OptionsSchema = [
  { kind: "dateString", key: "startDate", label: "Start date", default: null },
  { kind: "dateString", key: "endDate", label: "End date", default: null },
];

function toTreeListConfig(config: WidgetConfig): SchemaConfig {
  const value = config as SidebarWidgetConfig;
  return { tags: value.tags, contentType: value.contentType ?? "all" };
}

function fromTreeListConfig(config: SchemaConfig): WidgetConfig {
  return {
    type: "sidebar",
    tags: Array.isArray(config.tags)
      ? config.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    contentType: config.contentType === "all" ? null : (config.contentType as ContentType),
  };
}

function toMarkdownViewerConfig(config: WidgetConfig): SchemaConfig {
  return { pinnedItemId: (config as { pinnedItemId: string | null }).pinnedItemId ?? "" };
}

function fromMarkdownViewerConfig(config: SchemaConfig): WidgetConfig {
  return {
    type: "content",
    pinnedItemId:
      typeof config.pinnedItemId === "string" && config.pinnedItemId ? config.pinnedItemId : null,
  };
}

function toGeoMapConfig(config: WidgetConfig): SchemaConfig {
  const value = config as MapWidgetConfig;
  return {
    boundingBoxNorth: value.boundingBox?.north ?? 0,
    boundingBoxSouth: value.boundingBox?.south ?? 0,
    boundingBoxEast: value.boundingBox?.east ?? 0,
    boundingBoxWest: value.boundingBox?.west ?? 0,
    zoomLevel: value.zoomLevel,
  };
}

function fromGeoMapConfig(config: SchemaConfig): WidgetConfig {
  const north = Number(config.boundingBoxNorth ?? 0);
  const south = Number(config.boundingBoxSouth ?? 0);
  const east = Number(config.boundingBoxEast ?? 0);
  const west = Number(config.boundingBoxWest ?? 0);
  const boundingBox =
    north === 0 && south === 0 && east === 0 && west === 0 ? null : { north, south, east, west };
  return {
    type: "map",
    boundingBox,
    zoomLevel: typeof config.zoomLevel === "number" ? config.zoomLevel : null,
  };
}

function toLinearTimelineConfig(config: WidgetConfig): SchemaConfig {
  const value = config as TimelineWidgetConfig;
  return { startDate: value.startDate, endDate: value.endDate };
}

function fromLinearTimelineConfig(config: SchemaConfig): WidgetConfig {
  return {
    type: "timeline",
    startDate: typeof config.startDate === "string" ? config.startDate : null,
    endDate: typeof config.endDate === "string" ? config.endDate : null,
  };
}

const widgetRegistry = createWidgetRegistry<WidgetRenderContext>();

function registerDefinition(definition: WidgetTypeDefinition): void {
  widgetRegistry.register(definition as EngineWidgetTypeDefinition<WidgetRenderContext>);
}

const builtIns: WidgetTypeDefinition[] = [
  {
    typeId: "tree-list",
    titleKey: "panels.sidebar",
    descriptionKey: "panels.sidebar.description",
    component: TreeList,
    defaultSize: { w: 3, h: 8 },
    minSize: { w: 2, h: 2 },
    defaultConfig: { type: "sidebar", tags: [], contentType: null },
    optionsSchema: treeListOptionsSchema,
    toSchemaConfig: toTreeListConfig,
    fromSchemaConfig: fromTreeListConfig,
    buildProps: (ctx, config) => ({
      tree: buildSidebarTree(ctx.getFilteredIndex(fromTreeListConfig(config)), ctx.completedSet),
      selectedId: ctx.selectedId,
      activeGroup: "",
      onSelectItem: ctx.onSelectItem,
      onSelectGroup: () => {},
      config: { labels: { ariaLabel: ctx.t("aria.sidebar") } },
    }),
  },
  {
    typeId: "markdown-viewer",
    titleKey: "panels.content",
    descriptionKey: "panels.content.description",
    component: MarkdownViewer,
    defaultSize: { w: 5, h: 8 },
    minSize: { w: 2, h: 2 },
    defaultConfig: { type: "content", pinnedItemId: null },
    optionsSchema: markdownViewerOptionsSchema,
    toSchemaConfig: toMarkdownViewerConfig,
    fromSchemaConfig: fromMarkdownViewerConfig,
    buildProps: (ctx, config) => ({
      content: buildContentViewModel(
        ctx.getFilteredIndex(fromMarkdownViewerConfig(config)),
        ctx.getContent,
        ctx.selectedId,
        "",
      ),
      isComplete: ctx.isComplete,
      onToggleComplete: ctx.onToggleComplete,
      config: {
        labels: {
          ariaLabel: ctx.t("aria.contentPanel"),
          notFound: ctx.t("content.notFound"),
          markRead: ctx.t("progress.markRead"),
          markUnread: ctx.t("progress.markUnread"),
        },
      },
    }),
  },
  {
    typeId: "geo-map",
    titleKey: "panels.map",
    descriptionKey: "panels.map.description",
    component: GeoMap,
    defaultSize: { w: 4, h: 8 },
    minSize: { w: 2, h: 2 },
    defaultConfig: { type: "map", boundingBox: null, zoomLevel: null },
    optionsSchema: geoMapOptionsSchema,
    toSchemaConfig: toGeoMapConfig,
    fromSchemaConfig: fromGeoMapConfig,
    buildProps: (ctx) => ({
      selectedId: ctx.selectedId,
      features: buildGeoFeatures(ctx.index),
      config: {
        tileUrl: ctx.theme === "dark" ? TILE_DARK : TILE_LIGHT,
        labels: {
          ariaLabel: ctx.t("aria.map"),
          mapContainerAriaLabel: ctx.t("aria.mapContainer"),
        },
      },
    }),
  },
  {
    typeId: "linear-timeline",
    titleKey: "panels.timeline",
    descriptionKey: "panels.timeline.description",
    component: LinearTimeline,
    defaultSize: { w: 12, h: 4 },
    minSize: { w: 2, h: 2 },
    defaultConfig: { type: "timeline", startDate: null, endDate: null },
    optionsSchema: linearTimelineOptionsSchema,
    toSchemaConfig: toLinearTimelineConfig,
    fromSchemaConfig: fromLinearTimelineConfig,
    buildProps: (ctx) => ({
      items: buildTimelineItems(ctx.index),
      selectedId: ctx.selectedId,
      onSelect: ctx.onSelectItem,
      hiddenGroups: ctx.hiddenGroups,
      config: { labels: { ariaLabel: ctx.t("aria.timeline") } },
    }),
  },
];

for (const definition of builtIns) registerDefinition(definition);

export function registerWidgetType(definition: WidgetTypeDefinition): void {
  registerDefinition(definition);
}

export function getWidgetType(typeId: string): WidgetTypeDefinition | undefined {
  return widgetRegistry.get(typeId) as WidgetTypeDefinition | undefined;
}

export function getAllWidgetTypes(): WidgetTypeDefinition[] {
  return widgetRegistry.getAll() as WidgetTypeDefinition[];
}
