// ── Data Node ──────────────────────────────────────────────

/** A single data item to be plotted on the spiral. */
export interface DataNode {
  /** Calendar date for positioning on the spiral. */
  date: Date;
  /** Type key — maps to a TypeConfig entry for color/shape. */
  type: string;
  /** Display title shown in tooltip and aria-label. */
  title: string;
  /** Content summary shown in tooltip body. */
  content: string;
  /** Optional stable identifier for keying during data updates. */
  id?: string;
  /** Optional pass-through for additional front-matter fields. */
  metadata?: Record<string, unknown>;
}

// ── Type Configuration ─────────────────────────────────────

export type NodeShape = "circle" | "square" | "triangle" | "star" | "pentagon";

/** Visual mapping for a data-node type. */
export interface TypeConfig {
  /** Unique key matching DataNode.type. */
  key: string;
  /** CSS color string for the node stroke. */
  color: string;
  /** SVG shape to render. */
  shape: NodeShape;
}

// ── Zoom Configuration ─────────────────────────────────────

export interface ZoomConfig {
  /** Zoom speed multiplier (default: 1.0). */
  speed: number;
  /** Enable mouse wheel zoom on SVG area (default: true). */
  mouseWheel: boolean;
  /** Show zoom range slider (default: true). */
  slider: boolean;
  /** Show +/− zoom buttons (default: true). */
  buttons: boolean;
}

// ── Fog Configuration ──────────────────────────────────────

export interface FogConfig {
  /** Enable fog/depth effect on outer rings (default: true). */
  enabled: boolean;
  /** Ring index where fog begins (default: 2). */
  startRing: number;
  /** Fog intensity 0–1 (default: 0.8). */
  intensity: number;
}

// ── Ring Gradient Configuration ────────────────────────────

export type ColorScale = "spectral" | "rainbow" | "cool" | "warm";
export type GradientTarget = "grid" | "labels";

export interface RingGradientConfig {
  /** Enable ring color gradient (default: true). */
  enabled: boolean;
  /** D3 color interpolator name (default: "spectral"). */
  scale: ColorScale;
  /** Which elements receive the gradient (default: ["grid", "labels"]). */
  applyTo: GradientTarget[];
}

// ── Radial Grid Configuration ──────────────────────────────

export interface RadialGridConfig {
  /** Extra length (beyond maxRadius) for month grid lines (default: 20). */
  monthExtraLength: number;
  /** Extra length (beyond maxRadius) for week grid lines (default: 12). */
  weekExtraLength: number;
  /** Extra length (beyond maxRadius) for day grid lines (default: 6). */
  dayExtraLength: number;
}

// ── Animation Configuration ────────────────────────────────

export interface AnimationConfig {
  /** Enable animated transitions (default: true). */
  enabled: boolean;
  /** Transition duration in milliseconds (default: 400). */
  duration: number;
}

// ── Time Window Configuration ──────────────────────────────

export interface TimeWindowConfig {
  /** Show/hide the time window slider (default: true). */
  visible: boolean;
  /** Enable animated transitions when slider position changes (default: true). */
  animationEnabled: boolean;
  /** Transition duration in ms for slider-driven animations (default: uses animations.duration). */
  animationDuration: number;
}

// ── Year Label Position ────────────────────────────────────

export type YearLabelPosition =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

// ── Localized Labels ───────────────────────────────────────

/** Localized UI strings for controls and summary text. */
export interface SpiralTimelineLabels {
  /** Zoom control heading (default: "Years to Show"). */
  zoomTitle?: string;
  /** Zoom slider label (default: "Year Count"). */
  zoomSliderLabel?: string;
  /** Zoom value template, {count} and {start}/{end} are replaced (default: "{count} years shown ({start}–{end})"). */
  zoomValueTemplate?: string;
  /** Time window heading (default: "Time Window"). */
  timeWindowTitle?: string;
  /** Summary template for ring count (default: "Spiral: {rings} rings + tail"). */
  ringSummaryTemplate?: string;
  /** Summary template for total data years (default: "Total data: {years} years"). */
  totalYearsTemplate?: string;
}

// ── Main Config Object ─────────────────────────────────────

export interface SpiralTimelineConfig {
  /** Number of visible year rings (default: 2). */
  yearsToShow?: number;
  /** Angle position for year labels on ring boundaries (default: "top"). */
  yearLabelPosition?: YearLabelPosition;
  /** Zoom behavior configuration. */
  zoom?: Partial<ZoomConfig>;
  /** Fog/depth effect configuration. */
  fog?: Partial<FogConfig>;
  /** Ring color gradient configuration. */
  ringGradient?: Partial<RingGradientConfig>;
  /** Transition animation configuration. */
  animations?: Partial<AnimationConfig>;
  /** Radial grid line configuration (month/week/day extra lengths). */
  radialGrid?: Partial<RadialGridConfig>;
  /** Time window slider configuration. */
  timeWindow?: Partial<TimeWindowConfig>;
  /** Data-node type → visual mapping. */
  types?: TypeConfig[];
  /** Callback invoked when a data node is clicked. */
  onNodeClick?: (node: DataNode, event: MouseEvent) => void;
  /** Localized UI label overrides. */
  labels?: Partial<SpiralTimelineLabels>;
}

// ── Component Props ────────────────────────────────────────

export interface SpiralTimelineProps {
  /** Array of data items to plot on the spiral. */
  data: DataNode[];
  /** Configuration object (all fields optional, defaults applied). */
  config?: SpiralTimelineConfig;
  /** Locale string for month labels and date formatting (default: browser locale). */
  locale?: string;
  /** Additional CSS class name for the root container. */
  className?: string;
  /** Callback invoked when yearsToShow changes (zoom controls, mouse wheel). Enables controlled mode. */
  onYearsToShowChange?: (yearsToShow: number) => void;
  /** Callback invoked when windowStart changes (scroll, slider drag, click). Enables controlled mode. */
  onWindowStartChange?: (windowStart: number) => void;
  /** Controlled window start year. When provided, the component uses this value instead of internal state. */
  windowStart?: number;
}
