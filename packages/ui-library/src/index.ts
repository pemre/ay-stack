// Barrel export — will re-export all blocks and public types

export { PublicGeoMap as GeoMap } from "./blocks/GeoMap/PublicGeoMap.tsx";
export {
  DEFAULT_GEOMAP_LABELS,
  type GeoFeature,
  type GeoMapConfig,
  type GeoMapLabels,
  type GeoMapProps,
} from "./blocks/GeoMap/types.ts";
export { ImageZoom } from "./blocks/ImageZoom/ImageZoom.tsx";
export type { ImageZoomConfig, ImageZoomProps, ZoomLevel } from "./blocks/ImageZoom/types.ts";
export {
  buildLinearTimelineGroups,
  LinearTimeline,
} from "./blocks/LinearTimeline/LinearTimeline.tsx";
export {
  DEFAULT_LINEAR_TIMELINE_LABELS,
  type LinearTimelineConfig,
  type LinearTimelineItem,
  type LinearTimelineLabels,
  type LinearTimelineProps,
} from "./blocks/LinearTimeline/types.ts";
export { PublicMarkdownViewer as MarkdownViewer } from "./blocks/MarkdownViewer/PublicMarkdownViewer.tsx";
export type {
  ContentViewModel,
  MarkdownViewerConfig,
  MarkdownViewerLabels,
  MarkdownViewerProps,
} from "./blocks/MarkdownViewer/types.ts";
export { DEFAULT_MARKDOWN_VIEWER_LABELS } from "./blocks/MarkdownViewer/types.ts";
export { SpiralTimeline } from "./blocks/SpiralTimeline/SpiralTimeline.tsx";
export type {
  AnimationConfig,
  ColorScale,
  DataNode,
  FogConfig,
  NodeShape,
  RadialGridConfig,
  RingGradientConfig,
  SpiralTimelineConfig,
  SpiralTimelineLabels,
  SpiralTimelineProps,
  TimeWindowConfig,
  TypeConfig,
  YearLabelPosition,
  ZoomConfig,
} from "./blocks/SpiralTimeline/types.ts";
export { TreeList } from "./blocks/TreeList/TreeList.tsx";
export {
  DEFAULT_TREE_LIST_LABELS,
  type TreeListConfig,
  type TreeListLabels,
  type TreeListProps,
  type TreeNode,
} from "./blocks/TreeList/types.ts";
