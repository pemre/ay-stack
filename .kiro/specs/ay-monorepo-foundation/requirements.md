# Requirements Document

## Introduction

This feature restructures the existing workspace root in place into a pnpm monorepo that hosts a shared dashboard/UI stack. It performs three coupled changes: (1) establishes the workspace tooling and target directory layout, (2) migrates the shared library from the unscoped npm name `ay-ui-library` to the `@ay/ui-library` scoped name, and (3) eliminates the current copy-paste duplication of design tokens between the Bürküt application and the UI library by extracting a single shared `@ay/tokens` package.

Today `src/styles/global.css` (Bürküt) and `ay-ui-library/src/styles/tokens.css` each declare the same ten semantic tokens with identical values plus matching `[data-theme="dark"]` override blocks. The core tier has already drifted: the library declares `--color-amber-400` and `a12/a20/a44` alpha variants, while Bürküt additionally declares `a15/a30/a66` variants the library lacks. Bürküt also carries a Legacy Alias block in which several aliases resolve to hardcoded hex values instead of semantic tokens, and App-Specific Tokens (timeline background layers, vis-timeline overrides, serif font) that belong to the application rather than to a shared contract.

This is Phase 0 of a three-spec migration. Bürküt lives in this monorepo temporarily and will be extracted to its own repository in a later phase. Future applications (music-library, image-gallery) will live in separate repositories and consume published `@ay/*` packages, so both shared packages must remain independently publishable and consumable from outside this monorepo.

This work is a pure structural and token-location refactor. No rendered output of Bürküt or of the library's Storybook may change, in either theme. The feature is complete only when every Quality Gate passes in both packages.

## Glossary

- **Monorepo Root**: The existing workspace root directory, restructured in place to contain `pnpm-workspace.yaml`, a private root `package.json`, `packages/`, and `apps/`. Conceptually named "ay-stack". It publishes nothing itself.
- **`@ay/tokens`**: A new, publishable package at `packages/tokens/` that owns the Core Token Tier and Semantic Token Tier as the single source of truth for the shared design language, exposes them as importable CSS, and exposes them as the Tailwind v4 theme source.
- **`@ay/ui-library`**: The shared React component library at `packages/ui-library/`, previously published to npm under the unscoped name `ay-ui-library` at version 0.4.1. It exports `ImageZoom` and `SpiralTimeline` with their public types, builds via Vite library mode, and declares `d3`, `react`, `react-dom`, and `tailwindcss` as peer dependencies.
- **Core Token Tier**: Raw, context-free design values named `--{category}-{name}-{scale}`, for example `--color-amber-500`, `--color-gray-300`, `--space-2`, `--radius-md`, `--duration-fast`. Core tokens are never referenced directly by component CSS.
- **Semantic Token Tier**: Context-carrying tokens named `--{category}-{context}` that reference Core Token Tier values and are re-declared per theme, for example `--color-primary`, `--color-bg-surface`, `--color-border-default`, `--radius-control`. Components consume this tier.
- **Component Token Tier**: Tokens named `--{component}-{property}` declared inside an individual component's own CSS file, for example `--btn-height`. This tier stays with its component and is never centralized.
- **Legacy Alias**: A custom property in Bürküt's `global.css` "Legacy Aliases" block that exists for backward compatibility with older Bürküt CSS, for example `--accent`, `--bg-sidebar`, `--text-muted`, `--border-subtle`, `--code-bg`, `--success`.
- **App-Specific Token**: A custom property whose meaning is specific to one application and which therefore stays in that application, for example Bürküt's six `--tl-bg-*` timeline layer colors, the `--vis-*` vis-timeline overrides, and `--font-serif`.
- **Local Dev Alias**: The Vite `resolve.alias` configuration, enabled only when the `AY_LOCAL` environment variable equals `1`, that maps each `@ay/*` package specifier to that package's local `packages/*/src` directory, combined with `resolve.dedupe` for `react` and `react-dom`.
- **Quality Gate**: The ordered set of checks that must all report success for a package: `tsc --noEmit` with zero type errors, `biome check src` with zero diagnostics, the package's Vitest suite with zero failures, and the package's production build.

## Requirements

### Requirement 1: pnpm Workspace Foundation

**User Story:** As a developer, I want a single pnpm workspace at the Monorepo Root, so that I can install, build, and test every package with one toolchain and one lockfile.

#### Acceptance Criteria

1. THE Monorepo Root SHALL contain a `pnpm-workspace.yaml` file declaring the workspace globs `packages/*` and `apps/*`.
2. THE Monorepo Root SHALL contain a `package.json` with `"private": true` that declares no `bin`, `files`, `main`, `module`, or `types` fields.
3. THE Monorepo Root `package.json` SHALL declare a `packageManager` field pinning pnpm to an exact version.
4. THE Monorepo Root `package.json` SHALL define workspace-wide scripts that run build, test, typecheck, and lint across all workspace packages.
5. WHEN a developer runs the pnpm install command at the Monorepo Root, THE Monorepo Root SHALL produce exactly one `pnpm-lock.yaml` file at the Monorepo Root.
6. THE Monorepo Root SHALL contain no `package-lock.json` file and no `yarn.lock` file at the root or inside any workspace package.
7. THE Monorepo Root `package.json` SHALL declare no `packageManager` value referencing yarn or npm.
8. WHERE a workspace package depends on another workspace package, THE dependent package `package.json` SHALL declare that dependency using the `workspace:` protocol.

### Requirement 2: In-Place Directory Restructure

**User Story:** As a developer, I want the existing workspace root reorganized into `packages/` and `apps/` without relocating the workspace itself, so that my open editors, git history, and existing specs stay intact.

#### Acceptance Criteria

1. THE Monorepo Root SHALL retain its current filesystem path.
2. THE Monorepo Root SHALL contain the directory `packages/tokens/` holding the `@ay/tokens` package.
3. THE Monorepo Root SHALL contain the directory `packages/ui-library/` holding the `@ay/ui-library` package, moved from the former `ay-ui-library/` directory.
4. THE Monorepo Root SHALL contain the directory `apps/burkut/` holding the Bürküt application sources `src/`, `vite-plugins/`, `.burkut/`, `index.html`, `vite.config.ts`, `tsconfig.json`, and `biome.json`.
5. WHEN the restructure completes, THE Monorepo Root SHALL contain no `ay-ui-library/` directory and no root-level `src/` directory.
6. WHEN a file is relocated, THE relocated file SHALL retain its content unchanged except for path references and package specifiers that the relocation invalidates.
7. THE Monorepo Root SHALL preserve every existing spec directory under `.kiro/specs/` that belongs to Bürküt.
8. WHEN the move of the former `ay-ui-library/` directory completes, THE Monorepo Root SHALL contain exactly one git repository directory, located at the Monorepo Root.
9. THE Monorepo Root `.gitignore` SHALL cover build output, dependency directories, and editor state for every workspace package path.

### Requirement 3: npm Scope Migration

**User Story:** As a package consumer, I want the shared library published under the `@ay/` scope, so that all shared packages share one recognizable namespace.

#### Acceptance Criteria

1. THE `@ay/ui-library` `package.json` SHALL declare `"name": "@ay/ui-library"`.
2. THE `@ay/ui-library` `package.json` SHALL declare `publishConfig.access` with the value `"public"`.
3. THE `@ay/tokens` `package.json` SHALL declare `publishConfig.access` with the value `"public"`.
4. THE `@ay/ui-library` `package.json` SHALL declare a version greater than `0.4.1`.
5. THE `@ay/ui-library` barrel `src/index.ts` SHALL export `ImageZoom`, `SpiralTimeline`, and the same named types the barrel exported before the migration.
6. WHEN the scope migration completes, THE `@ay/ui-library` public API SHALL differ from the pre-migration public API of `ay-ui-library` only by package name.
7. WHEN the scope migration completes, THE unscoped npm package `ay-ui-library` SHALL carry a deprecation notice that names `@ay/ui-library` as the replacement.
8. WHEN a source file, configuration file, or document references the library by package specifier, THE referencing file SHALL use `@ay/ui-library`.
9. THE `@ay/ui-library` `package.json` `repository.url` SHALL point at the repository that hosts the Monorepo Root.

### Requirement 4: Shared Token Package Extraction

**User Story:** As a developer, I want the Core Token Tier and Semantic Token Tier to live in one package, so that a token change lands in one place instead of two.

#### Acceptance Criteria

1. THE `@ay/tokens` package SHALL declare every Core Token Tier custom property in a single `:root` block.
2. THE `@ay/tokens` package SHALL declare the ten shared Semantic Token Tier custom properties `--color-primary`, `--color-bg-body`, `--color-bg-surface`, `--color-bg-surface-alt`, `--color-text-primary`, `--color-text-secondary`, `--color-border-default`, `--color-border-hover`, `--color-hover-bg`, and `--radius-control`.
3. THE `@ay/tokens` package SHALL declare a `[data-theme="dark"]` block that overrides every Semantic Token Tier custom property declared in the `:root` block.
4. WHERE a Core Token Tier custom property is declared by the pre-migration Bürküt `global.css` or by the pre-migration `ay-ui-library` `tokens.css`, THE `@ay/tokens` package SHALL declare that custom property with the value it held in the source that declared it.
5. WHERE the pre-migration Bürküt `global.css` and the pre-migration `ay-ui-library` `tokens.css` declare the same custom property with different values, THE `@ay/tokens` package SHALL declare exactly one value for that custom property, and the design document SHALL record the chosen value and the reason for the choice.
6. THE `@ay/tokens` package SHALL declare the amber alpha variants `a12`, `a15`, `a20`, `a30`, `a44`, and `a66` for both `--color-amber-400` and `--color-amber-500`.
7. THE `@ay/tokens` package SHALL declare `color-scheme: light` in the `:root` block and `color-scheme: dark` in the `[data-theme="dark"]` block.
8. WHEN the extraction completes, THE `@ay/ui-library` package SHALL contain no file that declares a Core Token Tier or Semantic Token Tier custom property.
9. WHEN the extraction completes, THE Bürküt application SHALL contain no file that declares a Core Token Tier or Semantic Token Tier custom property.
10. THE `@ay/tokens` package SHALL declare no Component Token Tier custom property.
11. THE `@ay/tokens` package SHALL declare no App-Specific Token.

### Requirement 5: Token Consumption by Both Packages

**User Story:** As a developer, I want both the library and the application to pull tokens from `@ay/tokens`, so that neither owns a private copy of the shared design language.

#### Acceptance Criteria

1. THE `@ay/ui-library` `package.json` SHALL declare `@ay/tokens` as a dependency using the `workspace:` protocol.
2. THE Bürküt application `package.json` SHALL declare `@ay/tokens` as a dependency using the `workspace:` protocol.
3. THE `@ay/ui-library` SHALL import the `@ay/tokens` stylesheet through the `@ay/tokens` package specifier rather than through a relative filesystem path.
4. THE Bürküt application SHALL import the `@ay/tokens` stylesheet through the `@ay/tokens` package specifier rather than through a relative filesystem path.
5. WHEN the `@ay/ui-library` production build runs, THE build SHALL emit `dist/index.es.js`, `dist/index.cjs.js`, `dist/index.d.ts`, and `dist/style.css`.
6. WHEN a Semantic Token Tier value changes in `@ay/tokens`, THE Bürküt application and THE `@ay/ui-library` Storybook SHALL both reflect the changed value after their next build.
7. THE `@ay/ui-library` component CSS SHALL reference only Semantic Token Tier and Component Token Tier custom properties.

### Requirement 6: Legacy Alias Cleanup

**User Story:** As a developer, I want Bürküt's hardcoded Legacy Aliases resolved, so that no hex literal bypasses the token tiers and no application-only alias leaks into the shared contract.

#### Acceptance Criteria

1. WHERE a Legacy Alias resolves to a hardcoded hex or rgba literal in the pre-migration Bürküt `global.css`, THE Bürküt application SHALL redeclare that Legacy Alias to reference a Semantic Token Tier custom property.
2. WHERE a Legacy Alias carries a meaning the Semantic Token Tier does not yet express, THE `@ay/tokens` package SHALL declare a new Semantic Token Tier custom property for that meaning, and THE Bürküt application SHALL redeclare the Legacy Alias to reference the new custom property.
3. WHEN the cleanup completes, THE Bürküt Legacy Alias block SHALL contain no hardcoded hex literal and no hardcoded rgba literal.
4. THE `@ay/tokens` package SHALL declare no Legacy Alias.
5. WHEN the cleanup resolves a Legacy Alias, THE resolved Legacy Alias SHALL compute to the same rendered color value it computed to before the cleanup, for both the light theme and the dark theme.
6. WHERE a Legacy Alias has no remaining reference in Bürküt source, THE Bürküt application SHALL omit that Legacy Alias declaration.

### Requirement 7: App-Specific Tokens Remain in the Application

**User Story:** As a developer, I want Bürküt's application-only tokens to stay in Bürküt, so that the shared token package carries only the shared design language.

#### Acceptance Criteria

1. THE Bürküt application SHALL declare the six timeline background layer custom properties `--tl-bg-ancient`, `--tl-bg-early`, `--tl-bg-fragment`, `--tl-bg-mid`, `--tl-bg-late`, and `--tl-bg-modern` for both the light theme and the dark theme.
2. THE Bürküt application SHALL declare the vis-timeline override custom properties `--vis-bg`, `--vis-text`, `--vis-border`, `--vis-item-bg`, `--vis-item-border`, and `--vis-item-text` for both the light theme and the dark theme.
3. THE Bürküt application SHALL declare `--font-serif` and the `html, body, #root` base styles.
4. WHEN the token extraction completes, THE Bürküt application SHALL declare every App-Specific Token with the value it held before the extraction.

### Requirement 8: No Visual Regression

**User Story:** As a user of Bürküt and a reviewer of Storybook, I want the rendered output to be pixel-identical after the token extraction, so that a structural refactor carries no design change.

#### Acceptance Criteria

1. WHILE the light theme is active, THE Bürküt application SHALL render every screen with the same computed values for every custom property it resolved before the token extraction.
2. WHILE the dark theme is active, THE Bürküt application SHALL render every screen with the same computed values for every custom property it resolved before the token extraction.
3. WHILE the light theme is active, THE `@ay/ui-library` Storybook SHALL render every story with the same computed values for every custom property it resolved before the token extraction.
4. WHILE the dark theme is active, THE `@ay/ui-library` Storybook SHALL render every story with the same computed values for every custom property it resolved before the token extraction.
5. WHEN the theme attribute `data-theme` changes value between `dark` and absent, THE Bürküt application SHALL update every Semantic Token Tier custom property to the value declared for the active theme.
6. THE feature SHALL introduce no change to any component's markup structure, class names, or Component Token Tier values.

### Requirement 9: Independent Publishability

**User Story:** As the author of a future application in a separate repository, I want to install `@ay/tokens` and `@ay/ui-library` from npm, so that I can consume the shared stack without cloning this monorepo.

#### Acceptance Criteria

1. THE `@ay/tokens` `package.json` SHALL declare an `exports` map that exposes the token stylesheet and the Tailwind theme entry point.
2. THE `@ay/tokens` `package.json` SHALL declare a `files` field that includes every artifact a consumer needs.
3. THE `@ay/tokens` package SHALL depend on no other workspace package.
4. WHEN `@ay/tokens` is installed from a package tarball into a project outside the Monorepo Root, THE consuming project SHALL resolve the token stylesheet through the `@ay/tokens` package specifier.
5. WHEN `@ay/ui-library` is installed from a package tarball into a project outside the Monorepo Root, THE consuming project SHALL resolve `ImageZoom` and `SpiralTimeline` through the `@ay/ui-library` package specifier.
6. THE `@ay/ui-library` `package.json` SHALL declare `d3`, `react`, `react-dom`, and `tailwindcss` as peer dependencies.
7. THE `@ay/tokens` and `@ay/ui-library` packages SHALL each carry a `LICENSE` file and a `description` field.
8. WHEN the pnpm pack command runs for `@ay/tokens` or `@ay/ui-library`, THE resulting tarball SHALL exclude source-only files such as tests, stories, and lockfiles.

### Requirement 10: Toolchain Version Alignment

**User Story:** As a developer, I want one version of each shared development tool across the workspace, so that lint, test, and type results are identical in every package.

#### Acceptance Criteria

1. THE workspace SHALL resolve exactly one version of `@testing-library/react` across all workspace packages.
2. THE workspace SHALL resolve exactly one version of `jsdom` across all workspace packages.
3. THE workspace SHALL resolve exactly one version of `vitest` across all workspace packages.
4. THE workspace SHALL resolve exactly one version of `@biomejs/biome` across all workspace packages.
5. THE workspace SHALL resolve exactly one version of `fast-check` across all workspace packages.
6. THE workspace SHALL resolve exactly one version of `typescript` across all workspace packages.
7. THE workspace SHALL resolve exactly one version of `react` and exactly one version of `react-dom` across all workspace packages.
8. WHERE two workspace packages previously declared different versions of a shared development tool, THE workspace SHALL adopt the higher of the two versions.
9. THE Biome configuration used by every workspace package SHALL specify an indent width of 2 spaces, a line width of 100, double quotes, and required semicolons.

### Requirement 11: Tailwind v4 Adoption in Bürküt

**User Story:** As a Bürküt developer, I want Tailwind v4 wired to `@ay/tokens`, so that I can render `@ay/ui-library` blocks that depend on Tailwind utilities.

#### Acceptance Criteria

1. THE Bürküt application `package.json` SHALL declare `tailwindcss` at a version satisfying `^4.2.1`.
2. THE Bürküt application `package.json` SHALL declare `d3` at a version satisfying `^7.0.0`.
3. THE Bürküt application Vite configuration SHALL register the Tailwind v4 Vite plugin.
4. THE `@ay/tokens` package SHALL expose its Core Token Tier values as a Tailwind v4 `@theme` declaration.
5. THE Bürküt application SHALL source its Tailwind theme from the `@ay/tokens` `@theme` declaration rather than from a separate Tailwind configuration that restates token values.
6. THE `@ay/ui-library` Storybook SHALL source its Tailwind theme from the `@ay/tokens` `@theme` declaration.
7. WHEN Bürküt renders an `@ay/ui-library` block, THE rendered block SHALL apply the Tailwind utility classes the block declares.
8. IF the Tailwind stylesheet fails to load, THEN THE `@ay/ui-library` blocks SHALL remain readable using their custom-property-based styling.

### Requirement 12: Local Development Against Package Source

**User Story:** As a developer, I want an application to resolve `@ay/*` packages to local source on demand, so that I can iterate on a package without publishing, linking, or copying build output.

#### Acceptance Criteria

1. WHERE the environment variable `AY_LOCAL` equals `1`, THE Bürküt Vite configuration SHALL resolve each `@ay/*` package specifier to that package's `packages/*/src` directory.
2. WHERE the environment variable `AY_LOCAL` is absent or holds a value other than `1`, THE Bürküt Vite configuration SHALL resolve each `@ay/*` package specifier to that package's published entry points.
3. THE Bürküt Vite configuration SHALL declare `resolve.dedupe` containing `react` and `react-dom`.
4. WHILE the Local Dev Alias is active, THE Bürküt application SHALL load exactly one instance of `react` and exactly one instance of `react-dom`.
5. WHEN a developer edits a file under `packages/ui-library/src/` WHILE the Local Dev Alias is active, THE Bürküt dev server SHALL apply the edit without a manual reinstall step.
6. THE workspace documentation SHALL describe the Local Dev Alias as the supported cross-package development workflow.
7. WHEN the documentation update completes, THE `@ay/ui-library` README SHALL contain no instruction to use `npm link` or `yalc`.

### Requirement 13: Bürküt CLI and Vite Plugin Path Integrity

**User Story:** As a Bürküt user, I want `burkut serve` and the content plugin to keep working after the move to `apps/burkut/`, so that the restructure does not break the CLI.

#### Acceptance Criteria

1. WHEN the Bürküt CLI runs from `apps/burkut/`, THE Bürküt CLI SHALL resolve its own package-internal paths relative to the `apps/burkut/` package directory.
2. WHEN the Bürküt CLI receives a target content directory argument, THE Bürküt CLI SHALL resolve that argument relative to the caller's working directory.
3. WHEN the Bürküt content Vite plugin runs from `apps/burkut/`, THE plugin SHALL serve the `virtual:burkut-content` module containing the scanned `ContentGraph`.
4. WHEN a request targets the `/content-assets/` path, THE Bürküt content Vite plugin SHALL serve the requested media file from the scanned content directory.
5. WHEN a request targets an `/api/layouts` endpoint, THE Bürküt application SHALL read from or write to the `.burkut/layouts/` directory of the active content directory.
6. THE Bürküt application `package.json` SHALL declare a `bin` entry whose path resolves to the CLI entry point under the `apps/burkut/` build output.
7. IF a path referenced by the CLI or by the content Vite plugin cannot be resolved, THEN THE Bürküt application SHALL report an error message naming the unresolved path.
8. WHEN a developer runs the Bürküt dev server from the Monorepo Root using the workspace script, THE Bürküt dev server SHALL start without additional path configuration.

### Requirement 14: Continuous Integration Path Updates

**User Story:** As a maintainer, I want both GitHub Actions workflows to keep deploying after the restructure, so that documentation and application deployments do not silently break.

#### Acceptance Criteria

1. THE Storybook documentation workflow SHALL build Storybook from `packages/ui-library/` and publish the result to GitHub Pages.
2. THE Bürküt deployment workflow SHALL build the application from `apps/burkut/` and publish the result to GitHub Pages.
3. THE workflows SHALL install dependencies using pnpm at the Monorepo Root.
4. THE workflows SHALL cache the pnpm store.
5. IF a workflow build step fails, THEN THE workflow SHALL exit with a non-zero status and publish no deployment artifact.
6. THE Bürküt application `package.json` SHALL declare a `homepage` value matching the deployed application URL.

### Requirement 15: Per-Package Kiro Steering with a Single Token Architecture Source

**User Story:** As a developer using Kiro in this workspace, I want steering scoped to each package with no duplicated architecture prose, so that guidance is accurate and has one owner.

#### Acceptance Criteria

1. THE `@ay/ui-library` package SHALL contain a `.kiro/steering/` directory holding the product, structure, tech, component-workflow, and post-implementation steering documents relocated from the former `ay-ui-library/.kiro/steering/`.
2. THE Bürküt application SHALL contain steering documents describing the Bürküt product, structure, and tech stack.
3. WHEN a relocated steering document references a filesystem path, THE relocated steering document SHALL reference the path valid after the restructure.
4. WHEN a steering document references a command, THE referenced command SHALL use pnpm.
5. THE workspace SHALL state the three-tier token architecture, its naming patterns, and its tier ownership rules in exactly one document.
6. WHERE a steering document needs the three-tier token architecture, THE steering document SHALL link to the single authoritative document rather than restate the architecture.
7. THE Monorepo Root SHALL contain steering describing the workspace layout, the package boundaries, and the Local Dev Alias workflow.

### Requirement 16: Quality Gates Green

**User Story:** As a maintainer, I want every Quality Gate passing in both packages and in the application, so that the restructure is provably complete.

#### Acceptance Criteria

1. WHEN the typecheck command runs for `@ay/tokens`, `@ay/ui-library`, and the Bürküt application, THE typecheck SHALL report zero type errors.
2. WHEN the lint command runs for `@ay/tokens`, `@ay/ui-library`, and the Bürküt application, THE lint SHALL report zero diagnostics.
3. WHEN the test command runs for `@ay/ui-library` and the Bürküt application, THE test run SHALL report zero failures.
4. WHEN the build command runs for `@ay/tokens`, `@ay/ui-library`, and the Bürküt application, THE build SHALL exit with a success status.
5. WHEN a developer runs a single workspace-wide script at the Monorepo Root, THE Monorepo Root SHALL execute every Quality Gate for every workspace package.
6. IF any Quality Gate reports a failure, THEN THE workspace-wide script SHALL exit with a non-zero status and report the failing package name.
7. THE test suite SHALL include a check asserting that the Bürküt application declares no Core Token Tier or Semantic Token Tier custom property.

### Requirement 17: Post-Implementation Documentation

**User Story:** As a new contributor, I want documentation that matches the restructured workspace, so that I do not follow instructions describing the previous layout.

#### Acceptance Criteria

1. THE Monorepo Root SHALL contain a `README.md` describing the workspace layout, the package boundaries, the pnpm commands, and the Local Dev Alias workflow.
2. THE `packages/tokens/README.md` SHALL document the token tiers `@ay/tokens` owns, the installation steps, and the CSS and Tailwind consumption paths.
3. THE `packages/ui-library/README.md` SHALL reference the `@ay/ui-library` package name, the `@ay/tokens` dependency, and the pnpm-based development commands.
4. THE `@ay/ui-library` `CHANGELOG.md` SHALL record an entry describing the rename from `ay-ui-library` to `@ay/ui-library` and the extraction of tokens into `@ay/tokens`.
5. THE Bürküt `ROADMAP.md` SHALL record the monorepo restructure as completed work.
6. WHEN the documentation update completes, THE Monorepo Root SHALL contain no `MIGRATION_PLAN.md` file describing the superseded plan.
7. WHEN a document references a source path, a package name, or a package manager command, THE referencing document SHALL use the value valid after the restructure.
