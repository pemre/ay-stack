/** A milestone point on the scroll timeline. */
export interface ScrollTimelineSection {
  /** Unique identifier for the section. Used in anchor links. */
  id: string;
  /** Short label shown next to the dot (e.g. "Mid 2025"). */
  label: string;
}

/** Labels consumed by the component for accessibility. */
export interface ScrollTimelineLabels {
  /** aria-label for the root nav element (default: "Scroll timeline"). */
  ariaLabel?: string;
}

export const DEFAULT_SCROLL_TIMELINE_LABELS: Required<ScrollTimelineLabels> = {
  ariaLabel: "Scroll timeline",
};

/** Configuration options for ScrollTimeline. All fields optional. */
export interface ScrollTimelineConfig {
  /** Width of the SVG nav area in pixels (default: 130). */
  navWidth?: number;
  /** Threshold below which the timeline is hidden (default: 1024 / lg breakpoint). */
  minViewportWidth?: number;
  /** Show labels permanently instead of on hover (default: false). */
  alwaysShowLabels?: boolean;
}

export interface ScrollTimelineProps {
  /** Milestone sections to track. Each renders a dot + label on the timeline. */
  sections: ScrollTimelineSection[];
  /** Prefix for section anchor IDs (default: "narrative"). */
  namePrefix?: string;
  /** Optional configuration overrides. */
  config?: ScrollTimelineConfig;
  /** Optional accessibility label overrides. */
  labels?: ScrollTimelineLabels;
  /** Additional CSS class for the root wrapper. */
  className?: string;
  /** Content sections rendered alongside the timeline. */
  children?: React.ReactNode;
}
