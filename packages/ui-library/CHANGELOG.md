# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0]

### Changed

- **Renamed from `ay-ui-library` to `@ay/ui-library`.** The package now publishes
  under the `@ay` scope with `publishConfig.access: "public"`. Update imports:
  `import { SpiralTimeline } from "@ay/ui-library"` and
  `import "@ay/ui-library/styles.css"`. The unscoped `ay-ui-library` package is
  deprecated on npm and names this package as its replacement. No public API
  changed — the same two blocks and the same exported types.
- The package moved into the [ay-stack](https://github.com/pemre/ay-stack)
  workspace at `packages/ui-library/`. Development commands run through pnpm
  (`pnpm --filter @ay/ui-library test`), tool versions come from the workspace
  catalog, and `biome.json` extends the workspace configuration.
- Storybook now deploys through the workspace's single Pages workflow and is served
  at https://pemre.github.io/ay-stack/ instead of the old per-repository URL.
- `dist/style.css` carries component CSS only. Design tokens ship separately, so a
  consumer imports both the library stylesheet and the token stylesheet.

### Added

- `@ay/ui-library` as a dependency: the core and semantic token tiers were extracted
  into their own publishable package, which is now the single source of truth for
  the shared design language. Token tiers, naming, and ownership rules are
  documented once, in `@ay/ui-library`'s `TOKEN-ARCHITECTURE.md`.
- Static checks that keep the tier boundaries honest: block CSS may not reference a
  core token, and token imports must use the `@ay/ui-library` package specifier rather
  than a relative path.
- Storybook's Vite `base` is configurable through `STORYBOOK_BASE`, defaulting to
  `/` for local runs, which is what lets CI publish it under a subpath.

### Removed

- Removed `src/styles/tokens.css` — every core and semantic token it declared now
  lives in `@ay/ui-library`, and Storybook sources them through
  `@import "@ay/ui-library/theme.css"`. Computed values are unchanged in both themes.
- Package-linking instructions. Cross-package development uses the workspace's
  Local Dev Alias (`AY_LOCAL=1`), which resolves `@ay/*` to package source while
  keeping a single React instance.

### Fixed

- `SpiralTimeline.css` no longer reaches into the core tier. The six core values it
  read directly (`--radius-lg`, `--space-4`, `--space-2`, `--font-size-sm`,
  `--font-size-xs`, `--duration-fast`) are now `--spiral-*` component tokens
  carrying their original literal fallbacks, so rendered output is unchanged.

## [0.4.1] — 2026-03-12

### Fixed

- GitHub Actions workflow (`deploy-docs.yml`) updated from old Ladle build (`npm run build-docs` → `./docs`) to Storybook build (`npm run build-storybook` → `./storybook-static`). The live demo at https://pemre.github.io/ay-ui-library/ now deploys the current Storybook site.
- Upgraded `actions/upload-pages-artifact` to v3 and `actions/deploy-pages` to v4.
- Workflow now uses `npm ci` with npm cache for faster, reproducible installs.

### Changed

- README.md now features a prominent link to the live Storybook demo and documents the automatic GitHub Pages deployment.

## [0.4.0] — 2026-03-12

### Added

- `TimeWindowConfig` — new config sub-object for the time window slider with `visible`, `animationEnabled`, and `animationDuration` fields.
- Hideable time window slider via `config.timeWindow.visible` (default: `true`).
- Animated slider indicator — the draggable window smoothly transitions left/right when position changes, controlled by `timeWindow.animationEnabled` and `timeWindow.animationDuration`.
- Controlled `yearsToShow` — new `onYearsToShowChange` callback prop enables parent components to control the zoom level externally. The component syncs internal state when `config.yearsToShow` changes.
- Semi-transparent fill (~50% opacity) on data node shapes for easier hover detection.
- Storybook controls for all new `timeWindow.*` fields under a "Time Window" category.
- Controlled `windowStart` prop — consumers can now set the visible year range externally. When provided, the component uses this value instead of internal state.
- `onWindowStartChange` callback prop — invoked whenever the window start changes (scroll, slider drag, click), enabling two-way binding for controlled mode.
- Mouse wheel scroll on the time window slider — scrolling over the slider shifts the window ±1 year, matching the spiral view behavior.
- Storybook `windowStart` number control — type a year to jump the spiral to that range.
- `PerformanceStress` Storybook story for SpiralTimeline — renders a large synthetic dataset (100–2000 nodes) with an FPS overlay to surface rendering bottlenecks.
- `generateStressData` utility function — pure data generator producing `DataNode[]` arrays of arbitrary size with uniformly distributed dates.
- `FpsOverlay` component — real-time FPS counter using `requestAnimationFrame` sampling, displayed as a fixed overlay.
- Storybook `nodeCount` range control (100–2000, step 100) for interactive performance profiling.
- Performance guidance in story docs describing 60/30/15 FPS thresholds.
- Property-based tests (fast-check) for data generator correctness: output length, date range, valid fields, determinism, and rendered count.

### Changed

- Mouse wheel over the spiral now scrolls the timeline window (shifts `windowStart` ±1 year) instead of changing the zoom level. Zoom remains available via ZoomControls buttons/slider.
- Locale changes now immediately update month labels without requiring a component remount.

### Removed

- Redundant text from the time window slider: "Time Window" title, ring summary, total data years, and year range header text. The draggable window indicator, tick marks, tick labels, and range label are retained.

### Fixed

- Layout shift when hiding the time window slider — the spiral SVG now properly fills the available space via `min-height: 0` on the flex container, and the ResizeObserver now tracks both width and height changes so the spiral re-renders to fill the available space when the slider is toggled.
- Storybook `argsToProps` mapping verified to correctly pass `locale` and `className` without transformation loss.

## [0.3.0] — 2026-03-11

### Added

- `ImageZoom` block component — mouse-tracking zoom-on-hover for images with configurable zoom levels (1.5×, 2×, 2.5×, 3×) and transition duration.
- Hybrid styling approach: Tailwind utility classes for layout and transforms, CSS custom property tokens for theming.
- Placeholder state when no image source is provided.
- Error fallback state displaying alt text when image fails to load.
- Accessibility: required `alt` prop, decorative image support via empty `alt` with `role="img"`.
- Custom `className` and `imageClassName` pass-through props.
- Property-based tests (fast-check) and unit tests for ImageZoom.
- Storybook stories with interactive controls and MDX documentation page.
- `tailwindcss` added as a peer dependency (`^4.2.1`).

### Changed

- Updated library description from "D3-powered visualization components" to "visualization and interactive components" to reflect the broader scope.

## [0.2.0] — 2026-03-11

### Added

- `SpiralTimeline` block component — D3-powered spiral timeline visualization for React.
- Archimedean spiral geometry engine with one ring per calendar year and January at 12 o'clock.
- Configurable zoom controls (buttons, slider, mouse wheel).
- Draggable time-window slider for panning across the full date range.
- Fog/depth effect with configurable start ring and intensity.
- Ring color gradients using D3 interpolators (spectral, rainbow, cool, warm).
- Five data-node shapes: circle, square, triangle, star, pentagon.
- Animated transitions for spiral segments, year markers, and data nodes.
- Tooltip on hover with title, content summary, and locale-formatted date.
- Keyboard accessibility: data nodes support Enter/Space activation.
- Three-tier CSS custom property theming (core → semantic → component) with light/dark support.
- Locale-aware month labels and date formatting via `Intl.DateTimeFormat`.
- Responsive sizing via debounced `ResizeObserver`.
- Storybook stories with interactive controls, autodocs, and interaction tests.
- MDX documentation page for the Storybook UI.
- Property-based tests (fast-check) and unit tests (Vitest + Testing Library).
- Vite library mode build producing ESM, CJS, TypeScript declarations, and extracted CSS.

## [0.1.0] — 2024-05-07

### Added

- Initial project scaffolding with Vite library mode, Storybook, Vitest, and Biome.
