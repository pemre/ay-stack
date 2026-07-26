# Workspace: ay-stack

A pnpm workspace hosting a shared dashboard/UI stack. The root publishes nothing —
it is `"private": true` and carries no `bin`, `files`, `main`, `module`, or `types`.

## Layout

```
ay-stack/
├── packages/
│   ├── tokens/        # @ay/ui-library      — published. Core + semantic CSS token tiers
│   ├── ui-library/    # @ay/ui-library  — published. React blocks (SpiralTimeline, ImageZoom)
│   └── vite-config/   # @ay/vite-config — private. Shared Vite resolution helpers
├── apps/
│   └── burkut/        # burkut          — private app, CLI-driven content visualizer
├── tools/tokens/      # Baseline resolver + committed pre-migration baseline.json
├── tests/             # Workspace-level static checks (lockfile, manifests, docs, workflows)
├── .github/workflows/ # One workflow: deploy-pages.yml (Storybook + Bürküt → one Pages site)
├── pnpm-workspace.yaml
├── biome.json         # The single shared lint/format configuration; packages extend it
└── package.json       # private "ay-stack" root manifest
```

There is exactly one lockfile (`pnpm-lock.yaml`), one `.git`, one `biome.json`
source of truth, and one `.github/workflows/` directory — all at the root.

## Package boundaries

Dependencies flow one way only:

```
@ay/ui-library  ←  @ay/ui-library  ←  burkut
     ↖───────────────────────────────┘
```

| Rule | Why |
|------|-----|
| `@ay/ui-library` depends on no workspace package | it is the root of the graph and must stay publishable on its own |
| `@ay/ui-library` depends on `@ay/ui-library` only | React, ReactDOM, D3, and Tailwind are **peer** dependencies so consumers own those versions |
| `burkut` may depend on both packages | an app is a leaf; nothing imports from it |
| No package imports from `apps/` | Bürküt moves to its own repository in a later phase, so any such import would break |
| `@ay/vite-config` is `private: true` | it exists only for this workspace's build configuration and never occupies a name in the public `@ay` scope |

Intra-workspace dependencies use the `workspace:` protocol; shared tool versions
come from the `catalog:` block in `pnpm-workspace.yaml`, so exactly one version of
Vitest, Biome, TypeScript, React, fast-check, and jsdom resolves workspace-wide.

Where something belongs:

- A value two consumers share → `@ay/ui-library`
- A component two consumers share → `@ay/ui-library`
- Anything meaningful to one app only → that app (component tokens, app tokens,
  app-specific layout)

## Commands

```bash
pnpm install                 # one install at the root; resolves workspace: and catalog:
pnpm verify                  # typecheck → lint → test → build, every package
pnpm build                   # pnpm -r build, in topological order
pnpm test                    # every package's suite plus the root tests/ checks
pnpm dev                     # Bürküt dev server
pnpm storybook               # @ay/ui-library Storybook
```

Target one package with `--filter`, and remember that a filtered build does not
build that package's workspace dependencies:

```bash
pnpm --filter burkut test
pnpm --filter "burkut..." build              # dependencies first, topologically
pnpm --filter "@ay/ui-library^..." build     # just the dependencies
```

`pnpm -r` stops at the first failing package and names it, which is what makes
`pnpm verify` a usable single gate.

## Design tokens

Token tiers, naming patterns, and tier ownership rules:
#[[file:packages/ui-library/TOKEN-ARCHITECTURE.md]]

That document is the only place the architecture is stated. Every other document
references it rather than restating it, so there is one owner to keep correct.

## Cross-package development

Use the Local Dev Alias (`AY_LOCAL=1`) rather than `npm link` or `yalc` — see the
Local Dev Alias steering document.
