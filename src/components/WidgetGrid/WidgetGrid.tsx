import type { Layout, ResponsiveLayouts } from "react-grid-layout";
import { Responsive, useContainerWidth } from "react-grid-layout";
import config from "../../config";
import type { ContentIndex } from "../../shared/types.ts";
import ContentPanel from "../ContentPanel/ContentPanel";
import MapPanel from "../MapPanel/MapPanel";
import Sidebar from "../Sidebar/Sidebar";
import TimelinePanel from "../TimelinePanel/TimelinePanel";
import { WidgetHeader } from "../WidgetHeader/WidgetHeader";
import { WIDGET_REGISTRY } from "./widgetRegistry";
import "./WidgetGrid.css";

interface WidgetGridProps {
  // Layout persistence props (lifted from useLayoutPersistence in App.tsx)
  layouts: ResponsiveLayouts;
  visibilityState: Record<string, boolean>;
  onLayoutChange: (layout: Layout, allLayouts: ResponsiveLayouts) => void;
  setWidgetVisible: (widgetId: string, visible: boolean) => void;
  // Sidebar props
  index: ContentIndex;
  selectedId: string | null;
  activeGroup: string;
  onSelectItem: (id: string) => void;
  onSelectGroup: (group: string) => void;
  completedSet?: Set<string>;
  // ContentPanel props
  getContent: (id: string) => string | null;
  isComplete?: (id: string) => boolean;
  onToggleComplete?: (id: string) => void;
  // TimelinePanel props
  onSelect: (id: string) => void;
  hiddenGroups: Set<string>;
  // Timeline group toggles (rendered as children of timeline WidgetHeader)
  timelineHeaderChildren?: React.ReactNode;
}

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

export function WidgetGrid({
  layouts,
  visibilityState,
  onLayoutChange,
  setWidgetVisible,
  index,
  selectedId,
  activeGroup,
  onSelectItem,
  onSelectGroup,
  completedSet,
  getContent,
  isComplete,
  onToggleComplete,
  onSelect,
  hiddenGroups,
  timelineHeaderChildren,
}: WidgetGridProps) {
  const { width, containerRef } = useContainerWidth();
  const draggable = config.features.draggableLayout;

  // Adapter: Responsive passes (layout: Layout, allLayouts) — matches hook signature directly
  const handleLayoutChange = (layout: Layout, allLayouts: ResponsiveLayouts): void => {
    onLayoutChange(layout, allLayouts);
  };

  // Filter layouts to only include visible widgets; mark all static when draggable is off
  const filteredLayouts = Object.fromEntries(
    Object.entries(layouts).map(([bp, items]) => [
      bp,
      (items as Layout)
        .map((item) => ({
          ...item,
          static: !draggable || item.static,
        }))
        .filter((item) => visibilityState[item.i] !== false),
    ]),
  );

  const widgetComponents: Record<string, React.ReactNode> = {
    sidebar: (
      <Sidebar
        index={index}
        selectedId={selectedId}
        activeGroup={activeGroup}
        onSelectItem={onSelectItem}
        onSelectGroup={onSelectGroup}
        completedSet={completedSet}
      />
    ),
    content: (
      <ContentPanel
        selectedId={selectedId}
        activeGroup={activeGroup}
        index={index}
        getContent={getContent}
        isComplete={isComplete}
        onToggleComplete={onToggleComplete}
      />
    ),
    map: <MapPanel selectedId={selectedId} index={index} />,
    timeline: (
      <TimelinePanel
        index={index}
        selectedId={selectedId}
        onSelect={onSelect}
        hiddenGroups={hiddenGroups}
      />
    ),
  };

  const visibleWidgets = WIDGET_REGISTRY.filter((w) => visibilityState[w.id] !== false);

  return (
    <div className="widget-grid-container" ref={containerRef as React.RefObject<HTMLDivElement>}>
      <Responsive
        width={width}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        layouts={filteredLayouts}
        rowHeight={60}
        onLayoutChange={handleLayoutChange}
        dragConfig={draggable ? { handle: ".widget-header", enabled: true } : { enabled: false }}
        resizeConfig={{ enabled: draggable }}
      >
        {visibleWidgets.map((widget) => (
          <div key={widget.id} className="widget-item">
            <WidgetHeader
              titleKey={widget.titleKey}
              onClose={draggable ? () => setWidgetVisible(widget.id, false) : undefined}
            >
              {widget.id === "timeline" ? timelineHeaderChildren : undefined}
            </WidgetHeader>
            <div className="widget-item__body">{widgetComponents[widget.id]}</div>
          </div>
        ))}
      </Responsive>
    </div>
  );
}
