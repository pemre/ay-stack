# Requirements Document

## Introduction

Phase 2 of the `ay-stack` roadmap (`dashboard-engine-extraction`). Extracts the
grid, a real `WidgetShell` with an error boundary, the widget-type registry, and
schema-driven widget options out of `apps/burkut` into a new publishable package,
`@ay/dashboard-engine`. The four purified widgets (`Sidebar`, `ContentPanel`,
`MapPanel`, `TimelinePanel`) move into `@ay/ui-library` as Blocks, renamed to match
their already-renamed widget-type IDs: `TreeList`, `MarkdownViewer`, `GeoMap`,
`LinearTimeline`.

**Entry criteria.** `widget-purity-contract` (Phase 1) is complete: all four
widgets take view models, `labels`, and `config`; no `useTranslation`/`useTheme`
inside them; type IDs are renamed (`tree-list`, `markdown-viewer`, `geo-map`,
`linear-timeline`); a migration handler upgrades `version: 1` layout documents.

**Correction to the roadmap's framing.** The roadmap describes the registry
prop-wiring as a hardcoded `switch` on `widgetTypeId` with a second hardcoded
config-panel map. Neither exists in the current code: `WidgetTypeDefinition`
already carries a `buildProps(ctx, config)` callback and a per-type `configPanel`
component, and `WidgetGrid` resolves both generically through
`getWidgetType(typeId)`. That leak was already closed during Phase 1. This spec
does not re-do that work; it builds the schema-driven options system, the error
boundary, and the package split on top of the registry as it exists today.

**Explicit scope decision.** The roadmap's "consider splitting `@ay/ui` from
`@ay/widgets`" is deferred per the roadmap's own deferred ledger ("Phase 2 or the
second app" — picking it up now would be premature with only one consumer).
`@ay/ui-library` gains heavier peer dependencies (`leaflet`, `react-leaflet`,
`vis-timeline`, `vis-data`, `react-markdown`, `remark-gfm`) as a direct, accepted
consequence of deferring that split.

## Glossary

- **Dashboard_Engine**: The new `@ay/dashboard-engine` package — grid rendering,
  widget-type registry, `WidgetShell`, options-schema utilities, and the
  persistence/broadcast middleware factories.
- **Widget_Shell**: The component that owns a widget instance's header, error
  boundary, loading/empty states, and body — replacing the current sibling
  arrangement of `WidgetHeader` next to a bare body `div`.
- **Widget_Type_Definition**: A registry entry: `typeId`, `component`, sizing,
  `defaultConfig`, `buildProps`, and now an `optionsSchema` describing its
  configurable fields.
- **Options_Schema**: A declarative list of field descriptors (key, kind, label,
  default, and kind-specific constraints) attached to a `Widget_Type_Definition`,
  used to both validate a widget's persisted `config` and generate its config
  panel UI.
- **Standard_Schema**: The `@standard-schema/spec` interface
  (`~standard.validate`). The Dashboard_Engine's own field-level validators
  implement this interface so any Standard-Schema-compliant validator (zod,
  valibot, arktype, or the engine's own primitives) can back an `Options_Schema`
  field without the engine importing a specific validator library.
- **Persistence_Adapter**: An interface (`load`/`save`) the Dashboard_Engine
  defines and an app implements, decoupling the engine's persistence middleware
  from any specific storage transport.
- **Untrusted_Boundary**: A point where data enters the app from outside
  TypeScript's type checking — the persisted layout document read from disk, and
  a widget's `config` read from that document. Validation happens once at each
  boundary, not on every render.
- **Block**: `@ay/ui-library`'s term for a full, self-contained UI component with
  its own stories and tests (existing examples: `SpiralTimeline`, `ImageZoom`).

## Requirements

### Requirement 1: `WidgetShell` with an error boundary

**User Story:** As a dashboard user, I want one widget crashing to not take down
the rest of my dashboard, so that a bug in one widget doesn't cost me my whole
layout.

#### Acceptance Criteria

1. THE Dashboard_Engine SHALL export a `WidgetShell` component that owns a single
   widget instance's header and body as one composed unit, replacing the current
   arrangement where `WidgetHeader` is a sibling of the body inside `WidgetGrid`.
2. WHEN a widget's rendering throws during render, THE Widget_Shell SHALL catch
   the error via a React error boundary and render a shell-level error state
   instead of leaving a blank grid cell or crashing the surrounding grid.
3. THE Widget_Shell's error state SHALL include the widget's title, an
   app-supplied error message, and a retry action that re-attempts rendering the
   widget without a full page reload.
4. THE Widget_Shell SHALL NOT call `useTranslation()` or `useTheme()` directly;
   all display text SHALL arrive via a `labels` prop and theme-dependent values
   SHALL arrive via `config`, matching the purity contract already applied to the
   four widgets.
5. WHEN a widget instance's data is not yet ready, THE Widget_Shell SHALL support
   an app-supplied loading state via React Suspense; the app decides what counts
   as "loading," the shell only provides the boundary.
6. WHEN a widget instance has no content to show (e.g. an empty tree, zero
   timeline items), THE Widget_Shell SHALL support an app-supplied empty state
   passed as a prop, rendered in place of the widget body.
7. A throwing widget SHALL be independently recoverable: removing and re-adding
   the widget instance, or the shell's retry action, SHALL clear the error state
   without requiring other widgets on the dashboard to re-render.

### Requirement 2: Options schema on the widget-type registry

**User Story:** As a developer adding a new widget type, I want to declare its
configurable fields once and get a working config panel for free, so that adding
a widget type doesn't also mean hand-writing a settings UI.

#### Acceptance Criteria

1. THE Dashboard_Engine SHALL export an `Options_Schema` type: an ordered list of
   field descriptors, each with a `key`, a `kind` (`string`, `number`, `boolean`,
   `stringArray`, `enum`, `dateString`), a `label`, an optional `description`, a
   `default` value, and kind-specific constraints (e.g. `enum` options,
   `number` min/max).
2. A `Widget_Type_Definition` SHALL be able to declare an optional
   `optionsSchema: Options_Schema`.
3. THE Dashboard_Engine SHALL export a function that derives a Standard_Schema
   validator from an `Options_Schema`, so the same field list backs both
   validation and UI generation without being declared twice.
4. WHEN a widget type declares no `optionsSchema`, THE Dashboard_Engine SHALL
   treat that widget type as unconfigurable — no config panel is offered for it.
5. Each of the four existing widget types (`tree-list`, `markdown-viewer`,
   `geo-map`, `linear-timeline`) SHALL declare an `optionsSchema` that covers
   every field currently exposed by its hand-written config panel
   (`SidebarConfigPanel`, `ContentConfigPanel`, `MapConfigPanel`,
   `TimelineConfigPanel`), with no field silently dropped.

### Requirement 3: Config panels generated from the options schema

**User Story:** As a developer, I want config panels to come from the registry
automatically, so that the four hand-written panel components can be deleted and
never need to be hand-written again for future widget types.

#### Acceptance Criteria

1. THE Dashboard_Engine SHALL export a config panel component that, given a
   Widget_Type_Definition's `optionsSchema`, a widget instance's current `config`,
   and an `onUpdate` callback, renders one form control per field descriptor and
   calls `onUpdate` with a partial config on each change.
2. THE generated panel SHALL render each field kind with an appropriate control:
   text input for `string`, number input for `number`, checkbox for `boolean`,
   a tag/chip editor for `stringArray`, a select for `enum`, and a date input for
   `dateString` — matching the existing hand-written panels' controls.
3. WHEN the grid needs to show a config panel for a widget instance, THE
   Dashboard_Engine's grid component SHALL resolve it from the widget type's
   `optionsSchema` via the generated panel, not from an app-supplied
   `configPanel` component reference.
4. `SidebarConfigPanel.tsx`, `ContentConfigPanel.tsx`, `MapConfigPanel.tsx`, and
   `TimelineConfigPanel.tsx` SHALL be deleted once their fields are fully
   represented by `optionsSchema` declarations on the corresponding widget types.
5. THE generated panel's field labels and any static strings (e.g. "Add tag")
   SHALL be supplied by the app through the field descriptors' `label` values —
   the generated panel component itself SHALL NOT call `useTranslation()`.

### Requirement 4: Validation only at untrusted boundaries

**User Story:** As a developer, I want validation to happen where data enters the
system and nowhere else, so that a corrupted layout file degrades gracefully
without a per-render validation cost on every widget.

#### Acceptance Criteria

1. WHEN the persisted layout document is loaded (on hydration from the
   Persistence_Adapter), THE Dashboard_Engine SHALL validate each widget
   instance's `config` against its widget type's derived Standard_Schema
   validator exactly once.
2. IF a widget instance's persisted `config` fails validation, THEN THE
   Dashboard_Engine SHALL fall back to that widget type's `defaultConfig` for the
   invalid fields rather than discarding the widget instance or crashing
   hydration.
3. THE Dashboard_Engine SHALL NOT re-validate a widget instance's `config` on
   every render; validation SHALL run once per load and once per explicit config
   update (from the generated config panel), not on the render path.
4. THE app-level widget-registration call (registering a `Widget_Type_Definition`
   with an `optionsSchema`) SHALL be validated for internal consistency (e.g. an
   `enum` field declaring a `default` that isn't one of its own options) once at
   registration time, in development, so a malformed schema fails fast instead of
   producing a broken config panel at runtime.

### Requirement 5: Standard Schema, not a hard-coded validator

**User Story:** As a maintainer of the engine, I want to depend on an interface
rather than a specific validation library, so that consumers aren't forced onto
whichever validator the engine happened to pick.

#### Acceptance Criteria

1. THE Dashboard_Engine's public validation surface (the function that derives a
   validator from an `Options_Schema`, and any function that accepts a validator)
   SHALL be typed against the `@standard-schema/spec` `StandardSchemaV1`
   interface, not against a concrete library's schema type.
2. THE Dashboard_Engine SHALL implement its own field-level validators (for the
   six field kinds in Requirement 2.1) as Standard-Schema-compliant objects,
   without adding `zod` or any other validation library as a dependency.
3. `Widget_Type_Definition.optionsSchema` fields SHALL be expressible without any
   widget author needing to import a third-party validation library — the engine's
   built-in field kinds SHALL cover every field currently configurable on the four
   existing widget types.

### Requirement 6: Pluggable persistence and cross-tab sync

**User Story:** As a developer embedding the Dashboard_Engine in an app other than
Bürküt, I want to supply my own storage transport, so that I'm not locked into
Bürküt's dev-server HTTP endpoints.

#### Acceptance Criteria

1. THE Dashboard_Engine SHALL export a `Persistence_Adapter` interface with
   `load(): Promise<T | null>` and `save(state: T): Promise<void>` methods,
   generic over the persisted state shape.
2. THE Dashboard_Engine SHALL export a Zustand middleware factory that, given a
   `Persistence_Adapter`, a current schema version, and a map of version-keyed
   migrations, reproduces the existing debounced-save / retry-with-backoff /
   hydrate-on-load behavior currently hardcoded in
   `apps/burkut/src/stores/persistenceMiddleware.ts`, generically over the state
   shape rather than tied to `Dashboard[]`.
3. THE Dashboard_Engine SHALL export a Zustand middleware factory for cross-tab
   sync via `BroadcastChannel`, parameterized by channel name, generalizing
   `apps/burkut/src/stores/broadcastMiddleware.ts` so it is not tied to
   `Dashboard[]`.
4. `apps/burkut` SHALL supply a `Persistence_Adapter` implementation that wraps
   its existing `GET`/`POST /api/layouts` fetch calls, and SHALL continue to
   persist to `.burkut/layouts/dashboard.json` via the existing dev-server
   middleware in `apps/burkut/vite-plugins/burkut-content.ts` with no change in
   the on-disk format.
5. THE migration behavior already implemented in
   `apps/burkut/src/stores/layoutMigrations.ts` (version detection, the v1→v2
   widget-type-ID rename, unversioned input treated as v1) SHALL be preserved
   exactly, expressed as migrations passed into the engine's generic migration
   runner.

### Requirement 7: Widgets become `@ay/ui-library` Blocks

**User Story:** As a developer building a second app on this stack, I want the
four dashboard widgets available as importable library Blocks, so that I don't
have to re-implement a tree list, markdown viewer, geo map, or linear timeline
from scratch.

#### Acceptance Criteria

1. `apps/burkut/src/components/Sidebar` SHALL move to
   `packages/ui-library/src/blocks/TreeList`, with the component renamed from
   `Sidebar` to `TreeList` and its exported types renamed accordingly
   (`SidebarLabels` → `TreeListLabels`, `SidebarConfig` → `TreeListConfig`, etc.).
2. `apps/burkut/src/components/ContentPanel` SHALL move to
   `packages/ui-library/src/blocks/MarkdownViewer`, renamed from `ContentPanel` to
   `MarkdownViewer`.
3. `apps/burkut/src/components/MapPanel` SHALL move to
   `packages/ui-library/src/blocks/GeoMap`, renamed from `MapPanel` to `GeoMap`.
4. `apps/burkut/src/components/TimelinePanel` SHALL move to
   `packages/ui-library/src/blocks/LinearTimeline`, renamed from `TimelinePanel`
   to `LinearTimeline`, pairing with the existing `SpiralTimeline` Block per the
   roadmap's naming intent.
5. Each moved Block SHALL retain its existing `config`/`DEFAULT_*_LABELS` purity
   contract from Phase 1 unchanged in behavior — this is a location and name
   change, not a re-purification.
6. Each moved Block SHALL gain a `.stories.tsx` file (following the existing
   `SpiralTimeline.stories.tsx` / `ImageZoom.stories.tsx` pattern) and keep its
   existing test file, moved and updated for the new name and location.
7. `packages/ui-library/src/index.ts` SHALL export all four new Blocks and their
   public types from the barrel, following the existing export pattern for
   `SpiralTimeline` and `ImageZoom`.
8. `packages/ui-library/package.json` SHALL declare `leaflet`, `react-leaflet`,
   `vis-timeline`, `vis-data`, `react-markdown`, and `remark-gfm` as peer (or
   direct, whichever matches each library's existing runtime requirement)
   dependencies, and `apps/burkut/package.json` SHALL drop these from its own
   `dependencies` once nothing in `apps/burkut/src` imports them directly.
9. `apps/burkut` SHALL consume the four Blocks from `@ay/ui-library` instead of
   its own `src/components/*`, with the Local Dev Alias (`AY_LOCAL=1`) continuing
   to resolve them to source per the existing steering document — no new alias
   entries required beyond what `AY_LOCAL_ENTRIES` already covers for
   `@ay/ui-library`.

### Requirement 8: Registry and grid move into `@ay/dashboard-engine`

**User Story:** As a developer, I want the grid and registry mechanics reusable
outside Bürküt, so that a second app can build its own dashboard on the same
engine.

#### Acceptance Criteria

1. THE Dashboard_Engine SHALL export `WidgetTypeDefinition`, a registry factory
   (`createWidgetRegistry()`) returning `register`/`get`/`getAll` operations, and
   a `WidgetRenderContext` type generic enough that Bürküt's specific context
   shape (content index, selection, i18n `t`, theme) is a concrete instantiation
   of it, not a hardcoded shape inside the engine.
2. THE Dashboard_Engine SHALL export a grid component (the generalized successor
   to `apps/burkut/src/components/WidgetGrid/WidgetGrid.tsx`) that renders
   `Widget_Shell`-wrapped instances on a responsive `react-grid-layout` grid,
   taking widget resolution, render context, and layout-change callbacks as
   props rather than importing Bürküt's store or types directly.
3. `apps/burkut/src/components/WidgetGrid/widgetTypeRegistry.ts` SHALL become a
   thin file that calls the engine's `createWidgetRegistry()` and registers
   Bürküt's four built-in types (now pointing at the `@ay/ui-library` Blocks),
   with their `buildProps` and new `optionsSchema` declarations.
4. `apps/burkut/src/components/WidgetGrid/WidgetGrid.tsx` SHALL become a thin
   adapter that assembles Bürküt's `WidgetRenderContext` and passes it, along
   with the registry, to the engine's grid component.
5. `apps/burkut/src/components/WidgetHeader` SHALL be removed; its
   responsibilities (title display, drag handle, config/duplicate/remove/close
   actions) SHALL be absorbed into the engine's `Widget_Shell`, with Bürküt
   supplying translated label strings rather than the shell resolving i18n keys
   itself.
6. THE legacy `apps/burkut/src/components/WidgetGrid/widgetRegistry.ts`
   (`WIDGET_REGISTRY` array) and its remaining consumers
   (`WidgetVisibilityMenu`, `useLayoutPersistence`) SHALL be reconciled with the
   active `widgetTypeRegistry.ts` — either migrated onto the engine's registry or
   removed if dead, so exactly one registry exists.
7. `@ay/dashboard-engine`'s `package.json` SHALL NOT declare `@ay/ui-library` as
   a dependency, satisfying the roadmap's exit criterion that the engine does not
   depend on the block library.

### Requirement 9: `@ay/dashboard-engine` package shape

**User Story:** As a maintainer, I want the new package to follow the workspace's
existing conventions, so that it builds, lints, tests, and publishes the same way
every other package does.

#### Acceptance Criteria

1. THE package SHALL live at `packages/dashboard-engine/`, named
   `@ay/dashboard-engine`, and follow `@ay/ui-library`'s publishable shape
   (`type: module`, `main`/`module`/`types` fields, an `exports` map, a `files`
   list of `dist`/`README.md`/`CHANGELOG.md`/`LICENSE`, `publishConfig.access:
   "public"`), not `@ay/vite-config`'s private/unbuilt shape.
2. THE package SHALL build via `vite build` in library mode with
   `vite-plugin-dts`, mirroring `packages/ui-library/vite.config.ts`, externalizing
   `react`, `react-dom`, and `zustand`.
3. THE package's own test suite SHALL run under the workspace's shared Vitest /
   Biome / TypeScript catalog versions (`catalog:` in `pnpm-workspace.yaml`), with
   `typecheck`, `lint`, `test`, and `build` scripts matching the other packages'
   names so `pnpm -r` and `pnpm verify` pick it up with no special-casing.
4. THE package SHALL declare `react` and `react-dom` as peer dependencies (like
   `@ay/ui-library`) and `zustand` as a peer or direct dependency, and SHALL
   declare no dependency on `@ay/ui-library` or `@ay/tokens`, per its position at
   the root of a new, independent branch of the dependency graph
   (`@ay/dashboard-engine` — no workspace dependency in either direction with
   `@ay/tokens`/`@ay/ui-library`).
5. `pnpm-workspace.yaml`'s `packages` glob (`packages/*`) already covers the new
   package directory; no change to that file is required.
6. `AY_LOCAL_ENTRIES` in `packages/vite-config/src/index.ts` SHALL gain an entry
   for `@ay/dashboard-engine` pointing at its `src/index.ts`, so Bürküt's
   `AY_LOCAL=1` workflow resolves it to source like the other two packages.

### Requirement 10: No regression in Bürküt's dashboard behavior

**User Story:** As a Bürküt user, I want the dashboard to look and behave exactly
as before after this refactor, so that a purely internal restructuring doesn't
change my day-to-day experience.

#### Acceptance Criteria

1. WHEN the refactor is complete, Bürküt's dashboard SHALL render the same four
   widget types, at the same default sizes and positions, as before.
2. Existing persisted layouts in `.burkut/layouts/dashboard.json` (schema
   version 2, current widget type IDs) SHALL continue to load and render
   correctly with no required manual migration step.
3. Drag, resize, add-widget, remove-widget, duplicate-widget, and per-widget
   config panel interactions SHALL continue to work exactly as before from the
   user's perspective.
4. Cross-tab sync (`BroadcastChannel`) and disk persistence (`POST`/`GET
   /api/layouts`) SHALL continue to function with no change in wire format.
5. The token-architecture baseline diff (`tools/tokens/baseline.json`,
   `perSource` comparison) SHALL remain green — this refactor moves component
   code, not styling, and introduces no new component-tier token usage that
   reaches into the core tier.
6. `pnpm verify` (`typecheck` → `lint` → `test` → `build`, every package) SHALL
   pass at the end of the refactor.
