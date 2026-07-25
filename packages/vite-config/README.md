# 🌜 @ay/vite-config

Shared Vite resolution for the `ay-stack` workspace. **Private — never published.**

## Why this package exists

Two configurations must agree on how `@ay/*` specifiers resolve: `apps/burkut/vite.config.ts`
and the library's Storybook Vite config. If they drift, the app and Storybook render
different code, and the difference is invisible until something breaks at runtime.

Copying a snippet into each config was the alternative. It was rejected because:

- the map has to stay in step with the set of `@ay/*` packages and their entry
  subpaths, which changes whenever a package is added;
- a function can be unit-tested once, and a copied snippet cannot be addressed by a
  test at all. The alias-map property test (Property 12) and the React-singleton
  property test (Property 13) exist because this is a module.

It is `"private": true`, so it never occupies a name in the public `@ay` scope, and
it exports TypeScript source directly — consumers are build tools, not runtimes.

## API

```ts
import { ayResolve, ayLocalAlias, AY_LOCAL_ENTRIES } from "@ay/vite-config";

export default defineConfig({
  resolve: { ...ayResolve() },
});
```

| Export | Behavior |
|--------|----------|
| `AY_LOCAL_ENTRIES` | every aliasable `@ay/*` specifier → its source entry, relative to the workspace root |
| `ayLocalAlias(ayLocal, workspaceRoot)` | pure. Returns the alias map when `ayLocal` is exactly `"1"`, `{}` otherwise. Reads no environment |
| `ayResolve(opts?)` | the Vite `resolve` fragment: the alias map plus `dedupe: ["react", "react-dom"]` |
| `ayWorkspaceRoot()` | the workspace root, derived from this file's own location |

`dedupe` is present on **both** branches — the published-entry path needs the same
single-React guarantee the aliased path does.

When `AY_LOCAL=1` is set but a source entry is missing, `ayLocalAlias` throws at
config load and names the missing absolute path, instead of leaving Vite to fail
later with an opaque resolution error.

## The Local Dev Alias

```bash
AY_LOCAL=1 pnpm dev
```

Resolves `@ay/*` to `packages/*/src` so edits reach a running dev server through
HMR, with no rebuild and no linking step. Full rationale, including why package
linking fails under pnpm, is in the root [`README.md`](../../README.md) and in
`.kiro/steering/local-dev-alias.md`.

## Commands

```bash
pnpm --filter @ay/vite-config test
pnpm --filter @ay/vite-config typecheck
pnpm --filter @ay/vite-config lint
```

There is no `build` script: the package ships source.
