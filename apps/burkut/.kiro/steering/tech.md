# Tech Stack & Build

Bürküt is the workspace package at `apps/burkut/` in the `ay-stack` pnpm monorepo.
Paths below are relative to `apps/burkut/`; commands run from the workspace root.

## Core Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript (strict mode) |
| Framework | React 18 |
| Bundler | Vite 5 |
| Utility CSS | Tailwind CSS v4 via `@tailwindcss/vite` |
| Design tokens | `@ay/tokens` (`workspace:^`) |
| Shared components | `@ay/ui-library` (`workspace:^`) |
| Visualization | D3 (`d3`), used by library blocks and app widgets |
| Timeline | vis-timeline / vis-data |
| Map | react-leaflet + Leaflet |
| Markdown | react-markdown + remark-gfm |
| i18n | react-i18next |
| Icons | lucide-react |
| Layout | react-grid-layout v2 |
| State | Zustand (with BroadcastChannel cross-tab middleware) |
| Styling | Plain CSS with custom properties (no CSS-in-JS) + Tailwind utilities |
| Linting/Formatting | Biome |
| Testing | Vitest + @testing-library/react + jsdom + fast-check |

Shared tool versions come from the `catalog:` block in `pnpm-workspace.yaml`, so
this manifest writes `"vitest": "catalog:"` rather than a range.

## Commands

```bash
pnpm --filter burkut dev          # dev server (Vite)
pnpm --filter burkut build        # production build
pnpm --filter burkut preview      # preview production build
pnpm --filter burkut test         # all tests (vitest run, single pass)
pnpm --filter burkut test:watch   # Vitest in watch mode
pnpm --filter burkut test:ui      # Vitest UI
pnpm --filter burkut coverage     # coverage report (v8)
pnpm --filter burkut typecheck    # tsc --noEmit
pnpm --filter burkut lint         # biome check src
pnpm --filter burkut lint:fix     # biome check --fix src
pnpm --filter burkut format       # biome format --write src
pnpm --filter burkut serve        # CLI entry: tsx src/cli/bin/burkut.ts serve
```

`pnpm dev` at the workspace root is a shortcut for the Bürküt dev server. Inside
`apps/burkut/` the same scripts run as plain `pnpm dev`, `pnpm test`, and so on.

Bürküt resolves `@ay/*` from those packages' build output unless the Local Dev
Alias is active, so build the workspace dependencies when their `dist/` is cold:

```bash
pnpm --filter "burkut..." build   # tokens → ui-library → burkut, in that order
AY_LOCAL=1 pnpm dev               # or skip dist/ entirely and use package source
BURKUT_CONTENT_DIR=./src/content pnpm --filter burkut dev   # repo-local content
```

## Quality Gates (must all pass before merge)

```bash
pnpm --filter burkut typecheck   # zero type errors
pnpm --filter burkut lint        # zero diagnostics
pnpm --filter burkut test        # all tests pass
pnpm --filter burkut build       # production build succeeds
```

`pnpm verify` at the workspace root runs all four for every package, cheapest gate
first, and names the failing package.

## Biome Configuration

`apps/burkut/biome.json` extends the workspace configuration at the root, so lint
results are identical across packages:

- Indent: 2 spaces
- Line width: 100
- Quotes: double
- Semicolons: always
- Import organization: auto via `assist.actions.source.organizeImports`
- Key lint rules enforced: `useButtonType`, `useAriaPropsSupportedByRole`,
  `noSvgWithoutTitle`, `noNonNullAssertion`, `noImplicitAnyLet`

## TypeScript

- Target: ES2020, strict mode enabled
- JSX: react-jsx
- Module resolution: bundler
- `allowImportingTsExtensions` is enabled

## Stylesheets

`global.css` is gone. Its contents were split three ways: the core and semantic
tiers moved to `@ay/tokens`, and what remained stayed in the app.

| File | Contents |
|------|----------|
| `src/styles/tailwind.css` | `@import "tailwindcss";` then `@import "@ay/tokens/theme.css";` — Tailwind first so the token block extends the default theme |
| `src/styles/app-tokens.css` | Bürküt's own tier: legacy aliases resolved to semantic tokens, the `--tl-bg-*` timeline layers, the `--vis-*` overrides, `--font-serif`, and the base element rules |
| `src/styles/layout.css` | app shell and panel layout |

`src/main.tsx` imports them in that order, and the order is load-bearing: token
declarations must exist before the aliases that resolve through them, and the
aliases before the layout that consumes them.

## Design System

Token tiers, naming patterns, and tier ownership rules:
#[[file:packages/tokens/TOKEN-ARCHITECTURE.md]]

Bürküt declares **no core or semantic token** — both tiers belong to `@ay/tokens`.
Application-specific values and legacy aliases live in `src/styles/app-tokens.css`;
component tokens live in each component's own `.css` file. A test in
`src/tests/` fails the build if a core or semantic token reappears in the app.

UI primitives live in `src/components/ui/` with co-located `.tsx`, `.css`, and
`.test.tsx` files. A barrel `index.ts` re-exports all primitives. When building new
interactive elements, always use existing UI primitives instead of creating ad-hoc
styled elements.

Full conventions, component APIs, and patterns:
[`src/components/ui/GUIDELINES.md`](../../src/components/ui/GUIDELINES.md).

## CLI Dependencies

| Package | Type | Purpose |
|---------|------|---------|
| `cac` | production | Lightweight CLI argument parsing (~3KB) |
| `gray-matter` | production | YAML frontmatter parsing (production, not dev, because the CLI needs it at runtime) |
| `tsx` | development | Runs the TypeScript CLI entry directly for `pnpm serve` |

## Path Resolution

`src/cli/paths.ts` owns the split Requirement 13 draws, and both the CLI entry and
the dev server delegate to it:

- `resolveProjectRoot()` — the `apps/burkut/` package directory, derived from the
  module's own location, so it is independent of the caller's working directory
- `resolveTargetDir(cwd, argument)` — the user's content directory, resolved
  against the caller's working directory
- `validateTargetDir(dir)` — returns an error message naming the absolute path, or
  `null`

`vite.config.ts` sets `root: import.meta.dirname` and pins the dev `/api/layouts`
handler to `join(import.meta.dirname, ".burkut", "layouts")`, so running from the
workspace root cannot drift to the wrong directory.

## Custom Vite Plugins

`vite-plugins/burkut-content.ts` scans a content directory, builds a
`ContentGraph`, serves it as `virtual:burkut-content`, serves media through a
`/content-assets/` middleware with a traversal boundary check, exposes
`/api/layouts`, and watches for changes to trigger HMR. It is registered twice over
Bürküt's lifetime — inline by `src/cli/devServer.ts` in CLI mode, and from
`vite.config.ts` for repo-local runs. Config-file plugins are ordered ahead of
inline ones, so the config-file instance stands down whenever the CLI registers its
own.

## CI/CD

- One workflow for the whole workspace: `.github/workflows/deploy-pages.yml`
- Installs with pnpm at the workspace root and caches the pnpm store
- Builds with `GITHUB_PAGES` set, which switches the Vite `base` to
  `/ay-stack/burkut/`, matching `homepage`
- The build output is assembled under `/burkut/` on the shared Pages site while
  Storybook occupies the root: https://pemre.github.io/ay-stack/burkut/
