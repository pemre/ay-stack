# Implementation Plan: D3 Spiral Timeline Widget (ay-ui-library)

## Overview

Build the `ay-ui-library` standalone npm package from scratch, implementing the `SpiralTimeline` block component with full TypeScript interfaces, D3 geometry engine, interactive controls, Storybook stories, property-based tests, and open-source-quality documentation. All work happens in the `ay-ui-library/` directory, completely independent from the Bürküt app.

## Tasks

- [x] 1. Scaffold the ay-ui-library package project
  - [x] 1.1 Create the `ay-ui-library/` directory with `package.json` defining name, version, entry points (`main`, `module`, `types`), peer dependencies (react, react-dom, d3), and npm scripts (dev, build, test, lint, storybook, build-storybook)
    - Include `"files": ["dist"]` for npm publish
    - _Requirements: 1.1, 1.4, 1.5, 1.7_
  - [x] 1.2 Create `tsconfig.json` with TypeScript strict mode, React JSX, ES2020 target, and declaration file generation (`.d.ts`)
    - _Requirements: 1.2_
  - [x] 1.3 Create `vite.config.ts` in Vite library mode with entry `src/index.ts`, ESM + CJS output, externalized react/react-dom/d3, CSS extraction, and `vite-plugin-dts` for type declarations
    - _Requirements: 1.5_
  - [x] 1.4 Create `biome.json` with 2-space indent, 100 line width, double quotes, semicolons, and the same lint rules as the Bürküt project
    - _Requirements: 1.4_
  - [x] 1.5 Create the directory structure: `src/blocks/SpiralTimeline/`, `src/styles/`, `.storybook/`, `.kiro/steering/`
    - _Requirements: 2.1_
  - [x] 1.6 Install dependencies: react, react-dom, d3, typescript, vite, vite-plugin-dts, vitest, @testing-library/react, @testing-library/jest-dom, jsdom, fast-check, @storybook/react-vite, @storybook/addon-essentials, @storybook/test, biome
    - _Requirements: 1.1, 1.4_

- [x] 2. Set up Storybook configuration
  - [x] 2.1 Create `.storybook/main.ts` that discovers story files from `src/blocks/**/*.stories.tsx` and configures the React-Vite framework with autodocs
    - _Requirements: 1.3, 13.8_
  - [x] 2.2 Create `.storybook/preview.ts` that imports `../src/styles/tokens.css`, configures viewport presets, and sets up light/dark theme decorators via `data-theme` attribute
    - _Requirements: 1.3, 10.4_
  - [x] 2.3 Create `.storybook/preview-head.html` to inject token CSS into the Storybook iframe if needed
    - _Requirements: 1.3, 10.4_

- [x] 3. Implement design tokens
  - [x] 3.1 Create `src/styles/tokens.css` with core tokens (color palette, spacing, radius, typography) and semantic tokens (`:root` light defaults + `[data-theme="dark"]` overrides) mirroring the Bürküt three-tier architecture
    - Include `--color-bg-body`, `--color-bg-surface`, `--color-text-primary`, `--color-text-secondary`, `--color-primary`, `--color-border-default` and other semantic tokens
    - _Requirements: 10.1, 10.2, 10.4_

- [x] 4. Define TypeScript interfaces and defaults
  - [x] 4.1 Create `src/blocks/SpiralTimeline/types.ts` with all interfaces: `DataNode`, `TypeConfig`, `NodeShape`, `ZoomConfig`, `FogConfig`, `RingGradientConfig`, `ColorScale`, `GradientTarget`, `AnimationConfig`, `YearLabelPosition`, `SpiralTimelineLabels`, `SpiralTimelineConfig`, `SpiralTimelineProps`
    - _Requirements: 3.1, 3.2, 4.1–4.8, 14.1–14.3_
  - [x] 4.2 Create `src/blocks/SpiralTimeline/defaults.ts` with the `DEFAULT_CONFIG` constant providing sensible defaults for all config fields
    - _Requirements: 3.3, 4.1–4.7_

- [x] 5. Implement the geometry engine
  - [x] 5.1 Create `src/blocks/SpiralTimeline/geometry.ts` with pure functions: `dateToSpiral(date, oldestYear, radiusIncrement)` → `{ x, y, angle, radius }`, `yearMarkerPos(year, position, ...)`, `spiralPointAt(absYear, ...)`, `yearLabelPositionToAngle(position)`, and `computeMaxRadius(width, height)`
    - Implement the Archimedean spiral formula: angle = −π/2 − (yearDiff + dayOfYear/365) × 2π, radius = (yearDiff + dayOfYear/365) × radiusIncrement
    - January at 12-o'clock (−π/2), one full rotation per year
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 12.1_
  - [x] 5.2 Write property tests for geometry engine (`geometry.test.ts`)
    - **Property 2: Angle mapping — January at 12 o'clock, one year per rotation**
    - **Validates: Requirement 5.1**
  - [x] 5.3 Write property test for radial distance monotonicity
    - **Property 3: Radial distance monotonicity — more recent dates closer to center**
    - **Validates: Requirement 5.2**
  - [x] 5.4 Write property test for year label position angle mapping
    - **Property 4: Year label position angle mapping — all 8 positions map to correct radians**
    - **Validates: Requirements 4.2, 5.5**
  - [x] 5.5 Write property test for responsive radius computation
    - **Property 13: Responsive radius — maxRadius = min(w, h) × 0.4**
    - **Validates: Requirement 12.1**

- [x] 6. Implement color utilities
  - [x] 6.1 Create `src/blocks/SpiralTimeline/colors.ts` with functions: `getColorInterpolator(scale: ColorScale)`, `getYearColor(offset, interpolator)`, `getSeasonColor(monthIndex)`, and `computeFogOpacity(ringIndex, fogConfig)`
    - Map ColorScale values to D3 interpolators (spectral → d3.interpolateSpectral, etc.)
    - Season colors: winter-blue, spring-yellow/green, summer-green, autumn-orange
    - _Requirements: 5.6, 9.1–9.4_
  - [x] 6.2 Write property tests for color utilities (`colors.test.ts`)
    - **Property 11: Ring gradient color interpolation — getYearColor matches D3 interpolator at (offset % 10) / 10**
    - **Validates: Requirements 9.2, 9.3**
  - [x] 6.3 Write property test for fog opacity scaling
    - **Property 10: Fog opacity scaling — rings ≤ startRing have opacity 1, rings beyond decrease proportionally; fog disabled → uniform opacity**
    - **Validates: Requirements 9.1, 9.4**

- [x] 7. Implement shape utilities
  - [x] 7.1 Create `src/blocks/SpiralTimeline/shapes.ts` with `drawShape(selection, shape: NodeShape, size, color)` that appends the correct SVG element (circle, rect, polygon) for each of the 5 shapes: circle, square, triangle, star, pentagon
    - _Requirements: 4.7_
  - [x] 7.2 Write unit tests for shape utilities (`shapes.test.ts`) verifying each shape type produces the correct SVG element and attributes
    - _Requirements: 4.7_

- [x] 8. Checkpoint — Verify utility modules
  - Ensure all tests pass (`npm test`), type-check passes (`npx tsc --noEmit`), and lint passes (`npx biome check src`). Ask the user if questions arise.

- [x] 9. Implement the main SpiralTimeline component
  - [x] 9.1 Create `src/blocks/SpiralTimeline/SpiralTimeline.css` with component-level CSS custom properties (`--spiral-bg`, `--spiral-tooltip-bg`, etc.) mapped to semantic tokens, plus layout styles for the container, SVG, tooltip, and controls
    - _Requirements: 10.1, 10.3_
  - [x] 9.2 Create `src/blocks/SpiralTimeline/SpiralTimeline.tsx` implementing the main component:
    - Merge user config with DEFAULT_CONFIG via shallow per-sub-object merge
    - Manage internal state: `yearsToShow`, `windowStart`, `hoveredNode`, `tooltipPos`
    - Create persistent SVG layer groups on mount (`layer-season-bg`, `layer-radial-lines`, `layer-spiral`, `layer-year-markers`, `layer-month-labels`, `layer-data-nodes`)
    - Render seasonal background wedges with radial gradient opacity
    - Render 12 radial month grid lines with gradient opacity
    - Render spiral path segments using D3 data joins with enter/update/exit transitions
    - Render year marker dots and labels at configured `yearLabelPosition`
    - Render month labels at outer edge using locale-aware `Intl.DateTimeFormat`
    - Render data nodes with correct shape/color from type config, with `role="button"`, `tabindex="0"`, `aria-label`
    - Handle hover → show tooltip, unhover → hide tooltip, click → invoke `onNodeClick`
    - Handle keyboard: Enter/Space on focused data node triggers `onNodeClick`
    - Attach mouse wheel zoom handler (when `zoom.mouseWheel` is true)
    - Attach debounced ResizeObserver (200ms) for responsive sizing
    - Filter invalid dates with console.warn in dev mode
    - Clean up all D3 selections, ResizeObserver, and event listeners on unmount
    - Hide zoom controls when container width < 300px
    - _Requirements: 3.1–3.6, 4.1–4.8, 5.1–5.7, 8.1–8.4, 9.1–9.4, 10.1–10.3, 11.1–11.4, 12.1–12.4_

- [x] 10. Implement the TimeWindowSlider sub-component
  - [x] 10.1 Create `src/blocks/SpiralTimeline/TimeWindowSlider.tsx` as a controlled component:
    - Accept props: `dataMinYear`, `dataMaxYear`, `yearsToShow`, `windowStart`, `labels`, `onWindowStartChange`
    - Render horizontal track with year tick marks and labels
    - Render draggable window indicator with proportional width = `(yearsToShow / totalDataYears) × 100%`
    - Handle mouse drag on the window indicator (mousedown → mousemove → mouseup on document)
    - Handle click on track outside indicator → center window on clicked position
    - Display current range label (`{start}–{end}`) inside the indicator
    - Display summary info (ring count, total data years) below the track
    - Scale track width to fill container width minus padding
    - _Requirements: 6.1–6.6, 12.3_

- [x] 11. Implement the ZoomControls sub-component
  - [x] 11.1 Create `src/blocks/SpiralTimeline/ZoomControls.tsx` as a controlled component:
    - Accept props: `yearsToShow`, `totalDataYears`, `zoomConfig`, `labels`, `onYearsToShowChange`
    - Conditionally render +/− buttons (when `zoom.buttons` is true) that adjust yearsToShow by 1, clamped between 1 and totalDataYears
    - Conditionally render range slider (when `zoom.slider` is true) that sets yearsToShow directly
    - Display current zoom value using the labels template
    - _Requirements: 7.1–7.4_

- [x] 12. Checkpoint — Verify core component renders
  - Ensure all tests pass, type-check passes, lint passes, and the component renders in Storybook. Ask the user if questions arise.

- [x] 13. Write component-level tests
  - [x] 13.1 Write property test for valid input producing complete SVG structure (`SpiralTimeline.test.tsx`)
    - **Property 1: Valid input produces complete SVG structure — all 6 layer groups present**
    - **Validates: Requirements 3.1, 3.2, 3.4**
  - [x] 13.2 Write property test for node click callback
    - **Property 5: Node click callback receives correct data — clicking a node invokes onNodeClick with the original DataNode**
    - **Validates: Requirements 4.8, 8.3**
  - [x] 13.3 Write property test for time window slider proportional width and label
    - **Property 6: Time window slider proportional width = (yearsToShow / totalDataYears) × 100, correct range label**
    - **Validates: Requirements 6.2, 6.5**
  - [x] 13.4 Write property test for zoom clamping invariant
    - **Property 7: Zoom clamping — 1 ≤ yearsToShow ≤ totalDataYears, windowStart within valid range after every operation**
    - **Validates: Requirements 7.1, 7.4**
  - [x] 13.5 Write property test for tooltip content on hover
    - **Property 8: Tooltip displays node title, content, and locale-formatted date on hover**
    - **Validates: Requirement 8.1**
  - [x] 13.6 Write property test for data node accessibility attributes
    - **Property 9: Data node ARIA — role="button", tabindex="0", aria-label with title and formatted date**
    - **Validates: Requirement 8.4**
  - [x] 13.7 Write property test for locale-aware month labels
    - **Property 12: Locale-aware month labels match Intl.DateTimeFormat output for the given locale**
    - **Validates: Requirements 11.1, 11.4**
  - [x] 13.8 Write unit tests for edge cases: empty data array, single data point, all dates in same year, invalid dates filtered, missing type config fallback, zero-size container skip, unmount cleanup
    - _Requirements: 3.1, 3.3, 3.6_

- [x] 14. Create barrel export
  - [x] 14.1 Create `src/index.ts` that re-exports `SpiralTimeline` component and all public types (`DataNode`, `SpiralTimelineConfig`, `SpiralTimelineProps`, `TypeConfig`, `NodeShape`, `ZoomConfig`, `FogConfig`, `RingGradientConfig`, `ColorScale`, `AnimationConfig`, `YearLabelPosition`, `SpiralTimelineLabels`) from the package
    - _Requirements: 2.4, 14.4_

- [x] 15. Checkpoint — Full test suite and build verification
  - Run `npx tsc --noEmit` (zero type errors), `npx biome check src` (zero diagnostics), `npm test` (all tests pass), `npm run build` (produces `dist/index.es.js`, `dist/index.cjs.js`, `dist/index.d.ts`, `dist/style.css`). Ask the user if questions arise.

- [x] 16. Create Storybook stories with interactive controls
  - [x] 16.1 Create `src/blocks/SpiralTimeline/SpiralTimeline.stories.tsx` with:
    - Default story with sample data and default config, using Storybook args for all Config fields
    - ArgTypes exposing controls for every Config field including nested fields (zoom.mouseWheel, fog.enabled, fog.startRing, fog.intensity, ringGradient.scale, ringGradient.applyTo, animations.enabled, animations.duration, yearLabelPosition, yearsToShow, etc.)
    - Story demonstrating each data-node shape (circle, square, triangle, star, pentagon)
    - Story demonstrating theme switching (light/dark) via decorator
    - Story demonstrating responsive behavior at different container sizes
    - Story with empty data array for empty-state rendering
    - Autodocs enabled via `tags: ["autodocs"]`
    - _Requirements: 13.1–13.6, 13.8_
  - [x] 16.2 Add interaction tests (play functions using `@storybook/test`) verifying tooltip display on hover, zoom button clicks, and time-window slider drag
    - _Requirements: 13.7_

- [-] 17. Create MDX documentation page
  - [x] 17.1 Create `src/blocks/SpiralTimeline/SpiralTimeline.mdx` with usage guide, configuration examples, theming instructions, and data format documentation for the Storybook UI
    - _Requirements: 13.9, 15.7_

- [ ] 18. Write component README
  - [ ] 18.1 Create `src/blocks/SpiralTimeline/README.md` with: feature overview, visual description, installation/setup (npm install + npm link), minimal usage example, complete API reference table (every prop with type, default, description), configuration reference (every Config field), Data Format section with DataNode examples, Theming section (three-tier tokens, CSS custom property overrides), Contributing section, and link to Storybook
    - _Requirements: 15.1–15.7_

- [x] 19. Write package-level documentation
  - [x] 19.1 Create `ay-ui-library/README.md` with: project title ("🌜 Ay UI Library"), tagline, badge section (build, npm, license), Philosophy & Design Principles, Quick Start (npm install + npm link workflow), Components listing with import examples, Theming & Design Tokens (three-tier architecture), Contributing section (dev setup, PR process, coding standards, testing, Storybook conventions), Available Scripts section, Changelog link, and License section
    - _Requirements: 16.1–16.9_
  - [x] 19.2 Create `ay-ui-library/CHANGELOG.md` with semantic versioning policy and initial v0.1.0 entry
    - _Requirements: 16.7_
  - [x] 19.3 Create `ay-ui-library/LICENSE` with the chosen open-source license (MIT)
    - _Requirements: 16.8_

- [x] 20. Create Kiro steering documents
  - [x] 20.1 Create `ay-ui-library/.kiro/steering/tech.md` documenting: tech stack (TypeScript, React 18, D3 v7, Vite library mode, Storybook, Vitest, fast-check, Biome), all build/dev commands, quality gate commands, TypeScript config, Biome config, CSS custom property token architecture
    - _Requirements: 17.2_
  - [x] 20.2 Create `ay-ui-library/.kiro/steering/structure.md` documenting: directory layout (`src/blocks/`, `.storybook/`, `dist/`, `.kiro/steering/`), file co-location conventions (`.tsx`, `.css`, `.test.tsx`, `.stories.tsx`), barrel export pattern, naming conventions
    - _Requirements: 17.3_
  - [x] 20.3 Create `ay-ui-library/.kiro/steering/product.md` documenting: library purpose, relationship to Bürküt, Block component model, npm publishing and npm link workflows, design philosophy
    - _Requirements: 17.4_
  - [x] 20.4 Create `ay-ui-library/.kiro/steering/component-workflow.md` documenting: step-by-step process for adding a new Block (file scaffolding, CSS custom property patterns, Vitest tests with Testing Library, Storybook stories with args/controls/autodocs/play functions, barrel export update)
    - _Requirements: 17.5_

- [x] 21. Build pipeline and npm link verification
  - [x] 21.1 Run `npm run build` and verify output: `dist/index.es.js`, `dist/index.cjs.js`, `dist/index.d.ts`, `dist/style.css` all exist with correct content
    - _Requirements: 1.5, 1.7_
  - [x] 21.2 Verify `npm link` workflow: run `npm link` in `ay-ui-library/`, then `npm link ay-ui-library` in the Bürküt project, and confirm `import { SpiralTimeline } from "ay-ui-library"` resolves correctly
    - _Requirements: 1.6_

- [x] 22. Final checkpoint — All quality gates pass
  - Run all quality gates: `npx tsc --noEmit` (zero type errors), `npx biome check src` (zero diagnostics), `npm test` (all tests pass), `npm run build` (succeeds). Ensure Storybook builds with `npm run build-storybook`. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- All implementation happens in the `ay-ui-library/` directory — zero coupling to Bürküt
- The existing `d3-timeline.html` prototype serves as the reference implementation for spiral math and rendering logic
- Property tests use fast-check and reference correctness properties from the design document
- Checkpoints at tasks 8, 12, 15, and 22 ensure incremental validation
