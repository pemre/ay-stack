// Barrel export -- will re-export WidgetShell, the registry, the options-schema
// system, the generated config panel, DashboardGrid, and the persistence
// middleware factories as each is implemented.

export type {
  GeneratedConfigPanelLabels,
  GeneratedConfigPanelProps,
} from "./ConfigPanel/GeneratedConfigPanel";
export { GeneratedConfigPanel } from "./ConfigPanel/GeneratedConfigPanel";
export type {
  DashboardGridInstance,
  DashboardGridPosition,
  DashboardGridProps,
} from "./DashboardGrid/DashboardGrid";
export { DashboardGrid } from "./DashboardGrid/DashboardGrid";
export { createBroadcastMiddleware } from "./persistence/createBroadcastMiddleware";
export type { MigrationResult } from "./persistence/createMigrationRunner";
export { createMigrationRunner } from "./persistence/createMigrationRunner";
export { createPersistenceMiddleware } from "./persistence/createPersistenceMiddleware";
export type {
  CreatePersistenceMiddlewareOptions,
  MiddlewareStateCreator,
  PersistenceAdapter,
  StoreSetState,
} from "./persistence/types";
export { createWidgetRegistry } from "./registry/createWidgetRegistry";
export type { WidgetRenderContext, WidgetSize, WidgetTypeDefinition } from "./registry/types";
export { deriveValidator } from "./schema/deriveValidator";
export {
  booleanField,
  dateStringField,
  enumField,
  numberField,
  stringArrayField,
  stringField,
} from "./schema/fieldKinds";
export type {
  BooleanField,
  DateStringField,
  EnumField,
  FieldDescriptor,
  FieldKind,
  NumberField,
  OptionsSchema,
  StringArrayField,
  StringField,
} from "./schema/types";
export { validateWidgetConfig } from "./schema/validateWidgetConfig";
export type { WidgetErrorBoundaryProps } from "./WidgetShell/WidgetErrorBoundary";
export { WidgetErrorBoundary } from "./WidgetShell/WidgetErrorBoundary";
export type {
  WidgetShellIcons,
  WidgetShellLabels,
  WidgetShellProps,
} from "./WidgetShell/WidgetShell";
export { WidgetShell } from "./WidgetShell/WidgetShell";
