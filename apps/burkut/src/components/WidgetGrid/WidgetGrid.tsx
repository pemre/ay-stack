import {
  DashboardGrid,
  type DashboardGridInstance,
  type DashboardGridProps,
  type WidgetTypeDefinition as EngineWidgetTypeDefinition,
} from "@ay/ui-library";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import config from "../../config";
import { useTheme } from "../../hooks/useTheme.tsx";
import type { ContentIndex, Dashboard, WidgetConfig, WidgetInstance } from "../../shared/types.ts";
import { useDashboardStore } from "../../stores/dashboardStore.ts";
import { applyFilter, resolveFilter } from "../../utils/contentFilter.ts";
import { WidgetPicker } from "../WidgetPicker/WidgetPicker.tsx";
import "./WidgetGrid.css";
import {
  getWidgetType,
  type SchemaConfig,
  type WidgetRenderContext,
  type WidgetTypeDefinition,
} from "./widgetTypeRegistry.ts";

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

const EMPTY_HIDDEN_GROUPS = new Set<string>();
type EngineInstance = DashboardGridInstance<SchemaConfig> & { source: WidgetInstance };
type EngineWidgetDefinition = EngineWidgetTypeDefinition<WidgetRenderContext>;

function getConfigPanelLabels(
  t: (key: string, options?: Record<string, unknown>) => string,
  typeId: string,
) {
  const labelsByType: Record<
    string,
    { title: string; addTagPlaceholder?: string; removeTagAriaLabel?: (tag: string) => string }
  > = {
    "tree-list": {
      title: t("config.sidebar.title"),
      addTagPlaceholder: t("config.sidebar.tagPlaceholder"),
      removeTagAriaLabel: (tag) => t("config.sidebar.removeTag", { tag }),
    },
    "markdown-viewer": { title: t("config.content.title") },
    "geo-map": { title: t("config.map.title") },
    "linear-timeline": { title: t("config.timeline.title") },
  };
  return {
    title: labelsByType[typeId]?.title ?? t("widget.config"),
    closeAriaLabel: t("widget.close"),
    addTagPlaceholder: labelsByType[typeId]?.addTagPlaceholder,
    removeTagAriaLabel: labelsByType[typeId]?.removeTagAriaLabel,
  };
}

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
  const { theme } = useTheme();
  const draggable = config.features.draggableLayout;
  const [pickerOpen, setPickerOpen] = useState(false);
  const updateWidgetConfig = useDashboardStore((state) => state.updateWidgetConfig);

  const renderContext = useMemo<WidgetRenderContext>(
    () => ({
      index,
      getFilteredIndex: (widgetConfig) =>
        applyFilter(index, resolveFilter(dashboard.filter, widgetConfig)),
      getContent,
      selectedId,
      onSelectItem,
      isComplete,
      onToggleComplete,
      completedSet,
      hiddenGroups: EMPTY_HIDDEN_GROUPS,
      theme,
      t,
    }),
    [
      index,
      dashboard.filter,
      getContent,
      selectedId,
      onSelectItem,
      isComplete,
      onToggleComplete,
      completedSet,
      theme,
      t,
    ],
  );

  const instances = useMemo<EngineInstance[]>(
    () =>
      dashboard.instances.map((source) => {
        const typeDef = getWidgetType(source.widgetTypeId);
        return {
          ...source,
          source,
          config: (typeDef?.toSchemaConfig(source.config) ?? source.config) as SchemaConfig,
        };
      }),
    [dashboard.instances],
  );

  const handleUpdateConfig = (
    instance: EngineInstance,
    partial: Record<string, unknown>,
    typeDef: WidgetTypeDefinition,
  ) => {
    const domainConfig = typeDef.fromSchemaConfig({ ...instance.config, ...partial });
    updateWidgetConfig(dashboard.id, instance.instanceId, domainConfig as Partial<WidgetConfig>);
  };

  return (
    <div className="widget-grid-container">
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
      <DashboardGrid
        instances={instances}
        resolveType={
          getWidgetType as unknown as (typeId: string) => EngineWidgetDefinition | undefined
        }
        renderContext={renderContext}
        draggable={draggable}
        shellLabels={{
          configAriaLabel: t("widget.config"),
          duplicateAriaLabel: t("widget.duplicate"),
          removeAriaLabel: t("widget.remove"),
          closeAriaLabel: t("widget.close"),
        }}
        getWidgetTitle={(_instance, typeDef) => t(typeDef?.titleKey ?? "widget.unknown")}
        getUnknownWidgetMessage={(instance) => t("widget.unknown", { type: instance.widgetTypeId })}
        onLayoutChange={(layout) =>
          useDashboardStore.getState().onLayoutChange(dashboard.id, [...layout])
        }
        onDuplicate={(instance) =>
          useDashboardStore.getState().duplicateWidgetInstance(dashboard.id, instance.instanceId)
        }
        onRemove={(instance) =>
          useDashboardStore.getState().removeWidgetInstance(dashboard.id, instance.instanceId)
        }
        onUpdateInstanceConfig={
          handleUpdateConfig as unknown as NonNullable<
            DashboardGridProps<WidgetRenderContext, EngineInstance>["onUpdateInstanceConfig"]
          >
        }
        getConfigPanelLabels={(instance) => getConfigPanelLabels(t, instance.widgetTypeId)}
      />
    </div>
  );
}
