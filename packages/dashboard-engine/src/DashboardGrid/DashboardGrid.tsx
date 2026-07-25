import { type ReactNode, type RefObject, useMemo, useState } from "react";
import type { Layout, ResponsiveLayouts } from "react-grid-layout";
import { Responsive, useContainerWidth } from "react-grid-layout";
import {
  GeneratedConfigPanel,
  type GeneratedConfigPanelLabels,
} from "../ConfigPanel/GeneratedConfigPanel";
import type { WidgetTypeDefinition } from "../registry/types";
import { WidgetShell, type WidgetShellLabels } from "../WidgetShell/WidgetShell";
import "./DashboardGrid.css";

export interface DashboardGridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface DashboardGridInstance<TConfig = unknown> {
  instanceId: string;
  widgetTypeId: string;
  position: DashboardGridPosition;
  config: TConfig;
}

export interface DashboardGridProps<
  TCtx = unknown,
  TInstance extends DashboardGridInstance = DashboardGridInstance,
> {
  instances: readonly TInstance[];
  resolveType: (typeId: string) => WidgetTypeDefinition<TCtx> | undefined;
  renderContext: TCtx;
  onLayoutChange?: (currentLayout: Layout, allLayouts: ResponsiveLayouts) => void;
  draggable?: boolean;
  shellLabels?: WidgetShellLabels;
  getWidgetTitle?: (instance: TInstance, typeDef: WidgetTypeDefinition<TCtx> | undefined) => string;
  getUnknownWidgetMessage?: (instance: TInstance) => ReactNode;
  onConfigClick?: (instance: TInstance, typeDef: WidgetTypeDefinition<TCtx>) => void;
  onDuplicate?: (instance: TInstance) => void;
  onRemove?: (instance: TInstance) => void;
  onClose?: (instance: TInstance) => void;
  onUpdateInstanceConfig?: (
    instance: TInstance,
    partial: Record<string, unknown>,
    typeDef: WidgetTypeDefinition<TCtx>,
  ) => void;
  getConfigPanelLabels?: (
    instance: TInstance,
    typeDef: WidgetTypeDefinition<TCtx>,
  ) => GeneratedConfigPanelLabels;
  isInstanceEmpty?: (
    instance: TInstance,
    typeDef: WidgetTypeDefinition<TCtx> | undefined,
  ) => boolean;
  renderEmptyState?: (
    instance: TInstance,
    typeDef: WidgetTypeDefinition<TCtx> | undefined,
  ) => ReactNode;
  getLoadingState?: (
    instance: TInstance,
    typeDef: WidgetTypeDefinition<TCtx> | undefined,
  ) => ReactNode;
}

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

function defaultUnknownWidgetMessage(typeId: string): string {
  return `Unknown widget type: ${typeId}`;
}

function toConfigRecord(config: unknown): Record<string, unknown> {
  if (config && typeof config === "object" && !Array.isArray(config)) {
    return config as Record<string, unknown>;
  }

  return {};
}

function UnknownWidgetContent<TInstance extends DashboardGridInstance>({
  instance,
  getUnknownWidgetMessage,
}: {
  instance: TInstance;
  getUnknownWidgetMessage?: (instance: TInstance) => ReactNode;
}): JSX.Element {
  return (
    <div className="dashboard-grid__unknown-widget">
      {getUnknownWidgetMessage?.(instance) ?? defaultUnknownWidgetMessage(instance.widgetTypeId)}
    </div>
  );
}

function ResolvedWidget<TCtx, TInstance extends DashboardGridInstance>({
  instance,
  typeDef,
  renderContext,
}: {
  instance: TInstance;
  typeDef: WidgetTypeDefinition<TCtx>;
  renderContext: TCtx;
}): JSX.Element {
  const WidgetComponent = typeDef.component;
  const props = typeDef.buildProps(renderContext, instance.config);

  return <WidgetComponent {...props} />;
}

export function DashboardGrid<
  TCtx = unknown,
  TInstance extends DashboardGridInstance = DashboardGridInstance,
>({
  instances,
  resolveType,
  renderContext,
  onLayoutChange,
  draggable = true,
  shellLabels,
  getWidgetTitle,
  getUnknownWidgetMessage,
  onConfigClick,
  onDuplicate,
  onRemove,
  onClose,
  onUpdateInstanceConfig,
  getConfigPanelLabels,
  isInstanceEmpty,
  renderEmptyState,
  getLoadingState,
}: DashboardGridProps<TCtx, TInstance>): JSX.Element {
  const { width, containerRef } = useContainerWidth();
  const [configInstanceId, setConfigInstanceId] = useState<string | null>(null);

  const layoutItems = useMemo(
    () =>
      instances.map((instance) => ({
        i: instance.instanceId,
        x: instance.position.x,
        y: instance.position.y,
        w: instance.position.w,
        h: instance.position.h,
        minW: instance.position.minW,
        minH: instance.position.minH,
        static: !draggable,
      })),
    [instances, draggable],
  );

  return (
    <div className="widget-grid-container" ref={containerRef as RefObject<HTMLDivElement>}>
      <Responsive
        width={width}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        layouts={{ lg: layoutItems }}
        rowHeight={60}
        onLayoutChange={onLayoutChange}
        dragConfig={draggable ? { handle: ".widget-header", enabled: true } : { enabled: false }}
        resizeConfig={{ enabled: draggable }}
      >
        {instances.map((instance) => {
          const typeDef = resolveType(instance.widgetTypeId);
          const title =
            getWidgetTitle?.(instance, typeDef) ?? typeDef?.titleKey ?? instance.widgetTypeId;
          const configPanelLabelsFactory = getConfigPanelLabels;
          const updateInstanceConfig = onUpdateInstanceConfig;
          const canRenderGeneratedConfigPanel = Boolean(
            typeDef?.optionsSchema && updateInstanceConfig && configPanelLabelsFactory,
          );
          const configPanelLabels =
            canRenderGeneratedConfigPanel && typeDef && configPanelLabelsFactory
              ? configPanelLabelsFactory(instance, typeDef)
              : undefined;
          const shouldShowConfigAction = Boolean(
            typeDef?.optionsSchema && (canRenderGeneratedConfigPanel || onConfigClick),
          );

          const handleConfigClick =
            typeDef && shouldShowConfigAction
              ? () => {
                  if (canRenderGeneratedConfigPanel) {
                    setConfigInstanceId((current) =>
                      current === instance.instanceId ? null : instance.instanceId,
                    );
                  }
                  onConfigClick?.(instance, typeDef);
                }
              : undefined;

          return (
            <WidgetShell
              key={instance.instanceId}
              title={title}
              labels={shellLabels}
              draggable={draggable}
              onConfigClick={handleConfigClick}
              onDuplicateClick={onDuplicate ? () => onDuplicate(instance) : undefined}
              onRemoveClick={onRemove ? () => onRemove(instance) : undefined}
              onClose={onClose ? () => onClose(instance) : undefined}
              isEmpty={isInstanceEmpty?.(instance, typeDef)}
              emptyState={renderEmptyState?.(instance, typeDef)}
              loadingState={getLoadingState?.(instance, typeDef)}
            >
              {typeDef ? (
                <ResolvedWidget
                  instance={instance}
                  typeDef={typeDef}
                  renderContext={renderContext}
                />
              ) : (
                <UnknownWidgetContent
                  instance={instance}
                  getUnknownWidgetMessage={getUnknownWidgetMessage}
                />
              )}
              {typeDef?.optionsSchema &&
                canRenderGeneratedConfigPanel &&
                configPanelLabels &&
                updateInstanceConfig &&
                configInstanceId === instance.instanceId && (
                  <GeneratedConfigPanel
                    schema={typeDef.optionsSchema}
                    config={toConfigRecord(instance.config)}
                    labels={configPanelLabels}
                    onUpdate={(partial) => updateInstanceConfig(instance, partial, typeDef)}
                    onClose={() => setConfigInstanceId(null)}
                  />
                )}
            </WidgetShell>
          );
        })}
      </Responsive>
    </div>
  );
}
