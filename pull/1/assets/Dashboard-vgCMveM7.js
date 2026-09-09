import{u as o,j as e,M as a,C as i}from"./iframe-CcV_ZEO1.js";import{D as r,P as d,U as c}from"./Dashboard.stories-g9rLAYNo.js";import"./preload-helper-C7rGsTiM.js";import"./XIcon-3cqt68PE.js";import"./chevron-right-DfvVcJNq.js";import"./createLucideIcon-_8lktVMt.js";import"./plus-BkJP1q09.js";function s(t){const n={code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...o(),...t.components};return e.jsxs(e.Fragment,{children:[e.jsx(a,{of:r}),`
`,e.jsx(n.h1,{id:"dashboard-infrastructure",children:"Dashboard infrastructure"}),`
`,e.jsxs(n.p,{children:["The Dashboard engine is an app-agnostic responsive grid: the library renders and protects widgets, while the host app owns widget definitions, data, translations, and persistence decisions. It includes ",e.jsx(n.code,{children:"DashboardGrid"}),", ",e.jsx(n.code,{children:"WidgetShell"}),", a widget registry, generated configuration controls, Standard Schema-compatible validation, persistence middleware, and optional BroadcastChannel synchronization."]}),`
`,e.jsx(i,{of:d}),`
`,e.jsx(n.h2,{id:"playground-guide",children:"Playground guide"}),`
`,e.jsxs(n.p,{children:["The ",e.jsx(n.strong,{children:"Controls"})," panel demonstrates the dashboard behaviors a host can configure:"]}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Draggable"})," enables the header drag handle and grid resizing. Moving or resizing a widget invokes ",e.jsx(n.code,{children:"onLayoutChange"}),"."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Show empty state"})," uses the host's ",e.jsx(n.code,{children:"isInstanceEmpty"})," and ",e.jsx(n.code,{children:"renderEmptyState"})," callbacks instead of widget content."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Show loading state"})," supplies the host's Suspense fallback for lazy widget content."]}),`
`]}),`
`,e.jsxs(n.p,{children:["The header exposes every instance action supported by ",e.jsx(n.code,{children:"DashboardGrid"}),": configure, duplicate, remove, and close. The generated ",e.jsx(n.strong,{children:"Label"})," field demonstrates ",e.jsx(n.code,{children:"onUpdateInstanceConfig"}),". All callbacks are visible in Storybook's ",e.jsx(n.strong,{children:"Actions"})," panel. The fixture persists emitted drag and resize positions locally, removes closed and removed widgets, and adds a positioned copy when duplicated solely to make each action's result visible; production hosts decide their own state transition."]}),`
`,e.jsx(i,{of:c}),`
`,e.jsxs(n.p,{children:["An instance whose ",e.jsx(n.code,{children:"widgetTypeId"})," is not registered is safely contained and rendered with ",e.jsx(n.code,{children:"getUnknownWidgetMessage"}),"; it does not crash the rest of the dashboard."]}),`
`,e.jsx(n.h2,{id:"usage",children:"Usage"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-tsx",children:`import {
  DashboardGrid,
  createWidgetRegistry,
  type WidgetTypeDefinition,
} from "@ay/ui-library";
import "@ay/ui-library/styles.css";
`})}),`
`,e.jsx(n.p,{children:"Each host app owns its widget definitions, render context, state shape, translations, and persistence adapter. The library owns generic grid mechanics, error isolation, configuration controls, and validation helpers. Pass all visible strings through labels or host callbacks—the engine deliberately does not call application i18n or theme hooks."}),`
`,e.jsx(n.h2,{id:"register-a-widget",children:"Register a widget"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-tsx",children:`const registry = createWidgetRegistry<MyRenderContext>();

registry.register({
  typeId: "activity",
  titleKey: "Activity",
  descriptionKey: "Recent activity",
  component: ActivityWidget,
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 2, h: 2 },
  defaultConfig: { limit: 10 },
  optionsSchema: [
    { key: "limit", kind: "number", label: "Items", default: 10, min: 1, max: 100 },
  ],
  buildProps: (context, config) => ({ items: context.items, limit: config.limit }),
});
`})}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"DashboardGrid"})," renders the registered component inside ",e.jsx(n.code,{children:"WidgetShell"}),". A throwing widget is isolated to its own shell; schema-backed fields get generated configuration controls automatically."]}),`
`,e.jsxs(n.h2,{id:"dashboardgrid-api",children:[e.jsx(n.code,{children:"DashboardGrid"})," API"]}),`
`,e.jsxs(n.p,{children:[`| Prop | Required | Host responsibility |
| --- | --- | --- |
| `,e.jsx(n.code,{children:"instances"})," | Yes | The ordered, controlled list of ",e.jsx(n.code,{children:"instanceId"}),", ",e.jsx(n.code,{children:"widgetTypeId"}),", grid ",e.jsx(n.code,{children:"position"}),", and opaque ",e.jsx(n.code,{children:"config"}),`. |
| `,e.jsx(n.code,{children:"resolveType"}),` | Yes | Resolve a widget type from the host registry. An unresolved type uses the unknown-widget fallback. |
| `,e.jsx(n.code,{children:"renderContext"})," | Yes | Supply app data and dependencies consumed by each definition's ",e.jsx(n.code,{children:"buildProps"}),`. |
| `,e.jsx(n.code,{children:"draggable"})," | No | Defaults to ",e.jsx(n.code,{children:"true"}),`; controls drag and resize interaction. |
| `,e.jsx(n.code,{children:"onLayoutChange"})," | No | Persist the layout emitted by ",e.jsx(n.code,{children:"react-grid-layout"}),`; it receives the current layout and all responsive layouts. |
| `,e.jsx(n.code,{children:"shellLabels"})," | No | Localized accessible labels and error text for every ",e.jsx(n.code,{children:"WidgetShell"}),` action. |
| `,e.jsx(n.code,{children:"getWidgetTitle"}),` | No | Localize or override the title for a specific instance. |
| `,e.jsx(n.code,{children:"getUnknownWidgetMessage"}),` | No | Render a recoverable message for stale or unavailable widget types. |
| `,e.jsx(n.code,{children:"onConfigClick"}),` | No | Observe a configuration action. Provide this alone for a host-owned config UI. |
| `,e.jsx(n.code,{children:"onDuplicate"}),", ",e.jsx(n.code,{children:"onRemove"}),", ",e.jsx(n.code,{children:"onClose"})," | No | Apply the host's state transition for the selected instance. The engine never mutates ",e.jsx(n.code,{children:"instances"}),`. |
| `,e.jsx(n.code,{children:"onUpdateInstanceConfig"})," + ",e.jsx(n.code,{children:"getConfigPanelLabels"}),` | Together | Enable the built-in schema-generated configuration panel. Merge the partial config into host state. |
| `,e.jsx(n.code,{children:"isInstanceEmpty"})," + ",e.jsx(n.code,{children:"renderEmptyState"}),` | Together | Replace content with a host-defined empty state when data is absent. |
| `,e.jsx(n.code,{children:"getLoadingState"})," | No | Supply the Suspense fallback for a lazy widget. |"]}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"onConfigClick"})," is called whether the built-in panel is enabled or not. The built-in panel appears only when the type has an ",e.jsx(n.code,{children:"optionsSchema"})," and both ",e.jsx(n.code,{children:"onUpdateInstanceConfig"})," and ",e.jsx(n.code,{children:"getConfigPanelLabels"})," are supplied."]}),`
`,e.jsx(n.h2,{id:"widget-definition-contract",children:"Widget definition contract"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"WidgetTypeDefinition"})," is the host-to-engine boundary. Register each unique ",e.jsx(n.code,{children:"typeId"})," once. ",e.jsx(n.code,{children:"defaultSize"})," and ",e.jsx(n.code,{children:"minSize"})," describe grid constraints; ",e.jsx(n.code,{children:"defaultConfig"})," is host-owned initial state; ",e.jsx(n.code,{children:"buildProps(context, config)"})," must translate opaque host context and config into the widget's component props. Keep widget components prop-driven and free of host state, translation, and theme hooks so the definition remains portable and testable."]}),`
`,e.jsx(n.h3,{id:"action-and-configuration-example",children:"Action and configuration example"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-tsx",children:`<DashboardGrid
  instances={instances}
  resolveType={registry.get}
  renderContext={dashboardContext}
  shellLabels={labels.dashboard}
  onLayoutChange={(layout) => saveLayout(layout)}
  onDuplicate={(instance) => setInstances((current) => duplicate(current, instance))}
  onRemove={(instance) => setInstances((current) => remove(current, instance.instanceId))}
  onUpdateInstanceConfig={(instance, partial) =>
    setInstances((current) => updateConfig(current, instance.instanceId, partial))
  }
  getConfigPanelLabels={() => ({ title: labels.options, closeAriaLabel: labels.close })}
/>
`})}),`
`,e.jsx(n.h2,{id:"persistence",children:"Persistence"}),`
`,e.jsxs(n.p,{children:["Use ",e.jsx(n.code,{children:"createPersistenceMiddleware"})," with a host-owned ",e.jsx(n.code,{children:"PersistenceAdapter"}),". The adapter decides where data is stored; the library provides debounced saves, retry behavior, hydration, migrations, and optional cross-tab synchronization. Build migrations with ",e.jsx(n.code,{children:"createMigrationRunner"}),", and add ",e.jsx(n.code,{children:"createBroadcastMiddleware"})," only when cross-tab updates are desired. Test migrations and persistence separately from visual stories because both are state-transport concerns rather than rendering behavior."]})]})}function y(t={}){const{wrapper:n}={...o(),...t.components};return n?e.jsx(n,{...t,children:e.jsx(s,{...t})}):s(t)}export{y as default};
