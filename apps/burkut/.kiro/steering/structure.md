# Project Structure

Bürküt lives at `apps/burkut/` in the `ay-stack` workspace. The tree below is
relative to that directory.

```
apps/burkut/
├── src/
│   ├── App.tsx                  # Root component — global state, panel layout
│   ├── main.tsx                 # Entry point; stylesheet import order lives here
│   ├── config.ts                # Centralized config: feature flags, locales
│   ├── components/
│   │   ├── ContentPanel/        # Renders markdown content for selected item
│   │   ├── DashboardBar/        # Tab strip for dashboard switching, creation, renaming, deletion
│   │   ├── MapPanel/            # Leaflet map with markers + polygons
│   │   ├── Sidebar/             # Group/item navigation list
│   │   ├── TimelinePanel/       # vis-timeline integration
│   │   ├── WidgetGrid/          # react-grid-layout responsive grid container (instance-based)
│   │   │   ├── widgetTypeRegistry.ts  # Widget type definitions and registration
│   │   │   └── configPanels/    # Per-widget-type configuration panels
│   │   ├── WidgetHeader/        # Drag handle header with config/duplicate/remove actions
│   │   ├── WidgetPicker/        # Menu for adding widget instances to a dashboard
│   │   ├── WidgetVisibilityMenu/ # (Legacy) Dropdown to toggle widget visibility
│   │   ├── ThemeToggle/         # Dark/light theme switch
│   │   ├── ProgressPie/         # SVG donut chart for reading progress
│   │   ├── NewContentModal/     # Modal for newly detected content
│   │   └── ui/                  # Design system primitives (Button, etc.)
│   │       ├── Button/          # Polymorphic button component
│   │       ├── GUIDELINES.md    # Design system conventions
│   │       └── index.ts         # Barrel export
│   ├── hooks/
│   │   ├── useContentGraph.ts   # Consumes virtual:burkut-content, provides ContentGraph + legacy adapter
│   │   ├── useLayoutPersistence.ts # (Legacy) Widget grid layout + visibility state (localStorage)
│   │   ├── useProgress.ts       # Reading progress tracker (localStorage)
│   │   ├── useResizeObserver.ts # Debounced ResizeObserver for panel redraws
│   │   └── useTheme.tsx         # Theme context provider
│   ├── i18n/
│   │   ├── index.ts             # i18next initialization
│   │   └── locales/             # Translation JSON files (tr, en, zh)
│   ├── shared/
│   │   └── types.ts             # Shared types (ContentGraph, ContentNode, Dashboard, WidgetInstance, …)
│   ├── stores/
│   │   ├── dashboardStore.ts    # Zustand store for dashboard state management
│   │   ├── broadcastMiddleware.ts # BroadcastChannel middleware for cross-tab sync
│   │   ├── persistenceMiddleware.ts # File-based persistence middleware + legacy migration
│   │   └── templateRegistry.ts  # Dashboard template definitions and registration
│   ├── utils/
│   │   └── contentFilter.ts     # Content filter resolution and application
│   ├── cli/
│   │   ├── bin/
│   │   │   └── burkut.ts        # CLI entry point (parsed by cac)
│   │   ├── paths.ts             # Package-root vs. caller-cwd path resolution + validation
│   │   ├── scanner.ts           # Recursive directory scanner
│   │   ├── dateExtractor.ts     # Date extraction (frontmatter → filename → folder)
│   │   ├── contentTypeRegistry.ts # Extension → ContentType mapping
│   │   ├── contentGraph.ts      # ContentGraph builder, ID/title utils, legacy adapter
│   │   └── devServer.ts         # Vite dev server launcher for CLI mode
│   ├── content/                 # Sample content shipped with the repo
│   ├── styles/
│   │   ├── tailwind.css         # @import "tailwindcss" then "@ay/ui-library/theme.css"
│   │   ├── app-tokens.css       # Legacy aliases + app-specific tokens + base element rules
│   │   └── layout.css           # App shell and panel layout styles
│   ├── types/                   # TypeScript declarations
│   └── tests/
│       ├── setup.ts             # Vitest setup (jsdom, testing-library matchers)
│       └── *.property.test.ts   # App-level static checks (tier ownership, alias hygiene)
├── vite-plugins/
│   ├── burkut-content.ts        # Serves ContentGraph as virtual:burkut-content, /content-assets/, /api/layouts
│   └── testHarness.ts           # Test-only connect/ViteDevServer stand-in for the plugin's middlewares
├── prompts/                     # AI prompt templates for feature development
├── .burkut/
│   └── layouts/                 # Repo-local dashboard persistence for `pnpm dev`
├── index.html
├── vite.config.ts               # Vite + Tailwind + ayResolve() + Vitest config
├── tsconfig.json                # TypeScript config (strict)
├── biome.json                   # extends ../../biome.json
├── package.json                 # private: true, but keeps bin/files for the future extraction
└── README.md                    # App-level documentation (CLI usage, content conventions)
```

There is **no `src/styles/global.css`**. See `tech.md` for the three-way split that
replaced it.

Workspace-level files that affect Bürküt:

| Path | Role |
|------|------|
| `pnpm-workspace.yaml` | workspace globs plus the `catalog:` versions this app references |
| `biome.json` (root) | the shared lint/format configuration this app extends |
| `packages/vite-config/src/index.ts` | `ayResolve()` — the Local Dev Alias and the React dedupe |
| `.github/workflows/deploy-pages.yml` | the single workflow that builds and publishes the app |
| `packages/ui-library/TOKEN-ARCHITECTURE.md` | the authoritative token tier document |

## Conventions

- Each component lives in its own folder: `src/components/{Name}/{Name}.tsx` with
  co-located `.css` and `.test.tsx` files.
- Hooks live in `src/hooks/` with co-located `.test.ts` files.
- All UI strings go through `react-i18next` — never hardcode user-facing text.
- CSS consumes custom properties: semantic tokens from `@ay/ui-library`, app tokens and
  legacy aliases from `src/styles/app-tokens.css`. No CSS-in-JS.
- Never declare a core or semantic token in this app; add it to `@ay/ui-library`
  instead. A test enforces this.
- `react-leaflet` doesn't render in jsdom — MapPanel tests use mocks.
- vis-timeline requires explicit `destroy()` on unmount to prevent memory leaks.
- UI primitives live in `src/components/ui/` — use these for all new interactive
  elements instead of creating ad-hoc styled elements. Import from the barrel:
  `import { Button } from "../ui";`
- Components shared beyond Bürküt belong in `@ay/ui-library`, not here. Bürküt may
  import from `@ay/ui-library`; the reverse is never allowed.
- See `src/components/ui/GUIDELINES.md` for the full design system conventions.
