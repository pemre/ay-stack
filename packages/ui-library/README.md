# 🌜 @ay/ui-library

Reusable visualization and interactive components for React.

[![Build](https://img.shields.io/github/actions/workflow/status/pemre/ay-stack/deploy-pages.yml?branch=main)](https://github.com/pemre/ay-stack/actions)
[![npm](https://img.shields.io/npm/v/@ay/ui-library)](https://www.npmjs.com/package/@ay/ui-library)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

📖 **[Live Storybook Demo](https://pemre.github.io/ay-stack/)** — Interactive examples, API docs, and theme playground.

Published as `@ay/ui-library`. Versions up to 0.4.1 were published under the
unscoped name `ay-ui-library`, which is deprecated; see [CHANGELOG.md](./CHANGELOG.md).

---

## Philosophy & Design Principles

- **Standalone package** — Zero coupling to any consuming app. Data, callbacks, and locale are passed via props.
- **D3 for math, React owns the DOM** — D3-powered components use D3 for scales, color interpolators, geometry, and data joins inside a single `<svg>`. It never creates DOM outside the SVG element.
- **Tokens live in one package** — theming runs on CSS custom properties from [`@ay/tokens`](../tokens/README.md), a dependency of this package. Theme switching is a `data-theme` attribute or a variable override.
- **Blocks architecture** — Each component lives in `src/blocks/{Name}/` with co-located `.tsx`, `.css`, `.test.tsx`, and `.stories.tsx` files. A barrel `src/index.ts` re-exports the public API.
- **Property-based testing** — Correctness properties are encoded as executable tests using fast-check, complemented by unit tests with Vitest and Testing Library.

---

## Quick Start

### Install

```bash
pnpm add @ay/ui-library @ay/tokens
```

React, ReactDOM, D3, and Tailwind CSS are peer dependencies — your project owns
those versions. `@ay/tokens` is a real dependency and installs with the library;
listing it explicitly is worthwhile because you import its stylesheet directly.

Import the component, the library's styles, and the design tokens:

```tsx
import { SpiralTimeline } from "@ay/ui-library";
import "@ay/ui-library/styles.css";
import "@ay/tokens";
```

With Tailwind v4, source the theme from the token package instead:

```css
@import "tailwindcss";
@import "@ay/tokens/theme.css";
```

Tailwind first, so the token block extends the default theme rather than being
overridden by it.

### Local development inside the workspace

Set `AY_LOCAL=1` when running a consuming app and Vite resolves `@ay/*` to package
source, so edits under `packages/ui-library/src/` arrive through HMR:

```bash
AY_LOCAL=1 pnpm dev      # from the workspace root
```

No linking, publishing, or copying build output is involved. See the root
[README](../../README.md#local-dev-alias--the-cross-package-workflow) for why the
alias is the supported path and what it replaces.

---

## Components

### SpiralTimeline

A D3-powered spiral timeline visualization where each concentric ring represents one calendar year, months are arranged as radial sectors, and data nodes are plotted at their calendar positions. Supports configurable zoom, fog, ring gradients, animations, custom shapes, a hideable time-window slider with animated transitions, and full theme/locale customization.

```tsx
import { SpiralTimeline } from "@ay/ui-library";
import type { DataNode, SpiralTimelineConfig } from "@ay/ui-library";

const data: DataNode[] = [
  { date: new Date("2024-03-15"), type: "event", title: "Equinox", content: "Spring begins" },
  { date: new Date("2023-07-04"), type: "event", title: "Midyear", content: "Summer peak" },
];

const config: SpiralTimelineConfig = {
  yearsToShow: 3,
  yearLabelPosition: "top-right",
  fog: { enabled: true, startRing: 2, intensity: 0.6 },
  timeWindow: { visible: true, animationEnabled: true, animationDuration: 400 },
};

function App() {
  const [windowStart, setWindowStart] = useState(2023);

  return (
    <SpiralTimeline
      data={data}
      config={config}
      locale="en"
      windowStart={windowStart}
      onWindowStartChange={setWindowStart}
      onYearsToShowChange={(years) => console.log("Zoom:", years)}
    />
  );
}
```

See the [Storybook demo](https://pemre.github.io/ay-stack/) for interactive examples and full API documentation.

#### Performance Stress Test

The `PerformanceStress` story renders SpiralTimeline with a large synthetic dataset (100–2000 nodes) and an FPS overlay to help identify rendering bottlenecks. Open it in Storybook and adjust the node count slider to find the threshold where performance degrades on your device.

### ImageZoom

A mouse-tracking zoom-on-hover component for images. Users hover over an image and the cursor position is tracked as a percentage of the image dimensions — the image scales up around that point, letting users inspect detail without navigating away.

- Configurable zoom levels: 1.5×, 2×, 2.5×, 3×
- Configurable transition duration
- Placeholder and error fallback states
- Accessible: required `alt` prop, decorative image support via empty `alt`
- Hybrid styling: Tailwind utilities for layout/transforms + CSS custom property tokens for theming

> **Note:** ImageZoom requires `tailwindcss` as a peer dependency. Your consuming project must have Tailwind CSS configured for the hover-zoom and layout utilities to take effect.

```tsx
import { ImageZoom } from "@ay/ui-library";
import "@ay/ui-library/styles.css";
import type { ImageZoomConfig } from "@ay/ui-library";

const config: ImageZoomConfig = {
  zoomLevel: 2.5,
  transitionDuration: 400,
};

function App() {
  return (
    <ImageZoom
      src="/photos/landscape.jpg"
      alt="Mountain landscape at sunset"
      config={config}
      className="my-custom-container"
    />
  );
}
```

See the [ImageZoom stories](https://pemre.github.io/ay-stack/) in the live Storybook for interactive examples.

---

## Theming & Design Tokens

Token tiers, naming patterns, and tier ownership rules are stated in one place:
[`packages/tokens/TOKEN-ARCHITECTURE.md`](../tokens/TOKEN-ARCHITECTURE.md).

This package declares no core or semantic token. Both tiers come from `@ay/tokens`;
block CSS consumes semantic tokens and declares its own component tokens
(`--spiral-*`, `--image-zoom-*`) in the block's `.css` file.

### Theme switching

Set the `data-theme` attribute on any ancestor element:

```html
<div data-theme="dark">
  <SpiralTimeline data={data} />
</div>
```

### Overriding component tokens

Target the component class to override its tokens without touching the semantic layer:

```css
.my-wrapper .spiral-timeline {
  --spiral-primary: hotpink;
  --spiral-tooltip-bg: #1a1a2e;
}
```

---

## Contributing

### Development setup

The package lives in the [ay-stack](../../README.md) workspace. Clone the workspace,
not the package:

```bash
git clone https://github.com/pemre/ay-stack.git
cd ay-stack
pnpm install
pnpm storybook       # Storybook on http://localhost:6006
```

If `packages/tokens/dist/` is cold, build the dependency first — Storybook's
stylesheet imports `@ay/tokens/theme.css`:

```bash
pnpm --filter "@ay/ui-library^..." build
```

### Coding standards

- **TypeScript** — Strict mode enabled. All public APIs must have JSDoc comments.
- **Linting & formatting** — Biome with 2-space indent, 100 line width, double quotes, semicolons. `biome.json` extends the workspace configuration at the root.
- **CSS** — Plain CSS with custom properties. No CSS-in-JS. Blocks consume semantic tokens; never reference core tokens directly.
- **File co-location** — Each block has `.tsx`, `.css`, `.test.tsx`, and `.stories.tsx` in the same directory.

### Testing

- **Vitest** + **Testing Library** for unit and integration tests.
- **fast-check** for property-based tests encoding correctness properties.
- Run tests: `pnpm --filter @ay/ui-library test`
- All tests must pass before merge.

### Storybook conventions

- Every block must have a `.stories.tsx` with interactive controls via `argTypes`.
- Enable `tags: ["autodocs"]` for automatic API documentation.
- Add interaction tests via `play` functions using `@storybook/test`.
- Include an MDX documentation page for usage guides and configuration examples.

### PR process

1. Create a feature branch from `main`.
2. Implement changes with tests and stories.
3. Ensure all quality gates pass (see below).
4. Open a PR with a clear description of changes.

---

## Available Scripts

Run from the workspace root with `pnpm --filter @ay/ui-library <script>`, or as
plain `pnpm <script>` inside `packages/ui-library/`.

| Script | Description |
|--------|-------------|
| `dev` | Start Storybook dev server on port 6006 |
| `build` | Build the library (Vite library mode → `dist/`) |
| `test` | Run all tests (single pass) |
| `test:watch` | Run tests in watch mode |
| `typecheck` | Type-check with `tsc --noEmit` |
| `lint` | Lint source with Biome |
| `lint:fix` | Auto-fix lint issues |
| `format` | Format source with Biome |
| `storybook` | Start Storybook dev server |
| `build-storybook` | Build static Storybook site |

### Storybook deployment

Storybook is built and deployed to [GitHub Pages](https://pemre.github.io/ay-stack/)
on every push to `main` by the workspace's single workflow,
`.github/workflows/deploy-pages.yml`. It occupies the site root; Bürküt is
assembled into `/burkut/` in the same run, so one deploy publishes both.

### Quality gates (must all pass before merge)

```bash
pnpm --filter @ay/ui-library typecheck   # zero type errors
pnpm --filter @ay/ui-library lint        # zero diagnostics
pnpm --filter @ay/ui-library test        # all tests pass
pnpm --filter @ay/ui-library build       # production build succeeds
```

`pnpm verify` at the workspace root runs the same gates for every package.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a record of notable changes per release. This project follows [Semantic Versioning](https://semver.org/).

---

## License

[MIT](./LICENSE) © Ay UI Library Contributors
