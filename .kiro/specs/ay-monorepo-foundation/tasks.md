# Implementation Plan: ay-monorepo-foundation

## Overview

The plan follows the design's ordering constraints strictly. The committed computed-value baseline is captured **first**, against the pre-migration `src/styles/global.css` and `ay-ui-library/src/styles/tokens.css`, because once `global.css` is deleted those values exist nowhere else. `@ay/tokens` is built before either consumer is rewired so the consumers have a real package to point at. **Bürküt's root files — `package.json` first among them — move into `apps/burkut/` before any new root file is written** (task 4 before task 5), because the current root `package.json`, `biome.json`, `tsconfig.json`, `vite.config.ts`, and `index.html` are Bürküt's. The workspace and directory restructure both land before the first `pnpm install` so `workspace:` deps resolve. Bürküt's `global.css` is deleted only after `tailwind.css` and `app-tokens.css` exist and are imported.

All values, tables, and decisions come from `design.md` — the tasks reference its sections rather than restating them. Language: TypeScript for tests and package sources, plain Node ESM (`.mjs`) for the token build script and baseline resolver, as the design specifies.

## Tasks

- [x] 1. Manual prerequisites gate — STOP and confirm before any file changes
  - **This task is performed by the user, not by an agent.** Halt execution and ask the user to confirm each item.
  - Prerequisite 1: `ay-ui-library` has been pushed to its remote — `ay-ui-library/.git/` is deleted during the move and the history survives only at `github.com/pemre/ay-ui-library`.
  - Prerequisite 2: the GitHub repository has been renamed `burkut` → `ay-stack` — every `repository.url`, `homepage`, and Pages path in this plan assumes it.
  - Prerequisite 3: npm publish rights for the `@ay` scope are confirmed — a first publish into an unowned scope fails with a 403.
  - Prerequisite 4 (`npm deprecate ay-ui-library`) is order-independent and appears as task 20.
  - Do not proceed to task 2 until all three are confirmed. See the design's Prerequisites table.

- [x] 2. Capture the pre-migration token baseline
  - [x] 2.1 Implement the baseline resolver at `tools/tokens/resolve.mjs`
    - Implement `parseBlocks`, `resolveAll`, and `resolveThemes` per the design's resolver contract.
    - Treat `@theme static { … }` as a root-level block so the same resolver reads pre- and post-migration stylesheets.
    - `var(--x, fallback)` uses the declared value when `--x` exists and the fallback when it does not; dark is resolved as an overlay on root so properties like `--accent-a66` resolve the way the cascade resolves them. Throw on cycles and unresolvable names.
    - _Requirements: 6.5, 8.1, 8.2, 8.3, 8.4_

  - [x] 2.2 Write resolver unit and property tests
    - Not one of the 20 design properties — the resolver is the instrument, so it carries its own tests: resolution is idempotent, no `var()` survives a successful resolution, cyclic chains throw, and `var(--x, fb)` selects `fb` exactly when `--x` is undeclared. fast-check with generated declaration maps.
    - _Requirements: 8.1, 8.2_

  - [x] 2.3 Capture and commit `tools/tokens/baseline.json`
    - Implement `tools/tokens/capture-baseline.mjs` with the `--in` / `--out` interface from the design's Testing Strategy, and run it against the **pre-migration** `src/styles/global.css` and `ay-ui-library/src/styles/tokens.css`.
    - Emit the documented shape (`capturedAt`, `sources`, `light`, `dark`) and commit the file. Nothing may move before this commit exists.
    - **As built:** the committed baseline carries three keys beyond the originally documented shape — `mergeStrategy` (first-`--in`-source-wins), `conflicts` (exactly one entry, dark `--color-border-hover`), and `perSource` (each source resolved independently). `perSource` is the map the task 7.6 diff actually consumes; the merged `light`/`dark` maps are retained for the record only.
    - **As built:** the resolver's own tests run with `node --test tools/tokens/resolve.test.mjs` — there is no test runner at the root yet. Task 5.3's root `tests/` scaffold is what folds them into `pnpm verify`; until then this command is the only way to exercise them.
    - _Requirements: 6.5, 7.4, 8.1, 8.2, 8.3, 8.4_

- [x] 3. Checkpoint — baseline captured
  - Ensure all quality gates pass and the baseline diff is clean; ask the user if questions arise.
  - Confirm `tools/tokens/baseline.json` is committed and contains both themes for every token declared by the two pre-migration sources. This file is the only record of the pre-migration world from here on.

- [x] 4. Restructure the directory layout — Bürküt's root files move out first
  - [x] 4.1 Move the Bürküt sources **and root files**, `package.json` included, to `apps/burkut/`
    - `git mv` `src/`, `vite-plugins/`, `.burkut/`, `index.html`, `vite.config.ts`, `tsconfig.json`, `biome.json`, **and `package.json`** into `apps/burkut/`. The root path itself is unchanged and `.kiro/specs/` stays put.
    - `package.json` is the one that matters most and the one the earlier plan omitted: the current root manifest **is** Bürküt's — `name: "burkut"`, `bin`, `files`, `homepage`, and the `cac` / `gray-matter` CLI dependencies. Its content must become `apps/burkut/package.json` or Bürküt's publishable shape is lost and cannot be reconstructed from the new root manifest.
    - **⚠️ Hazard:** all five of `package.json`, `biome.json`, `tsconfig.json`, `vite.config.ts`, and `index.html` are Bürküt's, and the new workspace root needs three of those names for itself. Creating the new root files before this move would either carry the freshly written root files away into `apps/burkut/` or overwrite Bürküt's originals at the destination. Nothing in task 5 may run until this task is done. Recovery if it goes wrong: `git checkout -- package.json biome.json tsconfig.json vite.config.ts index.html`.
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 2.7_

  - [x] 4.2 Move `ay-ui-library/*` to `packages/ui-library/*`
    - Use `git mv` for tracked files; move untracked files with plain `mv` and stage them separately (never `cp` + delete, which loses rename detection).
    - Delete `ay-ui-library/.git/` and `ay-ui-library/package-lock.json`. Verify exactly one `.git` directory remains, at the root.
    - _Requirements: 2.3, 2.5, 2.6, 2.8, 1.6_

  - [x] 4.3 Relocate the steering directories
    - `git mv` `ay-ui-library/.kiro/steering/*` → `packages/ui-library/.kiro/steering/`, and the Bürküt `product`, `structure`, `tech`, `post-implementation` steering → `apps/burkut/.kiro/steering/`. Content rewrites happen in task 17.
    - _Requirements: 15.1, 15.2_

  - [x] 4.4 Delete the root `package-lock.json` (and any `yarn.lock`)
    - The root lockfile is Bürküt's too, but it is **deleted rather than moved**: pnpm replaces it with a single root `pnpm-lock.yaml`.
    - _Requirements: 1.6_

- [x] 5. Scaffold the pnpm workspace and install
  - [x] 5.1 Create `pnpm-workspace.yaml` and the new root `package.json`
    - Only after task 4 has moved Bürküt's root files out. `pnpm-workspace.yaml` declares the `packages/*` and `apps/*` globs and the full `catalog:` block from the design's model, including `@testing-library/dom` (a peer of `@testing-library/react@16`).
    - The root `package.json` is the design's root manifest verbatim: private `ay-stack`, no `bin`/`files`/`main`/`module`/`types`, pinned `packageManager`, the `pnpm -r` fan-out scripts, `verify` ordered cheapest-first, `dev`, `storybook`, and `repository.url` pointing at `ay-stack`.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 16.5, 16.6_

  - [x] 5.2 Create the root `biome.json`, root `.gitignore`, and shared tsconfig
    - Root `biome.json` carries the single shared configuration (indent 2, width 100, double quotes, semicolons always, organize-imports assist) that each package extends. It is written only after Bürküt's `biome.json` has landed in `apps/burkut/`.
    - Root `.gitignore` covers `node_modules`, `dist`, `coverage`, `storybook-static`, and editor state for `packages/*` and `apps/*` paths.
    - Add a root tsconfig only if the root `tests/` directory needs one to typecheck.
    - _Requirements: 2.9, 10.9_

  - [x] 5.3 Scaffold the root `tests/` directory and root `test` script
    - The workspace-level static checks (lockfile, manifests, docs, workflows, gitignore, tarballs) live here per the design's test-location table; wire them into the root `test` script so `pnpm verify` reaches them.
    - This is also where the already-written resolver tests stop needing `node --test tools/tokens/resolve.test.mjs` and start running under `pnpm verify`.
    - _Requirements: 16.5, 16.6_

  - [x] 5.4 Run the first `pnpm install`
    - Install at the root so `workspace:` protocol deps and `catalog:` references resolve into a single `pnpm-lock.yaml`. Confirm no `package-lock.json` or `yarn.lock` remains anywhere.
    - Expected peer resolution: `@testing-library/dom` for `@testing-library/react@16`. Resolve any other peer warning by adding a catalog entry, never with `--no-strict-peer-dependencies`.
    - _Requirements: 1.5, 1.6, 1.8_

  - [x] 5.5 Write property test for shared tool version uniqueness
    - **Property 9: Single version per shared tool**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7**

  - [x] 5.6 Write property test for manifest hygiene
    - **Property 10: Manifest hygiene**
    - **Validates: Requirements 1.6, 1.8, 5.1, 5.2**

  - [x] 5.7 Write property test for gitignore coverage
    - **Property 20: Gitignore covers every package path**
    - **Validates: Requirements 2.9**

- [x] 6. Checkpoint — restructure and first install
  - Ensure all quality gates pass and the baseline diff is clean; ask the user if questions arise.
  - Review the `git mv` diff to confirm relocated content is otherwise unchanged (Requirements 2.1 and 2.6 are verified by review, not by a test), and confirm exactly one lockfile and one `.git` directory exist.

- [x] 7. Create the `@ay/tokens` package
  - [x] 7.1 Author `packages/tokens/src/core.css`
    - Single `@theme static { … }` block carrying the full union from the design's core tier reconciliation table, including the four new green tokens (`--color-green-500/400`, `--color-green-500-a30`, `--color-green-400-a30`) that back Bürküt's promoted status tokens.
    - Preserve all twelve alpha values verbatim, hex and decimal notation alike, and carry the inline comment documenting the `a44`/`a66` convention drift per the Alpha notation decision.
    - _Requirements: 4.1, 4.4, 4.5, 4.6, 4.10, 4.11, 11.4_

  - [x] 7.2 Author `packages/tokens/src/semantic.css`
    - Declare the sixteen tokens from the design's "Semantic tier, final shape" table in `:root` and re-declare all sixteen in `[data-theme="dark"]`, including the six promoted from Bürküt's legacy aliases and the resolved dark `--color-border-hover` (amber-400).
    - `color-scheme: light` in `:root`, `color-scheme: dark` in the dark block. No legacy alias names, no app-specific tokens, no component tokens.
    - _Requirements: 4.2, 4.3, 4.7, 4.10, 4.11, 6.2, 6.4_

  - [x] 7.3 Author the `src/theme.css` and `src/tokens.css` entries
    - `theme.css` imports `./core.css` then `./semantic.css`; `tokens.css` is the plain-CSS dev entry used when the local dev alias is active.
    - _Requirements: 9.1, 11.4, 11.5, 11.6, 12.1_

  - [x] 7.4 Implement `packages/tokens/scripts/build-css.mjs`
    - Follow the five-step contract in the design: the `@theme static` → `:root` rewrite is the only transformation and values are never touched. Emit `dist/core.css`, `dist/semantic.css`, `dist/tokens.css`, `dist/theme.css`.
    - Assert the emitted `:root` core-token count matches the declared core count so a missing `static` cannot silently drop tokens.
    - _Requirements: 9.1, 11.4, 11.8_

  - [x] 7.5 Create the package manifest and package documents
    - `package.json` exactly as modelled: `exports` subpath map, `files`, `sideEffects`, `publishConfig.access: "public"`, catalog devDependencies, `repository.directory`, and no dependencies or peerDependencies.
    - Add `LICENSE`, `README.md` (install steps plus the CSS and Tailwind consumption paths, linking to the architecture document rather than restating it), and `TOKEN-ARCHITECTURE.md` as the single authoritative three-tier statement.
    - _Requirements: 3.3, 9.1, 9.2, 9.3, 9.7, 15.5, 17.2_

  - [x] 7.6 Write property test for computed-value preservation (the baseline diff)
    - **Property 1: Computed-value preservation across the migration**
    - **The diff is per consumer, not merged.** Compare `perSource["src/styles/global.css"]` (78 properties, Bürküt's own pre-migration reality) against `packages/tokens/dist/tokens.css` + `apps/burkut/src/styles/app-tokens.css`, and `perSource["ay-ui-library/src/styles/tokens.css"]` (38 properties) against `packages/tokens/dist/tokens.css` alone. The merged `light`/`dark` maps are not used — they carry Bürküt's dark `--color-border-hover` into a comparison the library never made.
    - The allowlist is **keyed by source path** and holds exactly one entry, scoped to Bürküt's chain. The same drift in `@ay/ui-library` is a plain failure, not an accepted deviation.
    - This yields **exactly one deviation, not two**. Two only appear if the merged map is diffed against the library's chain as well, which charges the library with a change to a value it never declared.
    - Resolve whichever post-migration sources exist so the test is runnable from the moment `@ay/tokens` builds, and pick up `apps/burkut/src/styles/app-tokens.css` once task 12 lands. Report missing keys and changed values separately.
    - **Validates: Requirements 4.4, 6.5, 7.4, 8.1, 8.2, 8.3, 8.4**

  - [x] 7.7 Write property test for semantic tier dark completeness
    - **Property 2: Semantic tier dark completeness**
    - **Validates: Requirements 4.3, 4.7, 8.5**

  - [x] 7.8 Write property test for theme/plain entry equivalence
    - **Property 8: Theme entry and plain entry declare the same tokens**
    - **Validates: Requirements 9.1, 11.4, 11.5, 11.6, 11.8**

- [x] 8. Checkpoint — `@ay/tokens` builds and the guard is live
  - Ensure all quality gates pass and the baseline diff is clean; ask the user if questions arise.
  - From here the baseline diff runs at every checkpoint. It is the regression guard, not a final gate.

- [x] 9. Create the `@ay/vite-config` package
  - [x] 9.1 Implement `packages/vite-config/src/index.ts` and its manifest
    - Export `AY_LOCAL_ENTRIES`, `ayLocalAlias`, and `ayResolve` per the design's contract. `ayLocalAlias` is pure — it reads no `process.env`; `ayResolve` reads `AY_LOCAL` and `import.meta` only for defaults and always emits `dedupe: ["react", "react-dom"]`.
    - Throw at config load with the missing absolute path when `AY_LOCAL=1` but a `packages/*/src` entry is absent. Manifest is `private: true`, so the name is never published.
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 9.2 Write property test for the local dev alias map
    - **Property 12: Local dev alias map correctness**
    - **Validates: Requirements 12.1, 12.2, 12.3**

  - [x] 9.3 Write property test for the React singleton under the alias
    - **Property 13: React singleton under the local dev alias**
    - **Validates: Requirements 12.4**

- [x] 10. Rewire `@ay/ui-library`
  - [x] 10.1 Update `packages/ui-library/package.json` and `biome.json`
    - Apply the design's changed-fields model: `@ay/ui-library`, version `0.5.0`, `exports` map, `files`, `publishConfig.access`, `@ay/tokens` as a `workspace:^` dependency, the four peer dependencies, `repository` with `directory`, and catalog references for every shared tool. Reduce `biome.json` to `{"extends": ["../../biome.json"]}`.
    - _Requirements: 3.1, 3.2, 3.4, 3.9, 5.1, 9.6, 10.9_

  - [x] 10.2 Delete `src/styles/tokens.css` and source Storybook's tokens from `@ay/tokens`
    - Drop the `import "../src/styles/tokens.css"` line from `.storybook/preview.ts`; `.storybook/tailwind.css` becomes `@import "tailwindcss";` then `@import "@ay/tokens/theme.css";` — Tailwind first so the token block extends rather than is overridden.
    - _Requirements: 4.8, 5.3, 11.6_

  - [x] 10.3 Set the Storybook Vite base from `STORYBOOK_BASE`
    - Add `viteFinal` in `.storybook/main.ts` reading `STORYBOOK_BASE`, defaulting to `/` for local runs so CI can pass `/ay-stack/`.
    - _Requirements: 14.1_

  - [x] 10.4 Map `SpiralTimeline.css`'s core-tier references to component tokens
    - Declare the six `--spiral-*` component tokens in the `.spiral-timeline` block with their existing literal fallbacks and swap every downstream reference, including the `calc()` expressions, per the design's snippet. Computed values must not change.
    - _Requirements: 5.7, 8.6_

  - [x] 10.5 Write property test for component-tier discipline
    - **Property 7: Component CSS never reaches the core tier**
    - **Validates: Requirements 5.7**

- [x] 11. Rewire Bürküt's build configuration and dependencies
  - [x] 11.1 Update `apps/burkut/package.json` and `biome.json`
    - Apply the design's changed-fields model: `homepage` at `https://pemre.github.io/ay-stack/burkut/`, `private: true` with the publishable shape (`bin`, `files`) retained, `@ay/tokens` and `@ay/ui-library` as `workspace:^`, `d3` and `tailwindcss` from the catalog, `@tailwindcss/vite` in devDependencies, catalog references for every shared tool, and `repository` with `directory`. Reduce `biome.json` to `{"extends": ["../../biome.json"]}`.
    - _Requirements: 5.2, 10.9, 11.1, 11.2, 13.6, 14.6_

  - [x] 11.2 Update `apps/burkut/vite.config.ts`
    - Register the Tailwind v4 Vite plugin, set `root: import.meta.dirname`, spread `ayResolve()` from `@ay/vite-config` into `resolve`, change `base` to `process.env.GITHUB_PAGES ? "/ay-stack/burkut/" : "/"`, and fix `devLayoutsApi` to use `join(import.meta.dirname, ".burkut", "layouts")` instead of `process.cwd()`. The CLI plugin's `contentDir`-based handlers stay untouched.
    - _Requirements: 11.3, 12.1, 12.2, 12.3, 13.1, 13.5, 13.8, 14.6_

- [x] 12. Migrate Bürküt's tokens out of `global.css`
  - [x] 12.1 Create `apps/burkut/src/styles/tailwind.css`
    - `@import "tailwindcss";` then `@import "@ay/tokens/theme.css";` — the package specifier, not a relative path, and Tailwind first so the token block extends the default theme.
    - _Requirements: 5.4, 11.5_

  - [x] 12.2 Create `apps/burkut/src/styles/app-tokens.css`
    - Legacy alias block for both themes, resolved per the design's legacy alias decision table: `--bg-sidebar` maps to different semantic tokens per theme, the six promoted aliases point at their new semantic tokens, `--accent-a66`'s dark asymmetry is preserved, and no hex or `rgba()` literal remains.
    - App-specific tokens carried over byte-identical for both themes: the six `--tl-bg-*`, the six `--vis-*`, `--font-serif`, plus the `*` and `html, body, #root` base rules.
    - _Requirements: 4.9, 6.1, 6.2, 6.3, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4_

  - [x] 12.3 Update `main.tsx` import order and delete `global.css`
    - Import order becomes vendor CSS → `./styles/tailwind.css` → `./styles/app-tokens.css` → `./styles/layout.css`. Delete `src/styles/global.css` only after both new files exist and are imported, so tokens are never missing.
    - _Requirements: 4.9, 5.4, 16.7_

  - [x] 12.4 Write property test for bidirectional tier ownership
    - **Property 3: Bidirectional tier ownership**
    - Lives in both `packages/tokens/tests/` and `apps/burkut/src/tests/`; the Bürküt half is what satisfies Requirement 16.7.
    - **Validates: Requirements 4.1, 4.5, 4.8, 4.9, 4.10, 4.11, 6.4, 16.7**

  - [x] 12.5 Write property test for token import form
    - **Property 4: Token imports use the package specifier**
    - **Validates: Requirements 5.3, 5.4**

  - [x] 12.6 Write property test for a literal-free alias block
    - **Property 5: Legacy alias block is literal-free**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [x] 12.7 Write property test for legacy alias reachability
    - **Property 6: Legacy aliases are reachable**
    - **Validates: Requirements 6.6**

  - [x] 12.8 Fix the pre-existing TypeScript errors in `apps/burkut`
    - Six `tsc` diagnostics across two files, both surfaced by the migration rather than caused by it. The `scanner.ts` annotation is present verbatim at `HEAD` (`git show HEAD:src/cli/scanner.ts` line 18), and the `WidgetGrid.tsx` mismatch comes from the `react-grid-layout` v2 typings against app code the migration never touched. Requirement 16.1 does not permit either, so they are fixed here rather than deferred.
    - `src/cli/scanner.ts` (five): `ReturnType<typeof readdirSync>` resolves to `Dirent<NonSharedBuffer>[]` under `@types/node` 25 because it picks the Buffer overload. Typed against `Dirent[]` explicitly instead. Type-only change; no runtime behavior differs.
    - `src/components/WidgetGrid/WidgetGrid.tsx` (one): `react-grid-layout` v2 hands `onLayoutChange` a readonly `Layout` (`readonly LayoutItem[]`). The handler now accepts the readonly type and copies into a mutable array for the store. Markup, class names, and behavior are unchanged (Requirement 8.6) and the existing `WidgetGrid` tests pass unmodified.
    - _Requirements: 16.1_

  - [x] 12.9 Make `pnpm --filter burkut build` succeed
    - Also predates the migration and was surfaced, not caused, by it: `src/hooks/useContentGraph.ts` imports `virtual:burkut-content`, but `burkutContent()` was only ever registered in CLI mode by `src/cli/devServer.ts` — `HEAD`'s root `vite.config.ts` never mentions the plugin either — so `vite build` could not resolve the module. Requirement 16.4 does not permit that.
    - Register `burkutContent()` in `apps/burkut/vite.config.ts` with the content directory taken from `BURKUT_CONTENT_DIR` (resolved against the caller's cwd, the same rule the CLI applies to its directory argument), falling back to an **empty ContentGraph** with a one-line stdout notice naming the env var so a blank UI is never unexplained.
    - The CLI path is unaffected: config-file plugins are ordered ahead of inline ones, so the config-file instance stands down whenever `devServer.ts` registers its own `burkutContent({ contentDir })`. The `contentDir`-based `/api/layouts` and `/content-assets/` handlers are untouched.
    - Explicitly **not** the ROADMAP Phase 6 static-build feature; the fallback is commented as such in both the plugin and the config.
    - _Requirements: 16.4_

- [x] 13. Checkpoint — both consumers rewired
  - Ensure all quality gates pass and the baseline diff is clean; ask the user if questions arise.
  - The baseline diff now covers the full post-migration chain (`packages/tokens/dist/tokens.css` plus `apps/burkut/src/styles/app-tokens.css`) and must show exactly the one allowlisted deviation.

- [x] 14. Verify Bürküt path integrity and Tailwind consumption
  - [x] 14.1 Write property test for the CLI path-resolution split
    - **Property 14: CLI path-resolution split**
    - **As built:** `apps/burkut/src/cli/paths.property.test.ts`, 200 runs per property. The two resolution rules were extracted from `bin/burkut.ts` and `devServer.ts` into `src/cli/paths.ts` (`resolveProjectRoot`, `resolveTargetDir`, `validateTargetDir`) so the test exercises the CLI's own code rather than a copy of it; both call sites now delegate and behave identically.
    - **Validates: Requirements 13.1, 13.2**

  - [x] 14.2 Write property test for content plugin round-trips
    - **Property 15: Content plugin payload round-trips**
    - **As built:** `apps/burkut/vite-plugins/content-payload.property.test.ts`, 100 runs per property, backed by `vite-plugins/testHarness.ts` — a test-only stand-in for the connect middleware stack and the `ViteDevServer` members the plugin touches, so the plugin's real middlewares run without booting Vite.
    - **Validates: Requirements 13.3, 13.5**

  - [x] 14.3 Write property test for the asset boundary and error naming
    - **Property 16: Content asset boundary and error reporting**
    - **As built:** `apps/burkut/vite-plugins/content-asset-boundary.property.test.ts`, 300 runs on the boundary properties and 100 on error naming. **No traversal escape was found.** A canary file outside the content directory is never served; `../` chains, percent-encoded `%2e%2e%2f`, empty segments, and the sibling-prefix vector (`../content-sibling/secret.txt`, which a naive `startsWith(base)` check would admit) are all rejected with 403. `....//` is correctly treated as an ordinary directory name and stays inside the boundary.
    - **Validates: Requirements 13.4, 13.7**

  - [x] 14.4 Write integration test for Tailwind utility output and token fallback
    - Assert the compiled Tailwind output contains rules for the utility classes library blocks declare (vacuous today, so it guards the wiring), and that blocks stay readable from their custom-property styling when the Tailwind stylesheet is absent.
    - **As built:** `apps/burkut/src/tests/tailwind-output.integration.test.ts` compiles the app's own `src/styles/tailwind.css` in-process through the `tailwindcss` `compile()` API with a `loadStylesheet` that resolves both relative and package-specifier imports. It asserts utilities are emitted and carry `@ay/tokens` core values (`--color-amber-500`, `--color-green-400`), that an undefined class produces no rule, that every class a library block declares is block-owned rather than a Tailwind utility (11.7's vacuity, recorded rather than hidden), and that every `var()` a block stylesheet references is supplied by `dist/tokens.css`, declared locally, or carries an inline fallback (11.8).
    - _Requirements: 11.7, 11.8_

- [x] 15. Checkpoint — Tailwind adoption in Bürküt
  - Ensure all quality gates pass and the baseline diff is clean; ask the user if questions arise.
  - Tailwind's preflight reset is new to Bürküt and normalizes margins, list styles, and heading sizes. If it changes Bürküt's appearance, scope it out via a layered import rather than accepting the change.

- [x] 16. Consolidate CI into one Pages workflow
  - [x] 16.1 Create `.github/workflows/deploy-pages.yml` and delete the two old workflows
    - One workflow, two build jobs, one deploy: `install` (pnpm setup plus a store cache keyed on `pnpm-lock.yaml`) → `build-storybook` with base `/ay-stack/` via `STORYBOOK_BASE` and `build-burkut` with base `/ay-stack/burkut/` → `assemble` (Storybook to the artifact root, Bürküt into `site/burkut/`) → `deploy`.
    - `assemble` declares `needs: [build-storybook, build-burkut]` and `deploy` declares `needs: [assemble]`, so any build failure short-circuits with a non-zero status and no artifact. Delete `.github/workflows/deploy.yml` and the relocated `packages/ui-library/.github/workflows/deploy-docs.yml`.
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 16.2 Write property test for workflow path and tooling currency
    - **Property 19: Workflow path and tooling currency**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**

- [x] 17. Rescope Kiro steering
  - [x] 17.1 Rescope the `@ay/ui-library` steering documents
    - Update every filesystem path and command in `packages/ui-library/.kiro/steering/` to the post-restructure layout and to pnpm, and replace the duplicated three-tier table in `tech.md` with `#[[file:packages/tokens/TOKEN-ARCHITECTURE.md]]`.
    - _Requirements: 15.1, 15.3, 15.4, 15.6_

  - [x] 17.2 Rescope the Bürküt steering documents
    - Update `apps/burkut/.kiro/steering/` product, structure, and tech to the `apps/burkut/` layout, the new stylesheet split, the `@ay/*` dependencies, and pnpm commands; replace the second duplicated tier table with the same file reference.
    - _Requirements: 15.2, 15.3, 15.4, 15.6_

  - [x] 17.3 Write the root steering for the workspace
    - Describe the workspace layout, the package boundaries, and the Local Dev Alias workflow, referencing the architecture document rather than restating the tiers.
    - _Requirements: 12.6, 15.6, 15.7_

  - [x] 17.4 Write property test for single-statement token architecture
    - **Property 18: Token architecture is stated exactly once**
    - **Validates: Requirements 15.5, 15.6**

- [x] 18. Update documentation
  - [x] 18.1 Write the root `README.md`
    - Workspace layout, package boundaries, pnpm commands, and the Local Dev Alias as the supported cross-package workflow.
    - _Requirements: 12.6, 17.1, 17.7_

  - [x] 18.2 Update `packages/ui-library/README.md` and `CHANGELOG.md`
    - README uses the `@ay/ui-library` name, records the `@ay/tokens` dependency and pnpm-based commands, drops every `npm link` / `yalc` instruction in favour of the Local Dev Alias, and updates the badges and Storybook URL to `https://pemre.github.io/ay-stack/`.
    - CHANGELOG gains an entry for the `0.5.0` rename and the token extraction.
    - _Requirements: 3.8, 12.6, 12.7, 17.3, 17.4, 17.7_

  - [x] 18.3 Update `ROADMAP.md` and delete `MIGRATION_PLAN.md`
    - Record the monorepo restructure as completed work and note Bürküt's new Pages subpath; remove the superseded plan document.
    - _Requirements: 17.5, 17.6, 17.7_

  - [x] 18.4 Write property test for documentation and steering hygiene
    - **Property 17: Documentation and steering hygiene**
    - **Validates: Requirements 3.8, 12.6, 12.7, 15.3, 15.4, 17.7**

- [x] 19. Verify independent publishability
  - [x] 19.1 Write property test for publishable tarball contents
    - **Property 11: Publishable tarball contents**
    - Runs `pnpm pack --dry-run --json` once per non-private package, not 100 times.
    - **Validates: Requirements 9.2, 9.7, 9.8**

  - [x] 19.2 Write integration tests for external consumption
    - Pack, install into a temp project outside the workspace, resolve every `@ay/tokens` subpath and import the `@ay/ui-library` barrel; assert the library build emits `dist/index.es.js`, `dist/index.cjs.js`, `dist/index.d.ts`, and `dist/style.css`, and that a semantic value patch propagates to a consumer stylesheet.
    - _Requirements: 5.5, 5.6, 9.4, 9.5_

- [x] 20. Manual checkpoint — deprecate the unscoped npm package
  - **This task is performed by the user, not by an agent.** It is an authenticated registry mutation and nothing in the workspace can perform it.
  - Ask the user to run `npm deprecate ay-ui-library "Renamed to @ay/ui-library"` after `@ay/ui-library` is published, then verify with `npm view ay-ui-library deprecated`.
  - _Requirements: 3.7_

- [ ] 21. Manual checkpoint — side-by-side visual parity check
  - **This task is performed by the user, not by an agent.** No automated check covers it.
  - Ask the user to compare Storybook and Bürküt before and after the migration, in **both light and dark**, screen by screen and story by story.
  - **Call out the Tailwind preflight risk explicitly:** preflight is new to Bürküt and normalizes margins, list styles, and heading sizes, so it can change appearance on its own even though every token resolves identically. If it does, scope it out via a layered import rather than accepting the change.
  - The one expected difference is the accepted dark `--color-border-hover` shift on `.btn:hover` and `.language-select:hover`. Any other difference is a regression.
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_

- [ ] 22. Final checkpoint
  - Ensure all quality gates pass and the baseline diff is clean; ask the user if questions arise.
  - Run `pnpm verify` at the root and confirm typecheck, lint, test, and build all pass for `@ay/tokens`, `@ay/ui-library`, and Bürküt, that exactly one lockfile exists, and that the deployed Pages URLs serve Storybook at `/ay-stack/` and Bürküt at `/ay-stack/burkut/`.

## Notes

- Sub-tasks marked `*` are the optional property and integration tests. Each names the design property it implements; there are 20, one task each.
- **Task 4 before task 5 is a hard ordering constraint, not a preference.** Bürküt's root files, `package.json` above all, move out before the new root files are written. See the hazard note on task 4.1.
- **The baseline diff is the primary regression guard, and it runs per consumer.** Each consumer's `perSource` baseline is diffed against that consumer's own post-migration chain. It becomes runnable the moment `@ay/tokens` builds (task 7) and is re-run at every checkpoint after that. It must stay clean, with exactly one allowlisted entry — the accepted dark `--color-border-hover` decision on Bürküt's chain. Nothing may be added to the allowlist without a corresponding design decision.
- **Tailwind preflight is the highest-risk unknown.** It is new to Bürküt, no automated check covers its effect on appearance, and it is the reason task 21 exists.
- Bürküt's Pages URL changes a second time when Bürküt is extracted to its own repository in a later spec. That is expected, not a regression.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["4.1", "4.2"] },
    { "id": 1, "tasks": ["4.3", "4.4"] },
    { "id": 2, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 3, "tasks": ["5.4"] },
    { "id": 4, "tasks": ["5.5", "5.6", "5.7", "7.1", "7.2"] },
    { "id": 5, "tasks": ["7.3", "7.4", "7.5", "9.1"] },
    { "id": 6, "tasks": ["7.6", "7.7", "7.8", "9.2", "9.3", "10.1", "10.4"] },
    { "id": 7, "tasks": ["10.2", "10.3", "11.1", "11.2"] },
    { "id": 8, "tasks": ["10.5", "12.1", "12.2"] },
    { "id": 9, "tasks": ["12.3"] },
    { "id": 10, "tasks": ["12.4", "12.5", "12.6", "12.7", "14.1", "14.2", "14.3", "14.4"] },
    { "id": 11, "tasks": ["16.1", "17.1", "17.2", "17.3", "18.1", "18.2", "18.3"] },
    { "id": 12, "tasks": ["16.2", "17.4", "18.4", "19.1", "19.2"] }
  ]
}
```
