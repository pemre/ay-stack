export interface LinearTimelineItem {
  id: string;
  content: string;
  start: string;
  end: string;
  group: string;
  className: string;
  type: string;
}

export interface LinearTimelineLabels {
  /** aria-label for the root section element (default: "Timeline"). */
  ariaLabel?: string;
}

export const DEFAULT_LINEAR_TIMELINE_LABELS: Required<LinearTimelineLabels> = {
  ariaLabel: "Timeline",
};

export interface LinearTimelineConfig {
  labels?: LinearTimelineLabels;
  /** Timeline min/max bounds, ISO date strings (default: "-001800-01-01".."2100-01-01"). */
  minDate?: string;
  maxDate?: string;
}

export interface LinearTimelineProps {
  items: LinearTimelineItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  hiddenGroups: Set<string>;
  config?: LinearTimelineConfig;
}
