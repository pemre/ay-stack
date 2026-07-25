/**
 * Shared types for Bürküt CLI and browser code.
 *
 * These types define the core data models used by the directory scanner,
 * content graph builder, Vite plugin, and React UI.
 */

/** Supported content types detected by file extension. */
export type ContentType = "markdown" | "image" | "video" | "audio";

/** Maps a content type to its recognized file extensions and MIME prefix. */
export interface ContentTypeDefinition {
  type: ContentType;
  extensions: string[];
  /** MIME type prefix for serving (e.g. "image/") */
  mimePrefix: string;
}

/** A file discovered by the directory scanner. */
export interface ScannedFile {
  /** Absolute path to the file */
  absolutePath: string;
  /** Path relative to the scanned root directory */
  relativePath: string;
  /** Detected content type */
  contentType: ContentType;
  /** Extracted date (ISO string YYYY-MM-DD) or null */
  date: string | null;
  /** Parsed frontmatter (markdown files only) */
  frontmatter: Record<string, unknown> | null;
  /** Raw markdown body (markdown files only) */
  body: string | null;
}

/** A single content entry in the graph. */
export interface ContentNode {
  /** Unique ID derived from relative path */
  id: string;
  /** Relative path from content root */
  relativePath: string;
  /** Content type */
  contentType: ContentType;
  /** Associated date or null for undated content */
  date: string | null;
  /** Parsed frontmatter (markdown only) */
  frontmatter: Record<string, unknown> | null;
  /** Markdown body (markdown only, null for other types) */
  body: string | null;
  /** Display title (from frontmatter.title, or derived from filename) */
  title: string;
  /** Tags from frontmatter */
  tags: string[];
}

/** A grouping of content nodes sharing the same date. */
export interface DayBucket {
  /** ISO date string YYYY-MM-DD */
  date: string;
  /** All content nodes for this date */
  nodes: ContentNode[];
}

/** The central data structure: all content indexed by date. */
export interface ContentGraph {
  /** All content nodes keyed by ID */
  nodes: Record<string, ContentNode>;
  /** Content grouped by date, sorted chronologically (newest first) */
  days: DayBucket[];
  /** Nodes without a date */
  undated: ContentNode[];
  /** Date range of the graph */
  dateRange: { earliest: string; latest: string } | null;
  /** Summary stats */
  stats: {
    totalFiles: number;
    byType: Record<ContentType, number>;
    datedFiles: number;
    undatedFiles: number;
  };
}

/** Legacy content entry used by UI widgets (Sidebar, TimelinePanel, etc.). */
export interface ContentEntry {
  id: string;
  group?: string;
  title?: string;
  subtitle?: string;
  start?: string;
  end?: string;
  className?: string;
  type?: string;
  tags?: string[];
  location?: { lat: number; lng: number; label?: string };
  polygon?: [number, number][];
  sidebarSort?: string;
  _path: string;
  _isHeader: boolean;
  [key: string]: unknown;
}

/** Lookup table of ContentEntry keyed by id. */
export interface ContentIndex {
  [id: string]: ContentEntry;
}

/** CLI command options for the `serve` command. */
export interface CLIOptions {
  /** Dev server port (default: 5173) */
  port: number;
  /** Dev server host (default: "localhost") */
  host: string;
  /** Open browser on start (default: false) */
  open: boolean;
}

/** Optional per-workspace configuration loaded from `.burkut/config.ts`. */
export interface BurkutConfig {
  /** Display title for this workspace */
  title?: string;
  /** Locale override */
  locale?: "tr" | "en" | "zh";
  /** Content type overrides or additions */
  contentTypes?: ContentTypeDefinition[];
  /** Date extraction overrides */
  dateExtraction?: {
    /** Frontmatter field name for date (default: "date") */
    frontmatterField?: string;
    /** Filename date pattern (default: YYYY-MM-DD prefix) */
    filenamePattern?: RegExp;
  };
  /** Widget visibility defaults */
  widgets?: Record<string, boolean>;
}

// ── Dashboard System Types ──

/** Grid position and size for a widget instance in react-grid-layout. */
export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

/** Filter criteria for scoping content displayed in widgets. */
export interface ContentFilter {
  contentType?: ContentType | null;
  tags?: string[];
  sourceDirectory?: string | null;
}

/** Sidebar widget configuration: tag and content type filters. */
export interface SidebarWidgetConfig {
  type: "sidebar";
  tags: string[];
  contentType: ContentType | null;
}

/** Content panel widget configuration: pinned item. */
export interface ContentWidgetConfig {
  type: "content";
  pinnedItemId: string | null;
}

/** Map widget configuration: bounding box and zoom. */
export interface MapWidgetConfig {
  type: "map";
  boundingBox: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
  zoomLevel: number | null;
}

/** Timeline widget configuration: date range. */
export interface TimelineWidgetConfig {
  type: "timeline";
  startDate: string | null;
  endDate: string | null;
}

/** Discriminated union of all widget configuration types. */
export type WidgetConfig =
  | SidebarWidgetConfig
  | ContentWidgetConfig
  | MapWidgetConfig
  | TimelineWidgetConfig;

/** A concrete widget instance placed on a dashboard. */
export interface WidgetInstance {
  instanceId: string;
  widgetTypeId: string;
  position: GridPosition;
  config: WidgetConfig;
}

/** A named dashboard containing widget instances and a content filter. */
export interface Dashboard {
  id: string;
  name: string;
  instances: WidgetInstance[];
  filter: ContentFilter;
}

/** Shape of the persisted dashboard state written to disk. */
export interface PersistedDashboardState {
  version: number;
  dashboards: Dashboard[];
}

/** Props passed to widget components rendered inside the grid. */
export interface WidgetInstanceProps {
  instance: WidgetInstance;
  index: ContentIndex;
  getContent: (id: string) => string | null;
  selectedId: string | null;
  onSelectItem: (id: string) => void;
  isComplete?: (id: string) => boolean;
  onToggleComplete?: (id: string) => void;
  completedSet?: Set<string>;
}
