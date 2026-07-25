# Tech Stack & Build

This package is `@ay/ui-library`, a workspace package at `packages/ui-library/`
inside the `ay-stack` pnpm monorepo. Every command below runs through pnpm from
the workspace root; nothing here uses npm or yarn.

## Core Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Language | TypeScript (strict mode) | ^5.9 |
| Framework | React | ^18.0.0 |
| Visualization | D3 | ^7.0.0 |
| Design tokens | `@ay/tokens` (`workspace:^`) | 0.1.x |
| Utility CSS | Tailwind CSS v4 | ^4.2.1 |
| Bundler | Vite (library mode) | ^5.4 |
| Type declarations | vite-plugin-dts | ^4.5 |
| Component dev | Storybook (React-Vite) | ^8.6 |
| Test runner | Vitest | ^1.6 |
| Component testing | @testing-library/react | ^16.3 |
| Property-based testing | fast-check | ^4.6 |
| DOM environment | jsdom | ^28.1 |
| Linting/Formatting | Biome | ^2.4 |
| Styling | Plain CSS with custom properties (no CSS-in-JS); hybrid Tailwind utilities for select blocks (e.g., ImageZoom) |

React, ReactDOM, D3, and Tailwind CSS are **peer dependencies** — they are
externalized from the build output. `@ay/tokens` is a real dependency: the package
consumes its stylesheet rather than declaring tokens of its own.

Every shared tool version comes from the workspace catalog in
`pnpm-workspace.yaml`, so this package's manifest writes `"vitest": "catalog:"`
instead of a range. Bumping a shared tool is a one-line edit at the root.

## Commands

Run from the workspace root:

```bash
pnpm --filter @ay/ui-library dev              # Storybook dev server on port 6006
pnpm --filter @ay/ui-library build            # Vite library mode build → dist/
pnpm --filter @ay/ui-library test             # all tests (vitest run, single pass)
pnpm --filter @ay/ui-library test:watch       # Vitest in watch mode
pnpm --filter @ay/ui-library typecheck        # tsc --noEmit
pnpm --filter @ay/ui-library lint             # biome check src
pnpm --filter @ay/ui-library lint:fix         # biome check --fix src
pnpm --filter @ay/ui-library format           # biome format --write src
pnpm --filter @ay/ui-library storybook        # alias for dev
pnpm --filter @ay/ui-library build-storybook  # static Storybook site
```

`pnpm storybook` at the root is a shortcut for the Storybook dev server. Inside
`packages/ui-library/` the same scripts run as plain `pnpm dev`, `pnpm test`, and
so on.

Storybook's stylesheet imports `@ay/tokens/theme.css`, which resolves to that
package's `dist/`. A filtered command does not build workspace dependencies on its
own, so build them first when `dist/` is cold:

```bash
pnpm --filter "@ay/ui-library^..." build   # builds @ay/tokens
```

## Quality Gates (must all pass before merge)

```bash
pnpm --filter @ay/ui-library typecheck   # zero type errors
pnpm --filter @ay/ui-library lint        # zero diagnostics
pnpm --filter @ay/ui-library test        # all tests pass
pnpm --filter @ay/ui-library build       # production build succeeds
```

`pnpm verify` at the workspace root runs all four for every package, cheapest
gate first, and names the failing package.

## Build Pipeline

Vite library mode produces:

| Output | Description |
|--------|-------------|
| `dist/index.es.js` | ESM bundle |
| `dist/index.cjs.js` | CJS bundle |
| `dist/index.d.ts` | Rolled-up TypeScript declarations |
| `dist/style.css` | Extracted CSS (component styles) |

Entry point: `src/index.ts`. Externals: `react`, `react-dom`, `react/jsx-runtime`,
`d3`. `dist/style.css` carries component CSS only — design tokens ship separately
in `@ay/tokens`, so a consumer imports both.

## TypeScript Configuration

- Target: ES2020
- Module: ESNext, bundler resolution
- JSX: react-jsx
- Strict mode enabled
- Declaration + declarationMap generation
- `allowImportingTsExtensions` enabled
- `isolatedModules` enabled

## Biome Configuration

`packages/ui-library/biome.json` is a two-line file extending the workspace
configuration at the root, so lint results are identical in every package:

- Indent: 2 spaces
- Line width: 100
- Quotes: double
- Semicolons: always
- Import organization: auto via `assist.actions.source.organizeImports`
- Linter: recommended rules + `useExhaustiveDependencies` (warn)

## Design Tokens

Token tiers, naming patterns, and tier ownership rules:
#[[file:packages/tokens/TOKEN-ARCHITECTURE.md]]

This package declares **no core or semantic token**. Both tiers live in
`@ay/tokens`; block CSS consumes semantic tokens and declares its own component
tokens. Storybook loads them through `.storybook/tailwind.css`:

```css
@import "tailwindcss";
@import "@ay/tokens/theme.css";
```

Tailwind first, so the token block extends the default theme rather than being
overridden by it. Theme switching stays a `data-theme="dark"` attribute on a
parent element, resolved by the cascade.

## Testing Configuration

- Environment: jsdom
- Setup file: `src/tests/setup.ts` (imports `@testing-library/jest-dom/vitest`)
- CSS processing enabled in tests
- `passWithNoTests: true`
- Property tests use fast-check with minimum 100 iterations per property
- Property test tag format: `// Feature: {feature-name}, Property {N}: {title}`
- Workspace-level static checks (token tiers, import form, component-tier
  discipline) live in `src/tests/` and run as ordinary Vitest tests

## CI/CD

- One workflow for the whole workspace: `.github/workflows/deploy-pages.yml`
- Triggers on push to `main`
- Installs with pnpm at the workspace root and caches the pnpm store
- Builds Storybook with `STORYBOOK_BASE=/ay-stack/` and publishes it at the Pages
  site root: https://pemre.github.io/ay-stack/
- Bürküt builds in the same run and lands under `/burkut/`, so one deploy job
  publishes both artifacts instead of two workflows overwriting each other
- Uses `actions/upload-pages-artifact@v3` and `actions/deploy-pages@v4`
