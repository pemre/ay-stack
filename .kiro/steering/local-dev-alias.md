# Local Dev Alias — the supported cross-package workflow

To work on `@ay/tokens` or `@ay/ui-library` while running a consuming app, set
`AY_LOCAL=1`. There is nothing else to configure, and no linking step.

```bash
AY_LOCAL=1 pnpm dev          # Bürküt, resolving @ay/* to packages/*/src
```

Edits under `packages/ui-library/src/` or `packages/tokens/src/` reach the running
dev server through ordinary HMR — no rebuild, no reinstall, no `dist/`.

## How it works

`packages/vite-config/src/index.ts` exports the whole mechanism:

| Export | Role |
|--------|------|
| `AY_LOCAL_ENTRIES` | every aliasable `@ay/*` specifier → its source entry, relative to the workspace root |
| `ayLocalAlias(ayLocal, workspaceRoot)` | pure: returns the alias map when the value is exactly `"1"`, `{}` otherwise |
| `ayResolve(opts?)` | the Vite `resolve` fragment: the alias map plus `dedupe: ["react", "react-dom"]` |

`apps/burkut/vite.config.ts` spreads `ayResolve()` into `resolve`. Any value other
than exactly `"1"` — including absence, `"0"`, `""`, and `"1 "` — yields an empty
alias map, so `@ay/*` resolves through the packages' published entry points. That
is the path `pnpm build` and CI take.

`dedupe` is applied on **both** branches, not just the aliased one. That is what
keeps a single React and React-DOM instance in the module graph.

If `AY_LOCAL=1` is set but a source entry is missing, config load throws and names
the missing absolute path, rather than letting Vite fail later with an opaque
resolution error.

## Why not `npm link` or `yalc`

Neither is used here, and neither is a working fallback.

A linked package is a symlink outside the app's module graph, so its bare `react`
import resolves from the *package's* own `node_modules`, not the app's. With pnpm's
isolated layout that reliably produces two React copies and the "Invalid hook call"
error. `yalc` copies build output instead of symlinking, which trades that failure
for a stale-artifact problem and a manual push step on every edit.

The alias path avoids both: aliased files compile as ordinary members of the app's
module graph, so their imports resolve from the app root, and `resolve.dedupe`
collapses any remaining duplicate.

Consequently, never write `npm link` or `yalc` into a document here as an
instruction — a root test asserts that no document does.

## Adding a package to the alias map

Add one entry to `AY_LOCAL_ENTRIES` naming the new specifier and its source entry
relative to the workspace root. The alias-map property test picks it up
automatically; nothing in the app configs needs to change.
