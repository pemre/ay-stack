import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { DataSet, Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import type { ContentEntry, ContentIndex } from "../../shared/types.ts";
import "./TimelinePanel.css";

interface TimelineItem {
  id: string;
  content: string;
  start: string;
  end: string;
  group: string;
  className: string;
  type: string;
}

interface TimelineRef {
  tl: Timeline;
  ds: DataSet<TimelineItem>;
  gs: DataSet;
}

export function buildItems(index: ContentIndex): TimelineItem[] {
  return Object.values(index)
    .filter((m: ContentEntry) => m.start && m.end && m.group)
    .map((m: ContentEntry) => ({
      id: m.id,
      content: m.subtitle
        ? `${m.title || m.id}<br><small>${m.subtitle}</small>`
        : ((m.title || m.id) as string),
      start: m.start as string,
      end: m.end as string,
      group: m.group as string,
      className: m.className || "",
      type: m.type || "range",
    }));
}

interface TimelinePanelProps {
  index: ContentIndex;
  selectedId: string | null;
  onSelect: (id: string) => void;
  hiddenGroups: Set<string>;
}

export default function TimelinePanel({
  index,
  selectedId,
  onSelect,
  hiddenGroups,
}: TimelinePanelProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<TimelineRef | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  // Track whether we've done the initial init so we don't re-init on every resize
  const initDoneRef = useRef(false);

  const items = useMemo(() => buildItems(index), [index]);
  const translatedGroups = useMemo(() => {
    const seen = new Set<string>();
    for (const item of Object.values(index)) {
      if (item.group) seen.add(item.group);
    }
    return [...seen].sort().map((gid) => ({
      id: gid,
      content: gid,
      visible: !hiddenGroups.has(gid),
    }));
  }, [index, hiddenGroups]);

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
      start: "-001800-01-01",
      end: "2100-01-01",
      min: "-001800-01-01",
      max: "2100-01-01",
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
  }, []);

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
    <section className="timeline-panel" aria-label={t("aria.timeline")}>
      <div ref={containerRef} className="timeline-container" />
    </section>
  );
}
