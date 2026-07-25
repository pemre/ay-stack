import type { TFunction } from "i18next";
import type { ComponentType } from "react";
import {
  buildContentViewModel,
  buildGeoFeatures,
  buildSidebarTree,
  buildTimelineItems,
} from "../../adapters/contentAdapters.ts";
import type { ContentIndex, WidgetConfig } from "../../shared/types.ts";
import ContentPanel from "../ContentPanel/ContentPanel.tsx";
import MapPanel from "../MapPanel/MapPanel.tsx";
import Sidebar from "../Sidebar/Sidebar.tsx";
import TimelinePanel from "../TimelinePanel/TimelinePanel.tsx";
import { ContentConfigPanel } from "./configPanels/ContentConfigPanel.tsx";
import { MapConfigPanel } from "./configPanels/MapConfigPanel.tsx";
import { SidebarConfigPanel } from "./configPanels/SidebarConfigPanel.tsx";
import { TimelineConfigPanel } from "./configPanels/TimelineConfigPanel.tsx";
import type { WidgetConfigPanelProps } from "./configPanels/types.ts";

/**
 * Shared context every widget's `buildProps` is invoked with. Assembled once
 * per render by `WidgetGrid` from app-level state (selection, progress,
 * theme, i18n) and handed to whichever widget type is being rendered --
 * this is what lets `WidgetGrid` resolve props generically instead of
 * switching on `widgetTypeId`.
 */
export interface WidgetRenderContext {
  index: ContentIndex;
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

export interface WidgetTypeDefinition {
  typeId: string;
  titleKey: string;
  descriptionKey: string;
  component: ComponentType<any>;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  defaultConfig: WidgetConfig;
  /** Builds this widget's component props from the shared render context and its instance config. */
  buildProps: (ctx: WidgetRenderContext, config: WidgetConfig) => Record<string, unknown>;
  /** Optional per-type settings panel, rendered by WidgetGrid when the widget's gear icon is clicked. */
  configPanel?: ComponentType<WidgetConfigPanelProps>;
}

const widgetTypes: Record<string, WidgetTypeDefinition> = {};

const TILE_LIGHT = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

function registerBuiltInTypes(): void {
  const builtIns: WidgetTypeDefinition[] = [
    {
      typeId: "tree-list",
      titleKey: "panels.sidebar",
      descriptionKey: "panels.sidebar.description",
      component: Sidebar,
      defaultSize: { w: 3, h: 8 },
      minSize: { w: 2, h: 2 },
      defaultConfig: { type: "sidebar", tags: [], contentType: null },
      configPanel: SidebarConfigPanel,
      buildProps: (ctx) => ({
        tree: buildSidebarTree(ctx.index, ctx.completedSet),
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
      component: ContentPanel,
      defaultSize: { w: 5, h: 8 },
      minSize: { w: 2, h: 2 },
      defaultConfig: { type: "content", pinnedItemId: null },
      configPanel: ContentConfigPanel,
      buildProps: (ctx) => ({
        content: buildContentViewModel(ctx.index, ctx.getContent, ctx.selectedId, ""),
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
      component: MapPanel,
      defaultSize: { w: 4, h: 8 },
      minSize: { w: 2, h: 2 },
      defaultConfig: { type: "map", boundingBox: null, zoomLevel: null },
      configPanel: MapConfigPanel,
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
      component: TimelinePanel,
      defaultSize: { w: 12, h: 4 },
      minSize: { w: 2, h: 2 },
      defaultConfig: { type: "timeline", startDate: null, endDate: null },
      configPanel: TimelineConfigPanel,
      buildProps: (ctx) => ({
        items: buildTimelineItems(ctx.index),
        selectedId: ctx.selectedId,
        onSelect: ctx.onSelectItem,
        hiddenGroups: ctx.hiddenGroups,
        config: { labels: { ariaLabel: ctx.t("aria.timeline") } },
      }),
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
