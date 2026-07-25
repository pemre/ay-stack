import { useCallback, useEffect, useMemo, useRef } from "react";
import { DataSet, Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";
import type { TimelineItem } from "../../adapters/viewModels.ts";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import "./TimelinePanel.css";

// ── Labels ────────────────────────────────────────────────────────────────

export interface TimelinePanelLabels {
  /** aria-label for the root section element (default: "Timeline"). */
  ariaLabel?: string;
}

export const DEFAULT_TIMELINE_PANEL_LABELS: Required<TimelinePanelLabels> = {
  ariaLabel: "Timeline",
};

// ── Config ────────────────────────────────────────────────────────────────

export interface TimelinePanelConfig {
  labels?: TimelinePanelLabels;
  /** Timeline min/max bounds, ISO date strings (default: "-001800-01-01".."2100-01-01"). */
  minDate?: string;
  maxDate?: string;
}

const DEFAULT_MIN_DATE = "-001800-01-01";
const DEFAULT_MAX_DATE = "2100-01-01";

interface MergedConfig {
  labels: Required<TimelinePanelLabels>;
  minDate: string;
  maxDate: string;
}

function mergeConfig(user?: TimelinePanelConfig): MergedConfig {
  return {
    labels: { ...DEFAULT_TIMELINE_PANEL_LABELS, ...user?.labels },
    minDate: user?.minDate ?? DEFAULT_MIN_DATE,
    maxDate: user?.maxDate ?? DEFAULT_MAX_DATE,
  };
}

// ── Component ─────────────────────────────────────────────────────────────

interface TimelineGroup {
  id: string;
  content: string;
  visible: boolean;
}

interface TimelineRef {
  tl: Timeline;
  ds: DataSet<TimelineItem>;
  gs: DataSet<TimelineGroup>;
}

interface TimelinePanelProps {
  items: TimelineItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  hiddenGroups: Set<string>;
  config?: TimelinePanelConfig;
}

export default function TimelinePanel({
  items,
  selectedId,
  onSelect,
  hiddenGroups,
  config,
}: TimelinePanelProps) {
  const cfg = useMemo(() => mergeConfig(config), [config]);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<TimelineRef | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  // Track whether we've done the initial init so we don't re-init on every resize
  const initDoneRef = useRef(false);

  const translatedGroups = useMemo(() => {
    const seen = new Set<string>();
    for (const item of items) {
      if (item.group) seen.add(item.group);
    }
    return [...seen].sort().map((gid) => ({
      id: gid,
      content: gid,
      visible: !hiddenGroups.has(gid),
    }));
  }, [items, hiddenGroups]);

  // Store latest items/groups in refs so the init function can access them
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const groupsRef = useRef(translatedGroups);
  groupsRef.current = translatedGroups;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  // Track the data snapshots loaded during init so the sync effects can skip
  // the redundant clear+add that causes vis-timeline to mis-stack items.
  const initItemsRef = useRef<TimelineItem[] | null>(null);
  const initGroupsRef = useRef<typeof translatedGroups | null>(null);

  // Initialize vis-timeline. Called either from the mount effect (if container
  // already has dimensions) or from the resize observer (first non-zero size).
  const initTimeline = useCallback(() => {
    const el = containerRef.current;
    if (!el || timelineRef.current) return;

    const ds = new DataSet(itemsRef.current);
    const gs = new DataSet(groupsRef.current);
    initItemsRef.current = itemsRef.current;
    initGroupsRef.current = groupsRef.current;
    const tl = new Timeline(el, ds, gs, {
      start: cfg.minDate,
      end: cfg.maxDate,
      min: cfg.minDate,
      max: cfg.maxDate,
      height: "100%",
      groupHeightMode: "fixed",
      orientation: "top",
      horizontalScroll: true,
      verticalScroll: true,
      zoomKey: "ctrlKey",
      zoomMin: 1000 * 60 * 60 * 24 * 31 * 12,
      zoomFriction: 10,
    });
    tl.on("select", (props: Record<string, unknown>) => {
      const selected = props.items as string[];
      if (selected.length > 0) onSelectRef.current(selected[0]);
    });
    timelineRef.current = { tl, ds, gs };
    initDoneRef.current = true;

    // vis-timeline needs a frame after construction to measure DOM correctly;
    // without this, items render at wrong positions when the widget mounts
    // into a container that just appeared (e.g. after a dashboard switch).
    requestAnimationFrame(() => {
      if (timelineRef.current) {
        timelineRef.current.tl.redraw();
      }
    });

    // Apply pending selectedId if any
    const sid = selectedIdRef.current;
    if (sid) {
      tl.setSelection([sid]);
      try {
        tl.focus(sid);
        const win = tl.getWindow();
        const winMs = win.end - win.start;
        const item = ds.get(sid);
        if (item?.start) {
          const itemStart = new Date(item.start).getTime();
          tl.moveTo(new Date(itemStart + winMs * 0.4), {
            animation: { duration: 500, easingFunction: "easeInOutQuad" },
          });
        }
      } catch {
        /* item may not exist */
      }
    }
  }, [cfg.minDate, cfg.maxDate]);

  // Mount/unmount effect — try to init immediately if container has size
  useEffect(() => {
    const el = containerRef.current;
    if (el && el.offsetHeight > 0) {
      initTimeline();
    }
    return () => {
      if (timelineRef.current) {
        timelineRef.current.tl.destroy();
        timelineRef.current = null;
      }
      initDoneRef.current = false;
      initItemsRef.current = null;
      initGroupsRef.current = null;
    };
  }, [initTimeline]);

  // Data sync effects — skip when data is the same reference loaded during init
  useEffect(() => {
    if (!timelineRef.current) return;
    if (items === initItemsRef.current) {
      initItemsRef.current = null;
      return;
    }
    initItemsRef.current = null;
    timelineRef.current.ds.clear();
    timelineRef.current.ds.add(items);
  }, [items]);

  useEffect(() => {
    if (!timelineRef.current) return;
    if (translatedGroups === initGroupsRef.current) {
      initGroupsRef.current = null;
      return;
    }
    initGroupsRef.current = null;
    timelineRef.current.gs.clear();
    timelineRef.current.gs.add(translatedGroups);
  }, [translatedGroups]);

  // Selection effect
  useEffect(() => {
    if (!timelineRef.current || !selectedId) return;
    const { tl, ds } = timelineRef.current;
    tl.setSelection([selectedId]);
    try {
      tl.focus(selectedId);
      const win = tl.getWindow();
      const winMs = win.end - win.start;
      const item = ds.get(selectedId);
      if (item?.start) {
        const itemStart = new Date(item.start).getTime();
        tl.moveTo(new Date(itemStart + winMs * 0.4), {
          animation: { duration: 500, easingFunction: "easeInOutQuad" },
        });
      }
    } catch {
      /* item may not exist */
    }
  }, [selectedId]);

  // Resize handler — init on first non-zero size, redraw on subsequent resizes
  const handleResize = useCallback(() => {
    if (!timelineRef.current) {
      // Timeline not yet initialized — try now if container has size
      const el = containerRef.current;
      if (el && el.offsetHeight > 0) {
        initTimeline();
      }
    } else {
      timelineRef.current.tl.redraw();
    }
  }, [initTimeline]);

  useResizeObserver(containerRef, handleResize, 50);

  return (
    <section className="timeline-panel" aria-label={cfg.labels.ariaLabel}>
      <div ref={containerRef} className="timeline-container" />
    </section>
  );
}
