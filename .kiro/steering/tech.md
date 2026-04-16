# Tech Stack & Build

## Core Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript (strict mode) |
| Framework | React 18 |
| Bundler | Vite 5 |
| Timeline | vis-timeline / vis-data |
| Map | react-leaflet + Leaflet |
| Markdown | react-markdown + remark-gfm |
| i18n | react-i18next |
| Icons | lucide-react |
| Layout | react-grid-layout v2 |
| Styling | Plain CSS with custom properties (no CSS-in-JS) |
| Linting/Formatting | Biome |
| Testing | Vitest + @testing-library/react + jsdom |

## Commands

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Production build
npm run preview      # Preview production build
npm test             # Run all tests (vitest run, single pass)
npm run test:watch   # Vitest in watch mode
npm run test:ui      # Vitest UI
npm run coverage     # Coverage report (v8)
npm run typecheck    # tsc --noEmit
npm run lint         # biome check src
npm run lint:fix     # biome check --fix src
npm run format       # biome format --write src
```

## Quality Gates (must all pass before merge)

```bash
npx tsc --noEmit        # zero type errors
npx biome check src     # zero diagnostics
npm test                # all tests pass
npm run build           # production build succeeds
```

## Biome Configuration

- Indent: 2 spaces
- Line width: 100
- Quotes: double
- Semicolons: always
- Import organization: auto via `assist.actions.source.organizeImports`
- Key lint rules enforced: `useButtonType`, `useAriaPropsSupportedByRole`, `noSvgWithoutTitle`, `noNonNullAssertion`, `noImplicitAnyLet`

## TypeScript

- Target: ES2020, strict mode enabled
- JSX: react-jsx
- Module resolution: bundler
- `allowImportingTsExtensions` is enabled

## Design System

Bürküt uses a three-tier CSS custom property architecture for design tokens, following the W3C DTCG conceptual model:

| Tier | Naming Pattern | Location | Example |
|------|---------------|----------|---------|
| Core | `--{category}-{name}-{scale}` | `global.css :root` | `--color-amber-500`, `--space-2`, `--radius-md` |
| Semantic | `--{category}-{context}` | `global.css :root` + `[data-theme="dark"]` | `--color-primary`, `--color-border-default` |
| Component | `--{component}-{property}` | Component `.css` file | `--btn-height`, `--btn-border-radius` |

Components consume semantic tokens. Core tokens are never referenced directly by component CSS.

UI primitives live in `src/components/ui/` with co-located `.tsx`, `.css`, and `.test.tsx` files. A barrel `index.ts` re-exports all primitives. When building new interactive elements, always use existing UI primitives from `src/components/ui/` instead of creating ad-hoc styled elements.

Full conventions, component APIs, and patterns: [`src/components/ui/GUIDELINES.md`](../src/components/ui/GUIDELINES.md).

## CLI Dependencies

| Package | Type | Purpose |
|---------|------|---------|
| `cac` | production | Lightweight CLI argument parsing (~3KB) |
| `gray-matter` | production | YAML frontmatter parsing (moved from devDependencies to support CLI runtime) |

## Custom Vite Plugins

`vite-plugins/burkut-content.ts` is the CLI-mode Vite plugin. It scans an arbitrary user directory, builds a `ContentGraph`, and serves it as `virtual:burkut-content`. It also serves media files via a `/content-assets/` middleware and watches for file changes to trigger HMR updates.
