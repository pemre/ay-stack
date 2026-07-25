# Product: 🌜 @ay/ui-library

## Purpose

`@ay/ui-library` is a standalone, publishable npm package containing reusable UI
components for React — D3-powered visualizations and interactive image/media
blocks. It is an independent design system that any React project can consume.

It lives at `packages/ui-library/` in the `ay-stack` workspace and publishes under
the `@ay` scope. It was previously published as the unscoped `ay-ui-library` up to
version 0.4.1; the rename to `@ay/ui-library` landed in 0.5.0 and the old name is
deprecated on npm.

## Relationship to the workspace

Bürküt (`apps/burkut/`) is the first consumer, but the coupling runs one way only:

- `@ay/ui-library` imports nothing from Bürküt
- All data, callbacks, and locale are passed via props
- Shared design tokens come from `@ay/tokens`, which both this package and Bürküt
  depend on — neither owns a private copy
- Data interfaces are shaped to fit Bürküt's content structures, but the library
  has no knowledge of Bürküt's internals

Bürküt lives in this monorepo temporarily and will move to its own repository.
Nothing in this package may assume otherwise.

## Block Component Model

A "Block" is an independent, self-contained UI component living in
`src/blocks/{BlockName}/`. Each Block:

- Is a React component accepting data and configuration via props
- May use D3 for SVG math/scales/data-joins (e.g., SpiralTimeline) or be pure
  React (e.g., ImageZoom) — D3 is not required for every block
- Consumes semantic tokens from `@ay/tokens` and declares its own component tokens
- May use Tailwind utility classes for layout alongside the token system (hybrid
  styling approach)
- Includes co-located tests, stories, and documentation
- Is exported from the package barrel (`src/index.ts`)

Token tiers, naming patterns, and tier ownership rules:
#[[file:packages/tokens/TOKEN-ARCHITECTURE.md]]

## npm Publishing Workflow

1. Update `version` in `package.json` following semver
2. Update `CHANGELOG.md` with notable changes
3. Run the quality gates: `pnpm --filter @ay/ui-library typecheck lint test build`
   (or `pnpm verify` at the root)
4. `pnpm publish --filter @ay/ui-library` — `files` limits the tarball to `dist/`
   plus `README.md`, `CHANGELOG.md`, and `LICENSE`, and
   `publishConfig.access: "public"` makes the scoped package public

`@ay/tokens` publishes independently. When a release depends on an unreleased
token change, publish `@ay/tokens` first — the `workspace:^` range is rewritten to
the published version at pack time.

## Local Development Against Package Source

There is no linking step. Bürküt's Vite config resolves `@ay/*` specifiers to
`packages/*/src` when `AY_LOCAL=1` is set:

```bash
AY_LOCAL=1 pnpm dev        # Bürküt against library source, with HMR
```

Edits under `packages/ui-library/src/` reach the running dev server immediately —
no rebuild, no reinstall. Without `AY_LOCAL`, Bürküt resolves the package's
published entry points from `dist/`, which is what CI and production builds use.

`npm link` and `yalc` are not used and do not work here: pnpm's isolated
`node_modules` layout plus a symlinked React would produce two React copies and
the "invalid hook call" error. The alias path is the supported workflow because it
keeps a single React instance via `resolve.dedupe`.

## Design Philosophy

- **Props-driven**: All behavior is controlled via props — no global state, no
  context providers
- **Sensible defaults**: Every config field has a default; rendering with just
  `data` produces a functional visualization
- **Theme-agnostic**: Components use CSS custom properties, not hardcoded colors.
  Consumers control theming
- **Type-safe**: Full TypeScript interfaces exported for all public APIs
- **Testable**: Pure utility functions extracted for independent testing;
  components tested with Testing Library + property-based tests via fast-check
- **Documented**: Storybook stories with interactive controls serve as living
  documentation
