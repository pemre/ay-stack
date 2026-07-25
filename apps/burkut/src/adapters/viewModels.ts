/**
 * View-model types for Bürküt's widgets.
 *
 * Widgets (Sidebar, TimelinePanel, MapPanel, ContentPanel) render these types
 * only -- they never see ContentIndex/ContentEntry (the domain model).
 * Adapters in this directory map the domain model to these shapes.
 */

/** A node in the sidebar's group/item tree. Purely structural -- no i18n, no domain fields. */
export interface TreeNode {
  id: string;
  label: string;
  /** Tooltip / title attribute text, if any. */
  tooltip?: string;
  /** True for items that should render as a visually distinct sub-heading. */
  isSubheading?: boolean;
  /** True when this node (or the entity it represents) has been marked complete. */
  completed?: boolean;
  children?: TreeNode[];
}

/** A single item plotted on the timeline. */
export interface TimelineItem {
  id: string;
  content: string;
  start: string;
  end: string;
  group: string;
  className: string;
  type: string;
}

/** A single geographic feature (marker + optional polygon) for the map. */
export interface GeoFeature {
  id: string;
  /** Explicit location label, if any (e.g. "Yinxu (Anyang)"). */
  label?: string;
  /** Fallback display title, used when label is absent. */
  title?: string;
  lat: number;
  lng: number;
  polygon?: [number, number][];
}

/** The resolved content to render in the content panel. */
export interface ContentViewModel {
  id: string;
  /** Null when no content body was found for `id` -- the widget renders its own fallback label. */
  markdown: string | null;
  title?: string;
  subtitle?: string;
  tags?: string[];
}
