import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { DataSet, Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";
import type { ContentEntry, ContentIndex } from "../../shared/types.ts";
import { useResizeObserver } from "../../hooks/useResizeObserver";
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


export default function TimelinePanel(
  { index, selectedId, onSelect, hiddenGroups }: TimelinePanelProps,
) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<TimelineRef | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const items = useMemo(() => buildItems(index), [index]);
  const translatedGroups = useMemo(() => {
    const seen = new Set<string>();
    for (const item of Object.values(index)) {
      if (item.group) seen.add(item.group);
    }
    return [...seen].sort().map((gid) => ({
      id: gid, content: gid, visible: !hiddenGroups.has(gid),
    }));
  }, [index, hiddenGroups]);
  // Initialize timeline once; data updates are handled by separate effects below
  useEffect(() => {
    if (!containerRef.current) return;
    const ds = new DataSet(items);
    const gs = new DataSet(translatedGroups);
    const tl = new Timeline(containerRef.current, ds, gs, {
      start: "-001800-01-01", end: "2100-01-01",
      min: "-001800-01-01", max: "2100-01-01",
      height: "100%", groupHeightMode: "fixed", orientation: "top",
      horizontalScroll: true, verticalScroll: true, zoomKey: "ctrlKey",
      zoomMin: 1000 * 60 * 60 * 24 * 31 * 12, zoomFriction: 10,
    });
    tl.on("select", (props: Record<string, unknown>) => {
      const selected = props.items as string[];
      if (selected.length > 0) onSelectRef.current(selected[0]);
    });
    timelineRef.current = { tl, ds, gs };
    return () => { tl.destroy(); timelineRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once; data synced via effects below
  }, []);
  useEffect(() => {
    if (!timelineRef.current) return;
    timelineRef.current.ds.clear();
    timelineRef.current.ds.add(items);
  }, [items]);
  useEffect(() => {
    if (!timelineRef.current) return;
    timelineRef.current.gs.clear();
    timelineRef.current.gs.add(translatedGroups);
  }, [translatedGroups]);
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
    } catch { /* item may not exist */ }
  }, [selectedId]);
  const handleResize = useCallback(() => {
    if (timelineRef.current) timelineRef.current.tl.redraw();
  }, []);
  useResizeObserver(containerRef, handleResize);
  return (
    <section className="timeline-panel" aria-label={t("aria.timeline")}>
      <div ref={containerRef} className="timeline-container" />
    </section>
  );
}
