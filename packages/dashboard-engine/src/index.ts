// Barrel export -- will re-export WidgetShell, the registry, the options-schema
// system, the generated config panel, DashboardGrid, and the persistence
// middleware factories as each is implemented.

export type {
  GeneratedConfigPanelLabels,
  GeneratedConfigPanelProps,
} from "./ConfigPanel/GeneratedConfigPanel";
export { GeneratedConfigPanel } from "./ConfigPanel/GeneratedConfigPanel";
export type { WidgetErrorBoundaryProps } from "./WidgetShell/WidgetErrorBoundary";
export { WidgetErrorBoundary } from "./WidgetShell/WidgetErrorBoundary";
export type { WidgetShellLabels, WidgetShellProps } from "./WidgetShell/WidgetShell";
export { WidgetShell } from "./WidgetShell/WidgetShell";
