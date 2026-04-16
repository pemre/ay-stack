# Project Structure

```
├── src/
│   ├── App.tsx                  # Root component — global state, panel layout
│   ├── main.tsx                 # Entry point
│   ├── config.ts                # Centralized config: feature flags, locales
│   ├── components/
│   │   ├── ContentPanel/        # Renders markdown content for selected item
│   │   ├── MapPanel/            # Leaflet map with markers + polygons
│   │   ├── Sidebar/             # Group/item navigation list
│   │   ├── TimelinePanel/       # vis-timeline integration
│   │   ├── WidgetGrid/          # react-grid-layout responsive grid container
│   │   ├── WidgetHeader/        # Drag handle header for each widget
│   │   ├── WidgetVisibilityMenu/ # Dropdown to toggle widget visibility
│   │   ├── ThemeToggle/         # Dark/light theme switch
│   │   ├── ProgressPie/         # SVG donut chart for reading progress
│   │   ├── NewContentModal/     # Modal for newly detected content
│   │   └── ui/                  # Design system primitives (Button, etc.)
│   │       ├── Button/          # Polymorphic button component
│   │       ├── GUIDELINES.md    # Design system conventions
│   │       └── index.ts         # Barrel export
│   ├── hooks/
│   │   ├── useContentGraph.ts   # Consumes virtual:burkut-content, provides ContentGraph + legacy adapter
│   │   ├── useLayoutPersistence.ts # Widget grid layout + visibility state (localStorage)
│   │   ├── useProgress.ts       # Reading progress tracker (localStorage)
│   │   ├── useResizeObserver.ts  # Debounced ResizeObserver for panel redraws
│   │   └── useTheme.tsx         # Theme context provider
│   ├── i18n/
│   │   ├── index.ts             # i18next initialization
│   │   └── locales/             # Translation JSON files (tr, en, zh)
│   ├── shared/
│   │   └── types.ts             # Shared types (ContentGraph, ContentNode, ContentEntry, ContentIndex, etc.)
│   ├── cli/
│   │   ├── bin/
│   │   │   └── burkut.ts        # CLI entry point (parsed by cac)
│   │   ├── scanner.ts           # Recursive directory scanner
│   │   ├── dateExtractor.ts     # Date extraction (frontmatter → filename → folder)
│   │   ├── contentTypeRegistry.ts # Extension → ContentType mapping
│   │   ├── contentGraph.ts      # ContentGraph builder, ID/title utils, legacy adapter
│   │   └── devServer.ts         # Vite dev server launcher for CLI mode
│   ├── styles/
│   │   ├── global.css           # CSS custom properties, theme variables
│   │   └── layout.css           # App shell and panel layout styles
│   ├── types/                   # TypeScript declarations
│   └── tests/
│       └── setup.ts             # Vitest setup (jsdom, testing-library matchers)
├── vite-plugins/
│   └── burkut-content.ts       # CLI-mode Vite plugin: serves ContentGraph as virtual:burkut-content
├── vite.config.ts               # Vite + Vitest config
├── tsconfig.json                # TypeScript config (strict)
├── biome.json                   # Linter + formatter config
└── prompts/                     # AI prompt templates for feature development
```

## Conventions

- Each component lives in its own folder: `src/components/{Name}/{Name}.tsx` with co-located `.css` and `.test.tsx` files.
- Hooks live in `src/hooks/` with co-located `.test.ts` files.
- All UI strings go through `react-i18next` — never hardcode user-facing text.
- CSS uses custom properties defined in `global.css` for theming. No CSS-in-JS.
- `react-leaflet` doesn't render in jsdom — MapPanel tests use mocks.
- vis-timeline requires explicit `destroy()` on unmount to prevent memory leaks.
- UI primitives live in `src/components/ui/` — use these for all new interactive elements instead of creating ad-hoc styled elements. Import from the barrel: `import { Button } from "../ui";`
- See `src/components/ui/GUIDELINES.md` for the full design system conventions.
