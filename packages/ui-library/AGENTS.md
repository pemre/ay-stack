# `@ay/ui-library`

Reusable React component library built with Vite, TypeScript, Storybook 8, Vitest, and Biome. Components are public product surfaces: keep APIs typed, accessible, documented, and independently testable.

## Component delivery

- Put a component's implementation, tests, stories, and MDX guide together in its feature directory. Every public block needs an interactive `.stories.tsx` story with typed controls for meaningful visual or behavioral inputs and `fn()`-backed callbacks visible in Actions. Use `tags: ["autodocs"]` only when no dedicated MDX page documents that story title.
- Story fixtures must be honest: use local state to show the actual result of callbacks, and document fixture-only state transitions. Add `play` interactions when an action can regress; keep broader behavioral coverage in Vitest.
- MDX explains integration decisions that generated API docs cannot: required host responsibilities, state ownership, accessibility labels, error/empty/loading behavior, and realistic usage. Keep API names and examples synchronized with exports.
- Preserve import-safe public APIs in `src/index.ts`. Do not export app-specific data, copy, or persistence implementations.

## Dashboard engine

`src/dashboard` owns grid mechanics, shell UI, generated schema controls, error isolation, and persistence helpers. The consuming app owns widget definitions, render context, translated labels, instance state, and persistence adapters.

- Widgets must be prop-driven. Do not call host `useTranslation`, `useTheme`, or application stores inside a reusable widget; pass what it needs through `buildProps` and `renderContext`.
- Treat `DashboardGrid` as controlled: it never mutates `instances`. Every layout, duplicate, remove, close, and config callback must be handled by the host and documented in the playground.
- A built-in config panel requires `optionsSchema`, `onUpdateInstanceConfig`, and `getConfigPanelLabels`. Schema changes need validator and generated-control coverage.
- Retain unknown-widget, error, empty, and lazy-loading fallbacks. These are resilience features, not optional decoration.
- Keep persistence/migration and BroadcastChannel behavior unit/property tested; visual stories demonstrate UI behavior only.

## Validation

For UI-library changes, run `pnpm --filter @ay/ui-library typecheck`, `lint`, `test`, and `build`. For story or MDX changes, also run `pnpm --filter @ay/ui-library build-storybook` to compile documentation.


