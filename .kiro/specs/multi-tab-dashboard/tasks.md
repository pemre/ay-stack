# Implementation Plan: Multi-Tab Dashboard System

## Overview

Transform Bürküt from a single fixed-widget layout into a Datadog-style multi-dashboard system. Implementation proceeds bottom-up: core types → store → middlewares → UI components → integration → documentation. Each task builds on the previous, and property tests are placed close to the code they validate.

## Tasks

- [x] 1. Define core data types and content filter utility
  - [x] 1.1 Add dashboard-related types to `src/shared/types.ts`
    - Add `GridPosition`, `ContentFilter`, `WidgetConfig` (discriminated union: `SidebarWidgetConfig`, `ContentWidgetConfig`, `MapWidgetConfig`, `TimelineWidgetConfig`), `WidgetInstance`, `Dashboard`, `PersistedDashboardState`, and `WidgetInstanceProps` interfaces
    - _Requirements: 1.1, 5.4, 6.3, 6.4, 6.5, 6.6, 7.3, 10.5_

  - [x] 1.2 Create `src/utils/contentFilter.ts`
    - Implement `resolveFilter(dashboardFilter, instanceConfig)` — returns instance-level filter if non-empty, else dashboard-level filter
    - Implement `applyFilter(index, filter)` — filters `ContentIndex` entries by contentType, tags, sourceDirectory
    - _Requirements: 6.7, 6.8, 8.1, 8.3, 8.4, 8.5_

  - [ ]* 1.3 Write property tests for content filter (`src/utils/contentFilter.property.test.ts`)
    - **Property 15: Instance-level filter overrides dashboard-level filter**
    - **Property 16: Empty instance config falls back to dashboard-level filter**
    - **Validates: Requirements 6.7, 6.8, 8.3, 8.4, 8.5**

- [x] 2. Create Widget Type Registry
  - [x] 2.1 Create `src/components/WidgetGrid/widgetTypeRegistry.ts`
    - Define `WidgetTypeDefinition` interface with `typeId`, `titleKey`, `descriptionKey`, `component`, `defaultSize`, `minSize`, `defaultConfig`
    - Register built-in types: `sidebar`, `content`, `map`, `timeline` with lazy component references
    - Export `registerWidgetType()`, `getWidgetType()`, `getAllWidgetTypes()`
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ]* 2.2 Write property test for Widget Type Registry (`src/components/WidgetGrid/widgetTypeRegistry.test.ts`)
    - **Property 25: Widget_Type_Registry entries have all required fields**
    - **Validates: Requirements 14.2**

- [x] 3. Create Dashboard Store with core actions
  - [x] 3.1 Install Zustand: add `zustand` to dependencies
    - Run `npm install zustand` or add to package.json and install
    - _Requirements: 1.5_

  - [x] 3.2 Create `src/stores/dashboardStore.ts`
    - Implement Zustand store with `SharedState` (`dashboards: Dashboard[]`) and `LocalState` (`activeDashboardId: string`)
    - Implement actions: `createDashboard`, `deleteDashboard`, `renameDashboard`, `setActiveDashboard`, `reorderDashboards`
    - Implement widget actions: `addWidgetInstance`, `removeWidgetInstance`, `duplicateWidgetInstance`, `updateWidgetConfig`, `updateWidgetLayout`
    - Implement filter/layout actions: `updateDashboardFilter`, `resetDashboardLayout`, `onLayoutChange`
    - Implement `_mergeSharedState` for cross-tab sync ingestion
    - Initialize with default dashboard (sidebar + content + map + timeline) when no persisted state
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 3.1, 3.2, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 6.2, 7.1, 7.2, 8.2_

  - [ ]* 3.3 Write property tests for Dashboard Store (`src/stores/dashboardStore.property.test.ts`)
    - **Property 1: Shared/local state structure invariant**
    - **Property 2: Active dashboard ID excluded from shared state**
    - **Property 3: Active dashboard ID only changes via explicit activation**
    - **Property 4: Create dashboard appends with correct defaults**
    - **Property 5: Create dashboard activates the new dashboard**
    - **Property 7: Delete dashboard removes exactly one dashboard**
    - **Property 8: Deleting the active dashboard activates the nearest remaining**
    - **Property 9: Rename with valid input updates the display name**
    - **Property 10: Rename with whitespace-only input preserves the name**
    - **Property 11: Add widget instance creates correct instance and allows duplicates**
    - **Property 12: Remove widget instance removes only the target**
    - **Property 13: Duplicate widget instance creates a copy with new ID and offset position**
    - **Property 14: Update widget config only affects the target instance**
    - **Property 17: Dashboard-scoped mutations don't affect other dashboards**
    - **Property 18: Reset dashboard layout restores defaults without affecting other dashboards**
    - **Validates: Requirements 1.1, 1.2, 1.4, 2.1, 2.2, 3.1, 3.2, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 6.2, 7.1, 7.2, 8.2, 9.2, 9.3**

- [x] 4. Checkpoint — Core store and types
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create Template Registry
  - [x] 5.1 Create `src/stores/templateRegistry.ts`
    - Define `DashboardTemplate` interface with `templateId`, `nameKey`, `descriptionKey`, `instances`, `filter`
    - Register built-in templates: Daily, Monthly, Travel, Overview
    - Export `registerTemplate()`, `getTemplate()`, `getAllTemplates()`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 5.2 Wire template creation into Dashboard Store
    - Update `createDashboard(templateId?)` to look up template from `templateRegistry` and initialize dashboard from template config when provided
    - Handle "Blank" option (no widget instances)
    - _Requirements: 2.3, 11.3, 11.4_

  - [ ]* 5.3 Add property test for template-based creation to `src/stores/dashboardStore.property.test.ts`
    - **Property 6: Create dashboard from template matches template configuration**
    - **Validates: Requirements 2.3, 11.3**

- [x] 6. Create BroadcastChannel middleware
  - [x] 6.1 Create `src/stores/broadcastMiddleware.ts`
    - Implement Zustand middleware that extracts shared state slice (`dashboards` only) on state change
    - Broadcast via `BroadcastChannel('burkut-dashboard-sync')` with sender ID deduplication (`crypto.randomUUID()`)
    - On incoming message: call `_mergeSharedState`, never broadcast `activeDashboardId`
    - Graceful fallback: wrap `BroadcastChannel` construction in try-catch, no-op if unavailable
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 6.2 Write property test for broadcast middleware (`src/stores/broadcastMiddleware.property.test.ts`)
    - **Property 19: Cross-tab broadcast on shared state change**
    - **Validates: Requirements 9.1**

- [x] 7. Create persistence middleware and dev server endpoints
  - [x] 7.1 Add REST endpoints to `vite-plugins/burkut-content.ts`
    - `GET /api/layouts` — reads `.burkut/layouts/dashboard.json`, returns JSON (404 if missing)
    - `POST /api/layouts` — writes request body to `.burkut/layouts/dashboard.json`, creates `.burkut/layouts/` directory if needed
    - _Requirements: 10.1, 10.2_

  - [x] 7.2 Create `src/stores/persistenceMiddleware.ts`
    - Implement Zustand middleware: on store init fetch `GET /api/layouts` to hydrate shared state
    - On shared state change: debounce 500ms, `POST /api/layouts` with serialized `PersistedDashboardState`
    - Implement `migrateFromLocalStorage()`: detect legacy `burkut-widget-layouts` / `burkut-widget-visibility` keys, convert to single Dashboard, remove legacy keys
    - Implement sessionStorage persistence for `activeDashboardId` (read on init, write on change, fallback to first dashboard if stored ID missing)
    - Error handling: catch fetch errors with console.warn, fall back to defaults on invalid JSON, retry with backoff on write failures
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ]* 7.3 Write property tests for persistence middleware (`src/stores/persistenceMiddleware.property.test.ts`)
    - **Property 20: Persistence round-trip**
    - **Property 21: Legacy migration produces valid dashboard state**
    - **Property 22: sessionStorage round-trip for active dashboard ID**
    - **Validates: Requirements 10.4, 10.5, 10.6, 10.7**

- [x] 8. Wire middlewares into Dashboard Store
  - [x] 8.1 Compose `broadcastMiddleware` and `persistenceMiddleware` into the Zustand store creation in `dashboardStore.ts`
    - Ensure middleware ordering: persistence (outer) → broadcast (inner) → store
    - Verify store initializes correctly with hydration from persistence, then broadcast channel setup
    - _Requirements: 1.5, 9.1, 10.1, 10.2_

- [x] 9. Checkpoint — Store with middlewares
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Build Dashboard Bar component
  - [x] 10.1 Create `src/components/DashboardBar/DashboardBar.tsx` and `DashboardBar.css`
    - Render one button per dashboard from Dashboard_Store, active dashboard visually distinguished (`aria-current="true"`)
    - Click to activate dashboard via `setActiveDashboard`
    - Double-click to enter inline rename mode (text input pre-filled with current name)
    - Confirm rename on Enter/blur, cancel on Escape, reject empty/whitespace names
    - Close icon per dashboard button (hidden when only one dashboard remains)
    - "Add dashboard" button with template dropdown (lists templates from `templateRegistry` + "Blank" option)
    - Horizontal scroll overflow when dashboards exceed available width
    - Keyboard navigation: arrow keys between dashboards, Enter to activate, Delete to close
    - Use semantic CSS tokens and existing UI primitives from `src/components/ui/`
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 11.2, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

  - [ ]* 10.2 Write tests for Dashboard Bar (`src/components/DashboardBar/DashboardBar.test.tsx`)
    - **Property 23: Dashboard_Bar renders one button per dashboard**
    - Unit tests: click-to-activate, double-click rename flow, Escape cancel, empty name rejection, delete button hidden for last dashboard, keyboard navigation
    - **Validates: Requirements 12.2**

- [x] 11. Build Widget Picker component
  - [x] 11.1 Create `src/components/WidgetPicker/WidgetPicker.tsx` and `WidgetPicker.css`
    - Display all Widget_Types from `widgetTypeRegistry` with localized name and description
    - Click or Enter to add a new Widget_Instance to the active dashboard and close the picker
    - Keyboard navigation: arrow keys between types, Enter to select
    - Use semantic CSS tokens and existing UI primitives from `src/components/ui/`
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ]* 11.2 Write tests for Widget Picker (`src/components/WidgetPicker/WidgetPicker.test.tsx`)
    - **Property 24: Widget_Picker displays all registered widget types**
    - Unit tests: selection adds instance, keyboard navigation, picker closes on selection
    - **Validates: Requirements 13.2**

- [x] 12. Create Widget Instance configuration panels
  - [x] 12.1 Create config panel components for each widget type
    - `src/components/WidgetGrid/configPanels/SidebarConfigPanel.tsx` — tag multi-select, content type dropdown
    - `src/components/WidgetGrid/configPanels/TimelineConfigPanel.tsx` — date range pickers (start, end)
    - `src/components/WidgetGrid/configPanels/MapConfigPanel.tsx` — bounding box inputs or zoom level
    - `src/components/WidgetGrid/configPanels/ContentConfigPanel.tsx` — pinned item ID selector
    - Each panel receives `WidgetConfigPanelProps` (`instance`, `onUpdate`, `onClose`) and calls `updateWidgetConfig` on the store
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 6.6_

- [x] 13. Checkpoint — UI components
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Refactor WidgetGrid to instance-based rendering
  - [x] 14.1 Update `src/components/WidgetGrid/WidgetGrid.tsx`
    - Change props to accept `Dashboard` object instead of `layouts` + `visibilityState`
    - Key layout items by `WidgetInstance.instanceId` (not widget type)
    - Resolve component via `getWidgetType(instance.widgetTypeId)` from Widget_Type_Registry
    - Pass each widget its own `WidgetConfig` and resolved `ContentFilter` (via `resolveFilter`)
    - Render "Add Widget" button that opens Widget_Picker
    - Render config gear icon in WidgetHeader that opens the appropriate config panel
    - Handle unknown `widgetTypeId` with placeholder "Unknown Widget" component + remove button
    - _Requirements: 5.5, 5.6, 7.1, 7.3, 14.4_

  - [x] 14.2 Update `src/components/WidgetHeader/WidgetHeader.tsx`
    - Add config gear icon button that triggers config panel popover
    - Add duplicate button for widget instance duplication
    - Update close button to call `removeWidgetInstance` on the store
    - _Requirements: 5.2, 5.3, 6.1_

- [x] 15. Integrate Dashboard Store into App.tsx
  - [x] 15.1 Refactor `src/App.tsx`
    - Replace `useLayoutPersistence()` hook with Dashboard_Store consumption (`useDashboardStore`)
    - Render `DashboardBar` in the app header between logo/title and action buttons
    - Pass active dashboard to `WidgetGrid`
    - Remove `WidgetVisibilityMenu` (replaced by per-instance add/remove via Widget_Picker)
    - Update layout reset button to call `resetDashboardLayout` on the store
    - _Requirements: 1.3, 1.4, 1.6, 12.1_

- [x] 16. Checkpoint — Full integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Add i18n keys for dashboard feature
  - [x] 17.1 Add translation keys to all three locale files (`src/i18n/locales/tr.json`, `en.json`, `zh.json`)
    - Dashboard_Bar keys: dashboard default names, add/delete/rename labels, tooltips
    - Widget_Picker keys: widget type names, descriptions, add widget label
    - Template keys: template names and descriptions (Daily, Monthly, Travel, Overview)
    - Config panel keys: filter labels, date range labels, bounding box labels
    - _Requirements: 15.1, 15.2, 15.3_

  - [ ]* 17.2 Write i18n completeness test (`src/i18n/dashboardKeys.test.ts`)
    - **Property 26: i18n locale files contain all dashboard-related keys**
    - **Validates: Requirements 15.3**

- [x] 18. Checkpoint — Feature complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Post-implementation documentation
  - [x] 19.1 Update `README.md`
    - Describe the multi-dashboard system, Datadog-style widget instance model, and usage instructions
    - _Requirements: 16.1_

  - [x] 19.2 Update `ROADMAP.md`
    - Mark Phase 3 multi-dashboard items as completed
    - _Requirements: 16.2_

  - [x] 19.3 Update `.kiro/rules/structure.md`
    - Add new files and components: `src/stores/dashboardStore.ts`, `src/stores/broadcastMiddleware.ts`, `src/stores/persistenceMiddleware.ts`, `src/stores/templateRegistry.ts`, `src/components/DashboardBar/`, `src/components/WidgetPicker/`, `src/components/WidgetGrid/widgetTypeRegistry.ts`, `src/components/WidgetGrid/configPanels/`, `src/utils/contentFilter.ts`, `src/i18n/dashboardKeys.test.ts`
    - _Requirements: 16.3_

- [x] 20. Final checkpoint — All tests pass, documentation updated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Zustand must be installed before store tasks (task 3.1)
- The existing `widgetRegistry.ts` and `useLayoutPersistence.ts` are superseded but not deleted until integration is confirmed working (task 15)
