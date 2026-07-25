# 🌜 ay-stack

A pnpm workspace hosting a shared dashboard/UI stack: design tokens, a React
component library, and the applications that consume them. The root publishes
nothing — it is private and exists to hold the packages together.

| Package | Name | Published | What it is |
|---------|------|-----------|------------|
| [`packages/tokens`](packages/tokens/README.md) | `@ay/tokens` | yes | Core + semantic CSS custom properties, plus a Tailwind v4 theme entry |
| [`packages/ui-library`](packages/ui-library/README.md) | `@ay/ui-library` | yes | React blocks — `SpiralTimeline`, `ImageZoom` |
| [`packages/vite-config`](packages/vite-config/README.md) | `@ay/vite-config` | no | Shared Vite resolution: the Local Dev Alias and the React singleton guarantee |
| [`apps/burkut`](apps/burkut/README.md) | `burkut` | no | CLI-driven content visualizer |

Live builds share one GitHub Pages site: Storybook at
https://pemre.github.io/ay-stack/ and Bürküt at
https://pemre.github.io/ay-stack/burkut/.

## Layout

```
ay-stack/
├── packages/
│   ├── tokens/        # @ay/tokens
│   ├── ui-library/    # @ay/ui-library
│   └── vite-config/   # @ay/vite-config (private)
├── apps/
│   └── burkut/        # burkut (private)
├── tools/tokens/      # Token baseline resolver + committed baseline.json
├── tests/             # Workspace-level static checks (lockfile, manifests, docs, workflows)
├── .github/workflows/ # One workflow: deploy-pages.yml
├── pnpm-workspace.yaml
├── biome.json         # The shared lint/format config; each package extends it
└── package.json       # private "ay-stack" root manifest
```

One lockfile (`pnpm-lock.yaml`), one `.git`, one Biome configuration, and one
workflow directory — all at the root.

## Getting started

```bash
pnpm install     # one install at the root resolves every package
pnpm verify      # typecheck → lint → test → build, across the workspace
```

pnpm is required: the workspace uses the `workspace:` protocol for internal
dependencies and a `catalog:` block for shared tool versions, and the root manifest
pins the pnpm version through `packageManager`.

## Commands

```bash
pnpm dev         # Bürküt dev server
pnpm storybook   # @ay/ui-library Storybook
pnpm build       # build every package, in topological order
pnpm test        # every package's suite plus the root tests/ checks
pnpm lint
pnpm typecheck
pnpm verify      # all four gates, cheapest first; names the failing package
```

Target one package with `--filter`. A filtered build does **not** build that
package's workspace dependencies, so ask for them explicitly when `dist/` is cold:

```bash
pnpm --filter burkut test
pnpm --filter "burkut..." build            # dependencies first, then the app
pnpm --filter "@ay/ui-library^..." build   # only the dependencies
```

## Package boundaries

Dependencies flow one way: `@ay/tokens` → `@ay/ui-library` → `burkut`.

- `@ay/tokens` depends on no workspace package, so it stays publishable alone.
- `@ay/ui-library` depends on `@ay/tokens` only. React, ReactDOM, D3, and Tailwind
  are peer dependencies, so consumers own those versions.
- `burkut` may depend on both packages. Nothing depends on `burkut` — it is a leaf,
  and it moves to its own repository in a later phase.
- Anything shared by two consumers belongs in a package: shared values in
  `@ay/tokens`, shared components in `@ay/ui-library`. Anything meaningful to one
  app stays in that app.

Token tiers, naming patterns, and tier ownership rules are stated in exactly one
document: [`packages/tokens/TOKEN-ARCHITECTURE.md`](packages/tokens/TOKEN-ARCHITECTURE.md).
Every other document links to it rather than restating it.

## Local Dev Alias — the cross-package workflow

To edit a package while running an app that consumes it, set `AY_LOCAL=1`:

```bash
AY_LOCAL=1 pnpm dev
```

Vite then resolves every `@ay/*` specifier to that package's `packages/*/src`
source, so edits under `packages/ui-library/src/` or `packages/tokens/src/` arrive
through HMR — no rebuild, no reinstall, no publish. Any other value, including
absence, resolves the packages' published entry points, which is the path
`pnpm build` and CI take. `resolve.dedupe` keeps a single React instance on both
paths.

This replaces package linking, which does not work under pnpm's isolated
`node_modules` layout: a symlinked package resolves `react` from its own directory
rather than the app's, producing a second React copy and the "invalid hook call"
error. The alias keeps package source inside the app's module graph, so imports
resolve from the app root.

The mechanism lives in
[`packages/vite-config/src/index.ts`](packages/vite-config/src/index.ts); adding a
package to the map is a one-line change to `AY_LOCAL_ENTRIES`.

## Publishing

`@ay/tokens` and `@ay/ui-library` publish independently under the `@ay` scope:

```bash
pnpm --filter @ay/tokens build
pnpm publish --filter @ay/tokens
```

Each package's `files` field limits the tarball to build output plus its documents,
and `workspace:^` ranges are rewritten to published versions at pack time. When a
library release depends on an unreleased token change, publish `@ay/tokens` first.

## CI

`.github/workflows/deploy-pages.yml` is the only workflow. It installs with pnpm at
the root, caches the pnpm store, builds Storybook and Bürküt in parallel jobs,
assembles them into a single Pages artifact (Storybook at the root, Bürküt under
`/burkut/`), and deploys. A repository has exactly one Pages site, so one workflow
owns it; either build failing short-circuits the deploy with no artifact published.

## Documentation

| Document | Contents |
|----------|----------|
| [`packages/tokens/TOKEN-ARCHITECTURE.md`](packages/tokens/TOKEN-ARCHITECTURE.md) | The token tiers, naming, and ownership rules |
| [`packages/tokens/README.md`](packages/tokens/README.md) | Installing and consuming `@ay/tokens` |
| [`packages/ui-library/README.md`](packages/ui-library/README.md) | Component APIs, theming, contributing |
| [`apps/burkut/README.md`](apps/burkut/README.md) | Bürküt CLI usage and content conventions |
| [`ROADMAP.md`](ROADMAP.md) | Phase plan and completed work |
| `.kiro/steering/` | Workspace steering: layout, boundaries, Local Dev Alias |

Per-package steering lives in `packages/ui-library/.kiro/steering/` and
`apps/burkut/.kiro/steering/`.
