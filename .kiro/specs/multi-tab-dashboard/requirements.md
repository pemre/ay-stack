# Requirements Document

## Introduction

Multi-Dashboard Multi-Browser-Tab System for Bürküt, following a Datadog-style multi-instance widget model. A Dashboard is a "widget holder" — a named canvas to which users add, remove, duplicate, and configure individual Widget Instances. Each Widget Instance belongs to a Widget Type (sidebar, content, map, timeline) and carries its own unique instance ID, grid position/size, and per-instance configuration. Multiple instances of the same Widget Type may coexist on a single Dashboard (e.g., two Sidebar widgets filtered by different tags, three Timeline widgets showing different date ranges). Dashboards are managed via Zustand and synchronized across browser tabs using the BroadcastChannel API ("Zustand Sync Tabs" pattern) — dashboard definitions (the list of dashboards and their contents) are synced, but each browser tab independently selects which dashboard to view, enabling multi-monitor workflows where different monitors show different dashboards. Layout data is persisted to `.burkut/layouts/` on disk; each browser tab's active dashboard selection is persisted to sessionStorage. A set of built-in Dashboard Templates (Daily, Monthly, Travel, etc.) lets users bootstrap new dashboards with pre-configured Widget Instances. The dashboard switcher bar lives in the app header.

## Glossary

- **Dashboard_Store**: The Zustand store that holds two layers of state: (1) shared state — the ordered list of Dashboards with their widget instances, widget configs, content filters, and display names — which is synchronized across all browser tabs via Cross_Tab_Sync; and (2) local state — the active dashboard ID for this browser tab — which is NOT synchronized and is maintained independently per browser tab. This two-layer design enables multi-monitor workflows where each browser tab views a different Dashboard simultaneously.
- **Dashboard**: A named widget holder that contains an ordered collection of Widget Instances, an optional dashboard-level Content_Filter, and display metadata. Each Dashboard is identified by a unique string ID. A Dashboard is analogous to a Datadog dashboard — a canvas onto which users place widget instances.
- **Dashboard_Bar**: The horizontal UI strip rendered inside the app header that displays dashboard buttons, allows reordering, and provides controls for creating, renaming, and deleting dashboards.
- **Widget_Type**: A category of widget registered in the Widget_Type_Registry. The built-in types are: `sidebar`, `content`, `map`, `timeline`. Each Widget_Type defines a React component, a default size, a default Widget_Config, and a localized title key.
- **Widget_Type_Registry**: The static registry of available Widget_Types. It replaces the current `WIDGET_REGISTRY` in `widgetRegistry.ts`. New Widget_Types can be added to this registry without modifying existing type definitions.
- **Widget_Instance**: A concrete, placed occurrence of a Widget_Type on a Dashboard. Each Widget_Instance has a unique instance ID (UUID), a reference to its Widget_Type, a grid position and size (for react-grid-layout), and its own Widget_Config. Multiple Widget_Instances of the same Widget_Type may exist on the same Dashboard.
- **Widget_Config**: A per-instance configuration object attached to a Widget_Instance. The schema varies by Widget_Type. Examples: a Sidebar instance's Widget_Config may specify tag filters; a Timeline instance's Widget_Config may specify a date range; a Map instance's Widget_Config may specify a geographic bounding box. Each Widget_Type defines a default Widget_Config.
- **Content_Filter**: A set of filter criteria (content type, tags, source directory) that controls which content items appear in widgets. Content_Filters exist at two levels: dashboard-level (applies to all Widget_Instances on the Dashboard as a baseline) and instance-level (per Widget_Instance override via Widget_Config).
- **Cross_Tab_Sync**: The mechanism that uses the BroadcastChannel API (via a Zustand middleware) to replicate shared Dashboard_Store state (dashboard definitions, widget instances, widget configs, content filters) to all other open browser tabs of the same Bürküt instance. Cross_Tab_Sync does NOT replicate the active dashboard selection — each browser tab maintains its own active dashboard ID independently, enabling multi-monitor workflows where each tab views a different Dashboard.
- **Layout_Persistence**: The subsystem that serializes the full Dashboard_Store state to a JSON file inside `.burkut/layouts/` and restores it on application start.
- **Dashboard_Template**: A predefined Dashboard configuration (a set of pre-configured Widget_Instances with positions, sizes, and Widget_Configs, plus an optional dashboard-level Content_Filter) that users can select when creating a new dashboard. Examples: "Daily", "Monthly", "Travel".
- **Template_Registry**: The static list of available Dashboard_Templates shipped with Bürküt.
- **Widget_Picker**: The UI component (menu or modal) that displays available Widget_Types from the Widget_Type_Registry and allows the user to add a new Widget_Instance to the active Dashboard.

## Requirements

### Requirement 1: Dashboard State Management

**User Story:** As a user, I want each dashboard to maintain its own independent state and each browser tab to independently choose which dashboard to view, so that I can spread different dashboards across multiple monitors.

#### Acceptance Criteria

1. THE Dashboard_Store SHALL maintain two layers of state: shared state (the ordered list of Dashboards, each containing a unique ID, a display name, an ordered list of Widget_Instances, and an optional dashboard-level Content_Filter) and local state (the active dashboard ID for this browser tab).
2. THE Dashboard_Store SHALL track exactly one active dashboard ID per browser tab; the active dashboard ID SHALL NOT be included in the shared state that is synchronized across browser tabs.
3. WHEN the application starts with no persisted state, THE Dashboard_Store SHALL initialize the shared state with a single default Dashboard named "Dashboard" containing the default set of Widget_Instances (one Sidebar, one Content, one Map, one Timeline) with default positions, sizes, and default Widget_Configs, and SHALL set the local active dashboard ID to that default Dashboard.
4. WHEN a user switches the active dashboard in a browser tab, THE Dashboard_Store SHALL update the local active dashboard ID for that browser tab only, and THE Widget_Grid SHALL render the Widget_Instances of the newly active Dashboard. Other browser tabs SHALL NOT be affected.
5. THE Dashboard_Store SHALL be implemented as a Zustand store with typed state and actions.
6. THE Dashboard_Store SHALL support multiple browser tabs each viewing a different Dashboard simultaneously, enabling multi-monitor workflows.

### Requirement 2: Dashboard Creation

**User Story:** As a user, I want to create new dashboards, so that I can set up multiple views for different purposes.

#### Acceptance Criteria

1. WHEN the user clicks the "add dashboard" button in the Dashboard_Bar, THE Dashboard_Store SHALL append a new Dashboard with a generated unique ID, a default name (e.g. "Dashboard 2"), the default set of Widget_Instances (one Sidebar, one Content, one Map, one Timeline with default positions and Widget_Configs), and an empty dashboard-level Content_Filter.
2. WHEN a new Dashboard is created, THE Dashboard_Store SHALL set the new Dashboard as the active dashboard.
3. WHEN a new Dashboard is created from a Dashboard_Template, THE Dashboard_Store SHALL initialize the Dashboard with the template's predefined Widget_Instances (including their Widget_Types, positions, sizes, and Widget_Configs) and the template's Content_Filter, and set the template name as the Dashboard display name.

### Requirement 3: Dashboard Deletion

**User Story:** As a user, I want to delete dashboards I no longer need, so that I can keep my workspace organized.

#### Acceptance Criteria

1. WHEN the user triggers deletion on a Dashboard, THE Dashboard_Store SHALL remove that Dashboard and all of its Widget_Instances from the ordered list.
2. IF the deleted Dashboard is the currently active dashboard, THEN THE Dashboard_Store SHALL activate the nearest remaining Dashboard (prefer the dashboard to the left, fall back to the right).
3. WHILE only one Dashboard remains, THE Dashboard_Bar SHALL disable or hide the delete control for that Dashboard so that at least one Dashboard always exists.

### Requirement 4: Dashboard Renaming

**User Story:** As a user, I want to rename dashboards, so that I can label them meaningfully.

#### Acceptance Criteria

1. WHEN the user double-clicks a dashboard label in the Dashboard_Bar, THE Dashboard_Bar SHALL replace the label with an inline text input pre-filled with the current name.
2. WHEN the user confirms the rename (Enter key or blur), THE Dashboard_Store SHALL update the Dashboard display name to the trimmed input value.
3. IF the user provides an empty or whitespace-only name, THEN THE Dashboard_Store SHALL retain the previous display name.
4. WHEN the user presses Escape during renaming, THE Dashboard_Bar SHALL cancel the rename and restore the previous display name.

### Requirement 5: Widget Instance Management

**User Story:** As a user, I want to add, remove, duplicate, and configure widget instances on a dashboard, so that I can compose dashboards with exactly the widgets I need.

#### Acceptance Criteria

1. WHEN the user opens the Widget_Picker and selects a Widget_Type, THE Dashboard_Store SHALL create a new Widget_Instance with a generated unique instance ID, the selected Widget_Type, a default grid position and size (as defined by the Widget_Type), and the Widget_Type's default Widget_Config, and append the Widget_Instance to the active Dashboard.
2. WHEN the user removes a Widget_Instance, THE Dashboard_Store SHALL remove that Widget_Instance from the active Dashboard's list.
3. WHEN the user duplicates a Widget_Instance, THE Dashboard_Store SHALL create a new Widget_Instance with a new unique instance ID, the same Widget_Type, the same Widget_Config as the source instance, and a grid position offset from the source instance so the duplicate does not overlap exactly.
4. THE Dashboard_Store SHALL allow multiple Widget_Instances of the same Widget_Type to coexist on a single Dashboard.
5. WHEN a Widget_Instance is added to a Dashboard, THE Widget_Grid SHALL render the new Widget_Instance in the grid at the assigned position.
6. WHEN a Widget_Instance is removed from a Dashboard, THE Widget_Grid SHALL remove the Widget_Instance from the grid and the remaining Widget_Instances SHALL retain their positions.

### Requirement 6: Widget Instance Configuration

**User Story:** As a user, I want to configure each widget instance independently, so that I can have multiple widgets of the same type showing different data.

#### Acceptance Criteria

1. WHEN the user opens the configuration panel for a Widget_Instance, THE Widget_Grid SHALL display a configuration UI appropriate to the Widget_Instance's Widget_Type.
2. WHEN the user modifies a Widget_Instance's Widget_Config, THE Dashboard_Store SHALL update the Widget_Config of that specific Widget_Instance only, without affecting other Widget_Instances (even those of the same Widget_Type).
3. THE Widget_Config for a Sidebar Widget_Type SHALL support filtering by tags (set of strings) and content type.
4. THE Widget_Config for a Timeline Widget_Type SHALL support specifying a date range (start date, end date).
5. THE Widget_Config for a Map Widget_Type SHALL support specifying a geographic bounding box or zoom level.
6. THE Widget_Config for a Content Widget_Type SHALL support specifying a pinned content item ID.
7. WHEN a Widget_Instance has a Widget_Config with filter criteria set, THE Widget_Instance SHALL display only content items matching the instance-level filter criteria, overriding the dashboard-level Content_Filter for that instance.
8. WHEN a Widget_Instance has an empty Widget_Config (no filter criteria), THE Widget_Instance SHALL fall back to the dashboard-level Content_Filter.

### Requirement 7: Per-Dashboard Widget Layout

**User Story:** As a user, I want each dashboard to have its own widget arrangement, so that I can customize layouts for different workflows.

#### Acceptance Criteria

1. WHEN the user rearranges or resizes a Widget_Instance via react-grid-layout, THE Dashboard_Store SHALL update the grid position and size of that Widget_Instance within the active Dashboard only.
2. WHEN the user resets the layout, THE Dashboard_Store SHALL reset the active Dashboard's Widget_Instances to the default set (one Sidebar, one Content, one Map, one Timeline) with default positions, sizes, and default Widget_Configs, removing any extra Widget_Instances, without affecting other Dashboards.
3. THE Widget_Grid SHALL use each Widget_Instance's unique instance ID as the react-grid-layout item key, so that multiple instances of the same Widget_Type are independently positionable.

### Requirement 8: Per-Dashboard Content Filters

**User Story:** As a user, I want each dashboard to have a baseline content filter, so that I can scope an entire dashboard to specific content while still allowing per-widget overrides.

#### Acceptance Criteria

1. THE dashboard-level Content_Filter SHALL support filtering by content type (markdown, image, video, audio), tags (set of strings), and source directory (string path).
2. WHEN the user modifies the dashboard-level filter criteria, THE Dashboard_Store SHALL update the Content_Filter of the active Dashboard only.
3. WHEN a dashboard-level Content_Filter is active and a Widget_Instance has no instance-level filter override, THE Widget_Instance SHALL display only content items matching the dashboard-level filter criteria.
4. WHEN a Dashboard has an empty dashboard-level Content_Filter and a Widget_Instance has no instance-level filter override, THE Widget_Instance SHALL display all content items.
5. WHEN a Widget_Instance has an instance-level filter in its Widget_Config, THE Widget_Instance SHALL use the instance-level filter instead of the dashboard-level Content_Filter.

### Requirement 9: Cross-Browser-Tab Synchronization

**User Story:** As a user, I want my dashboard definitions to stay in sync across all open browser tabs while each tab independently chooses which dashboard to display, so that I can use multiple monitors with different dashboards.

#### Acceptance Criteria

1. WHEN the shared Dashboard_Store state changes in one browser tab (dashboard created, deleted, renamed, or Widget_Instances added, removed, duplicated, repositioned, or reconfigured), THE Cross_Tab_Sync middleware SHALL broadcast the updated shared state to all other open browser tabs of the same Bürküt instance via the BroadcastChannel API.
2. WHEN a browser tab receives a Cross_Tab_Sync broadcast, THE Dashboard_Store SHALL merge the incoming shared state (dashboard list, widget instances, widget configs, content filters) while preserving the receiving browser tab's own local active dashboard ID. The receiving browser tab SHALL NOT change which Dashboard it is currently viewing.
3. WHEN a Dashboard is deleted via Cross_Tab_Sync and another browser tab is currently viewing that deleted Dashboard, THE receiving browser tab's Dashboard_Store SHALL switch the local active dashboard ID to the nearest remaining Dashboard (prefer the dashboard to the left, fall back to the right).
4. WHEN Widget_Instances are modified (added, removed, repositioned, or reconfigured) on a Dashboard that another browser tab is currently viewing, THE viewing browser tab SHALL reflect those changes in real-time without requiring a manual refresh or dashboard switch.
5. IF the BroadcastChannel API is unavailable (e.g. older browsers), THEN THE Dashboard_Store SHALL operate in single-browser-tab mode without errors.
6. THE Cross_Tab_Sync middleware SHALL use a unique channel name scoped to the Bürküt instance to avoid conflicts with other applications.

### Requirement 10: Layout Persistence

**User Story:** As a user, I want my dashboard configurations to survive browser restarts and each browser tab to remember which dashboard it was viewing, so that I do not lose my dashboard setup or my multi-monitor arrangement.

#### Acceptance Criteria

1. WHEN the shared Dashboard_Store state changes, THE Layout_Persistence subsystem SHALL serialize the full shared dashboard state (all Dashboards with their Widget_Instances including instance IDs, Widget_Types, positions, sizes, Widget_Configs, and dashboard-level Content_Filters) to a JSON file at `.burkut/layouts/dashboard.json`.
2. WHEN the application starts, THE Layout_Persistence subsystem SHALL read `.burkut/layouts/dashboard.json` and restore the shared Dashboard_Store state.
3. IF the persisted JSON file is missing or contains invalid data, THEN THE Layout_Persistence subsystem SHALL fall back to the default single-dashboard state without errors.
4. THE Layout_Persistence subsystem SHALL migrate existing localStorage-based layout data (from the current `useLayoutPersistence` hook) into the new `.burkut/layouts/dashboard.json` format on first run, then remove the legacy localStorage keys.
5. FOR ALL valid Dashboard_Store shared states, serializing to JSON then deserializing SHALL produce an equivalent shared state (round-trip property).
6. WHEN a browser tab sets its local active dashboard ID, THE Dashboard_Store SHALL persist the active dashboard ID to sessionStorage so that refreshing the browser tab restores the previously viewed Dashboard for that tab.
7. WHEN a browser tab starts and sessionStorage contains a previously active dashboard ID that still exists in the shared state, THE Dashboard_Store SHALL set the local active dashboard ID to that value. IF the stored ID no longer exists, THE Dashboard_Store SHALL fall back to the first Dashboard in the ordered list.

### Requirement 11: Dashboard Templates

**User Story:** As a user, I want to create dashboards from predefined templates, so that I can quickly set up common dashboard configurations.

#### Acceptance Criteria

1. THE Template_Registry SHALL include at least the following templates: "Daily" (one Sidebar instance + one Content instance + one Timeline instance with default Widget_Configs), "Monthly" (one Timeline instance + one Map instance), "Travel" (one Map instance + one Content instance + one Sidebar instance with tags Widget_Config pre-set to "travel"), and "Overview" (one instance of each Widget_Type with default Widget_Configs).
2. WHEN the user opens the "add dashboard" menu, THE Dashboard_Bar SHALL display a list of available Dashboard_Templates from the Template_Registry alongside a "Blank" option.
3. WHEN the user selects a Dashboard_Template, THE Dashboard_Store SHALL create a new Dashboard initialized with that template's pre-configured Widget_Instances (including their Widget_Types, positions, sizes, and Widget_Configs) and the template's dashboard-level Content_Filter.
4. WHEN the user selects the "Blank" option, THE Dashboard_Store SHALL create a new Dashboard with no Widget_Instances, allowing the user to add widgets via the Widget_Picker.
5. THE Template_Registry SHALL be extensible so that new templates can be added without modifying existing template definitions.

### Requirement 12: Dashboard Bar UI

**User Story:** As a user, I want a dashboard bar in the app header, so that I can see and switch between my dashboards easily.

#### Acceptance Criteria

1. THE Dashboard_Bar SHALL render inside the app header, between the app logo/title and the header action buttons (theme toggle, layout reset, etc.).
2. THE Dashboard_Bar SHALL display one button per Dashboard, showing the Dashboard display name, with the active Dashboard visually distinguished.
3. WHEN the user clicks a dashboard button, THE Dashboard_Store SHALL set that Dashboard as active.
4. THE Dashboard_Bar SHALL include an "add dashboard" button after the last dashboard button.
5. THE Dashboard_Bar SHALL provide a close icon on each dashboard button for deletion (hidden when only one Dashboard exists, per Requirement 3).
6. WHILE the number of dashboards exceeds the available header width, THE Dashboard_Bar SHALL provide horizontal scrolling or overflow handling so all dashboards remain accessible.
7. THE Dashboard_Bar SHALL follow the Bürküt design system: use semantic CSS tokens, co-located component CSS, and existing UI primitives from `src/components/ui/`.
8. THE Dashboard_Bar SHALL support keyboard navigation: arrow keys to move between dashboards, Enter to activate, Delete to close the focused dashboard.

### Requirement 13: Widget Picker UI

**User Story:** As a user, I want an "Add Widget" interface on the dashboard, so that I can browse available widget types and add new instances to my dashboard.

#### Acceptance Criteria

1. THE Dashboard_Bar or the Widget_Grid SHALL include an "Add Widget" button that opens the Widget_Picker.
2. WHEN the Widget_Picker is open, THE Widget_Picker SHALL display all available Widget_Types from the Widget_Type_Registry with their localized names and descriptions.
3. WHEN the user selects a Widget_Type from the Widget_Picker, THE Dashboard_Store SHALL create a new Widget_Instance of that type on the active Dashboard and close the Widget_Picker.
4. THE Widget_Picker SHALL follow the Bürküt design system: use semantic CSS tokens, co-located component CSS, and existing UI primitives from `src/components/ui/`.
5. THE Widget_Picker SHALL support keyboard navigation: arrow keys to move between Widget_Types, Enter to select.

### Requirement 14: Widget Type Registry

**User Story:** As a developer, I want a registry of widget types, so that the system knows which widgets are available and how to instantiate them.

#### Acceptance Criteria

1. THE Widget_Type_Registry SHALL define the following built-in Widget_Types: `sidebar`, `content`, `map`, `timeline`.
2. THE Widget_Type_Registry SHALL store for each Widget_Type: a unique type ID, a React component reference, a localized title key, a default grid size (width and height in grid units), a minimum grid size, and a default Widget_Config object.
3. THE Widget_Type_Registry SHALL be extensible so that new Widget_Types can be registered without modifying existing type definitions.
4. THE Widget_Grid SHALL use the Widget_Type_Registry to resolve the React component for each Widget_Instance based on its Widget_Type.

### Requirement 15: Internationalization

**User Story:** As a user, I want all dashboard-related UI text to be translated, so that the feature works in all supported languages.

#### Acceptance Criteria

1. THE Dashboard_Bar, Widget_Picker, and Widget_Instance configuration UI SHALL use `react-i18next` for all user-facing strings (dashboard default names, button labels, tooltips, template names, widget type names).
2. WHEN the user changes the application language, THE Dashboard_Bar, Widget_Picker, and Widget_Instance headers SHALL re-render all translatable strings in the selected language.
3. THE i18n locale files (tr, en, zh) SHALL include translation keys for all dashboard-related and widget-instance-related UI strings.

### Requirement 16: Post-Implementation Documentation

**User Story:** As a developer, I want the project documentation to reflect the new dashboard system, so that contributors can understand the current architecture.

#### Acceptance Criteria

1. WHEN the multi-dashboard feature is fully implemented, THE README.md SHALL be updated to describe the dashboard system, the Datadog-style widget instance model, and usage instructions.
2. WHEN the multi-dashboard feature is fully implemented, THE ROADMAP.md SHALL mark Phase 3 items as completed.
3. WHEN the multi-dashboard feature is fully implemented, THE project structure documentation (`.kiro/rules/structure.md`) SHALL be updated to include new files and components introduced by this feature (Dashboard_Bar, Widget_Picker, Widget_Type_Registry, Dashboard_Store).
