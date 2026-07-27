# Project Structure

`@ay/ui-library` is one package in the `ay-stack` workspace. Paths below are
relative to `packages/ui-library/`.

```
packages/ui-library/
├── src/
│   ├── index.ts                               # Barrel export — all blocks + public types
│   ├── blocks/
│   │   ├── ProgressPie/
│   │   │   ├── ProgressPie.tsx                  # Reusable SVG progress donut
│   │   │   ├── ProgressPie.css                  # ProgressPie component styles
│   │   │   └── ProgressPie.stories.tsx          # Storybook controls and variants
│   │   ├── SpiralTimeline/
│   │   │   ├── SpiralTimeline.tsx              # Main component
│   │   │   ├── SpiralTimeline.css              # Component tokens + block styles
│   │   │   ├── SpiralTimeline.test.tsx         # Vitest + RTL tests (unit + property-based)
│   │   │   ├── SpiralTimeline.stories.tsx      # Storybook stories with args/controls/play functions
│   │   │   ├── SpiralTimeline.mdx              # MDX documentation page for Storybook
│   │   │   ├── types.ts                        # Public TypeScript interfaces
│   │   │   ├── defaults.ts                     # DEFAULT_CONFIG constant
│   │   │   ├── geometry.ts                     # Pure spiral math functions
│   │   │   ├── geometry.test.ts                # Geometry property tests
│   │   │   ├── shapes.ts                       # SVG shape rendering utilities
│   │   │   ├── shapes.test.ts                  # Shape unit tests
│   │   │   ├── colors.ts                       # Color interpolation + fog utilities
│   │   │   ├── colors.test.ts                  # Color property tests
│   │   │   ├── TimeWindowSlider.tsx            # Time window slider sub-component
│   │   │   ├── ZoomControls.tsx                # Zoom controls sub-component
│   │   │   ├── stressData.ts                   # Synthetic data generator for stress testing
│   │   │   ├── stressData.test.ts              # Stress data generator property + unit tests
│   │   │   ├── FpsOverlay.tsx                  # FPS overlay for performance measurement
│   │   │   └── FpsOverlay.test.tsx             # FPS overlay unit tests
│   │   └── ImageZoom/
│   │       ├── ImageZoom.tsx                   # Main component (pure React, no D3)
│   │       ├── ImageZoom.css                   # Component tokens + block styles
│   │       ├── ImageZoom.test.tsx              # Vitest + RTL tests (unit + property-based)
│   │       ├── ImageZoom.stories.tsx           # Storybook stories with args/controls
│   │       ├── ImageZoom.mdx                   # MDX documentation page for Storybook
│   │       ├── types.ts                        # Public TypeScript interfaces
│   │       └── defaults.ts                     # DEFAULT_CONFIG constant
│   ├── icons/
│   │   ├── *Icon.tsx                            # Curated decorative icon wrappers
│   │   ├── Icons.stories.tsx                     # Curated icon gallery and usage example
│   │   ├── icons.test.tsx                       # Icon contract tests
│   │   └── index.ts                             # Public icon entry point
│   ├── tests/
│   │   ├── setup.ts                            # Vitest setup (jest-dom matchers)
│   │   ├── component-tier.property.test.ts     # Block CSS never reaches the core tier
│   │   └── token-import-form.property.test.ts  # Token imports use the package specifier
│   └── vite-env.d.ts
├── .storybook/
│   ├── main.ts                                # Discovers src/blocks/**/*.stories.tsx; base from STORYBOOK_BASE
│   ├── preview.ts                             # Loads .storybook/tailwind.css, viewports, theme globals
│   ├── tailwind.css                           # @import "tailwindcss" then "@ay/ui-library/theme.css"
│   └── preview-head.html                      # Body styling driven by semantic tokens
├── .kiro/
│   └── steering/                              # Kiro steering documents (this directory)
├── dist/                                      # Build output (git-ignored)
│   ├── index.es.js
│   ├── index.cjs.js
│   ├── index.d.ts
│   └── style.css
├── package.json                               # @ay/ui-library; catalog: versions; @ay/ui-library dependency
├── tsconfig.json
├── vite.config.ts                             # Vite library mode + Vitest config
├── biome.json                                 # extends ../../biome.json
├── README.md                                  # Package-level documentation
├── CHANGELOG.md
└── LICENSE                                    # MIT
```

There is **no `src/styles/` directory**. Core and semantic tokens moved out to
`@ay/ui-library` (`packages/ui-library/`), which is the only place either tier is declared.

Token tiers, naming patterns, and tier ownership rules:
#[[file:packages/ui-library/TOKEN-ARCHITECTURE.md]]

Workspace-level files that affect this package:

| Path | Role |
|------|------|
| `pnpm-workspace.yaml` | workspace globs plus the `catalog:` versions this package references |
| `biome.json` (root) | the shared lint/format configuration this package extends |
| `.github/workflows/deploy-pages.yml` | the single workflow that builds and publishes Storybook |
| `packages/ui-library/TOKEN-ARCHITECTURE.md` | the authoritative token tier document |

## Conventions

### File Co-location

Each Block lives in `src/blocks/{BlockName}/` with co-located files:

| File | Purpose |
|------|---------|
| `{BlockName}.tsx` | Main React component |
| `{BlockName}.css` | Component tokens and block styles |
| `{BlockName}.test.tsx` | Vitest + Testing Library tests (unit + property-based) |
| `{BlockName}.stories.tsx` | Storybook stories with args, controls, autodocs, play functions |
| `{BlockName}.mdx` | MDX documentation page for Storybook UI |
| `types.ts` | Public TypeScript interfaces and types |
| `defaults.ts` | Default configuration constants |

Utility modules (e.g., `geometry.ts`, `colors.ts`, `shapes.ts`) live alongside the
component with their own co-located `.test.ts` files.

### Barrel Export

`src/index.ts` re-exports all Block components and their public types. Every new
Block must be added here.

Icons are a deliberately separate public surface under `src/icons/`. Add a
wrapper only for a confirmed shared use case, export it from `src/icons/index.ts`,
and then re-export that barrel from `src/index.ts`. Consumers must not import
`lucide-react` directly.

```typescript
export { SpiralTimeline } from "./blocks/SpiralTimeline/SpiralTimeline.tsx";
export type { DataNode, SpiralTimelineConfig, TimeWindowConfig, /* ... */ } from "./blocks/SpiralTimeline/types.ts";

export { ImageZoom } from "./blocks/ImageZoom/ImageZoom.tsx";
export type { ImageZoomConfig, ImageZoomProps, ZoomLevel } from "./blocks/ImageZoom/types.ts";
```

### Naming Conventions

- Block directories: PascalCase (`SpiralTimeline`)
- Component files: PascalCase matching directory (`SpiralTimeline.tsx`)
- Utility files: camelCase (`geometry.ts`, `colors.ts`)
- Test files: match source file + `.test` suffix (`geometry.test.ts`)
- Story files: match component + `.stories` suffix (`SpiralTimeline.stories.tsx`)
- CSS files: match component (`SpiralTimeline.css`)
- CSS custom properties: `--{block-name}-{property}` (e.g., `--spiral-bg`)

### Sub-components

Sub-components (e.g., `TimeWindowSlider.tsx`, `ZoomControls.tsx`) live in the same
Block directory. They are not exported from the barrel — only the main component
and its types are public.
