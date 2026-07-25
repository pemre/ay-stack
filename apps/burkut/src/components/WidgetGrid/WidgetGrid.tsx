import { useMemo, useState } from "react";
import type { Layout, ResponsiveLayouts } from "react-grid-layout";
import { Responsive, useContainerWidth } from "react-grid-layout";
import { useTranslation } from "react-i18next";
import config from "../../config";
import type { ContentIndex, Dashboard, WidgetInstance } from "../../shared/types.ts";
import { useDashboardStore } from "../../stores/dashboardStore.ts";
import { applyFilter, resolveFilter } from "../../utils/contentFilter.ts";
import { WidgetHeader } from "../WidgetHeader/WidgetHeader";
import { WidgetPicker } from "../WidgetPicker/WidgetPicker.tsx";
import "./WidgetGrid.css";
import {
  ContentConfigPanel,
  MapConfigPanel,
  SidebarConfigPanel,
  TimelineConfigPanel,
} from "./configPanels/index.ts";
import type { WidgetConfigPanelProps } from "./configPanels/types.ts";
import { getWidgetType } from "./widgetTypeRegistry.ts";

interface WidgetGridProps {
  dashboard: Dashboard;
  index: ContentIndex;
  getContent: (id: string) => string | null;
  selectedId: string | null;
  onSelectItem: (id: string) => void;
  isComplete?: (id: string) => boolean;
  onToggleComplete?: (id: string) => void;
  completedSet?: Set<string>;
}

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

const EMPTY_HIDDEN_GROUPS = new Set<string>();

const CONFIG_PANELS: Record<string, React.ComponentType<WidgetConfigPanelProps>> = {
  sidebar: SidebarConfigPanel,
  content: ContentConfigPanel,
  map: MapConfigPanel,
  timeline: TimelineConfigPanel,
};

export function WidgetGrid({
  dashboard,
  index,
  getContent,
  selectedId,
  onSelectItem,
  isComplete,
  onToggleComplete,
  completedSet,
}: WidgetGridProps) {
  const { t } = useTranslation();
  const { width, containerRef } = useContainerWidth();
  const draggable = config.features.draggableLayout;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [configInstanceId, setConfigInstanceId] = useState<string | null>(null);

  const updateWidgetConfig = useDashboardStore((s) => s.updateWidgetConfig);

  // Generate layout items from dashboard instances
  const layoutItems = useMemo(
    () =>
      dashboard.instances.map((inst) => ({
        i: inst.instanceId,
        x: inst.position.x,
        y: inst.position.y,
        w: inst.position.w,
        h: inst.position.h,
        minW: inst.position.minW,
        minH: inst.position.minH,
        static: !draggable,
      })),
    [dashboard.instances, draggable],
  );

  // react-grid-layout v2 hands the callback a readonly `Layout`; the store reads
  // a mutable array, so copy on the way through. Behavior is unchanged.
  const handleLayoutChange = (currentLayout: Layout, _allLayouts: ResponsiveLayouts): void => {
    useDashboardStore.getState().onLayoutChange(dashboard.id, [...currentLayout]);
  };

  const renderWidgetContent = (instance: WidgetInstance, filteredIndex: ContentIndex) => {
    const typeDef = getWidgetType(instance.widgetTypeId);

    if (!typeDef) {
      return (
        <div style={{ padding: "1rem", textAlign: "center" }}>
          <p>{t("widget.unknown", { type: instance.widgetTypeId })}</p>
          <button
            type="button"
            onClick={() =>
              useDashboardStore.getState().removeWidgetInstance(dashboard.id, instance.instanceId)
            }
          >
            {t("widget.remove")}
          </button>
        </div>
      );
    }

    const WidgetComponent = typeDef.component;

    // Pass existing props based on widget type
    switch (instance.widgetTypeId) {
      case "sidebar":
        return (
          <WidgetComponent
            index={filteredIndex}
            selectedId={selectedId}
            activeGroup=""
            onSelectItem={onSelectItem}
            onSelectGroup={() => {}}
            completedSet={completedSet}
          />
        );
      case "content":
        return (
          <WidgetComponent
            index={filteredIndex}
            selectedId={selectedId}
            activeGroup=""
            getContent={getContent}
            isComplete={isComplete}
            onToggleComplete={onToggleComplete}
          />
        );
      case "map":
        return <WidgetComponent index={filteredIndex} selectedId={selectedId} />;
      case "timeline":
        return (
          <WidgetComponent
            index={filteredIndex}
            selectedId={selectedId}
            onSelect={onSelectItem}
            hiddenGroups={EMPTY_HIDDEN_GROUPS}
          />
        );
      default:
        return <WidgetComponent index={filteredIndex} />;
    }
  };

  return (
    <div className="widget-grid-container" ref={containerRef as React.RefObject<HTMLDivElement>}>
      {draggable && (
        <button
          type="button"
          className="widget-grid__add-btn"
          onClick={() => setPickerOpen(true)}
          aria-label={t("widgetPicker.add")}
        >
          + {t("widgetPicker.add")}
        </button>
      )}

      {pickerOpen && (
        <WidgetPicker dashboardId={dashboard.id} onClose={() => setPickerOpen(false)} />
      )}

      <Responsive
        width={width}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        layouts={{ lg: layoutItems }}
        rowHeight={60}
        onLayoutChange={handleLayoutChange}
        dragConfig={draggable ? { handle: ".widget-header", enabled: true } : { enabled: false }}
        resizeConfig={{ enabled: draggable }}
      >
        {dashboard.instances.map((instance) => {
          const resolvedFilter = resolveFilter(dashboard.filter, instance.config);
          const filteredIndex = applyFilter(index, resolvedFilter);
          const typeDef = getWidgetType(instance.widgetTypeId);
          const titleKey = typeDef?.titleKey ?? "widget.unknown";

          return (
            <div key={instance.instanceId} className="widget-item">
              <WidgetHeader
                titleKey={titleKey}
                onConfigClick={() =>
                  setConfigInstanceId(
                    configInstanceId === instance.instanceId ? null : instance.instanceId,
                  )
                }
                onDuplicateClick={() =>
                  useDashboardStore
                    .getState()
                    .duplicateWidgetInstance(dashboard.id, instance.instanceId)
                }
                onRemoveClick={() =>
                  useDashboardStore
                    .getState()
                    .removeWidgetInstance(dashboard.id, instance.instanceId)
                }
              />
              <div className="widget-item__body">
                {renderWidgetContent(instance, filteredIndex)}
              </div>
              {configInstanceId === instance.instanceId &&
                (() => {
                  const ConfigPanel = CONFIG_PANELS[instance.widgetTypeId];
                  if (!ConfigPanel) return null;
                  return (
                    <ConfigPanel
                      instance={instance}
                      onUpdate={(cfg) => updateWidgetConfig(dashboard.id, instance.instanceId, cfg)}
                      onClose={() => setConfigInstanceId(null)}
                    />
                  );
                })()}
            </div>
          );
        })}
      </Responsive>
    </div>
  );
}
