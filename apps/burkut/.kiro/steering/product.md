# Product: Bürküt — Content Visualizer

Bürküt is a CLI-driven content visualization tool. Run `burkut serve <directory>`
to scan any local directory for content files (markdown, images, video, audio),
extract dates from filenames, folder names, and frontmatter, and serve an
interactive daily-stream UI on localhost via Vite.

- Dates are extracted using a priority chain: frontmatter `date` → filename
  `YYYY-MM-DD` prefix → parent folder prefix
- Content is grouped by date into day buckets and displayed newest-first
- HMR support: adding, editing, or deleting files in the target directory updates
  the UI live
- Optional per-directory configuration via `.burkut/config.ts`

## Place in the workspace

Bürküt lives at `apps/burkut/` in the `ay-stack` pnpm monorepo. It is
`"private": true` — it is not published to npm from here — but it keeps its
publishable shape (`bin`, `files`) because the app is destined for its own
repository in a later phase. Nothing in `packages/` may import from Bürküt; the
dependency direction is one-way.

It consumes two workspace packages:

| Dependency | What Bürküt gets |
|------------|------------------|
| `@ay/ui-library` | the shared design language, as CSS and as the Tailwind v4 theme |
| `@ay/ui-library` | the `SpiralTimeline` and `ImageZoom` blocks |

Token tiers, naming patterns, and tier ownership rules:
#[[file:packages/ui-library/TOKEN-ARCHITECTURE.md]]

The deployed app is served from the shared Pages site at
https://pemre.github.io/ay-stack/burkut/ — Storybook occupies the site root.

## Key Concepts

- In CLI mode, `vite-plugins/burkut-content.ts` scans the user's directory and
  serves a `ContentGraph` as `virtual:burkut-content`.
- For repo-local runs (`pnpm dev`, `pnpm build`) the same plugin is registered from
  `vite.config.ts` and reads `BURKUT_CONTENT_DIR`, resolved against the caller's
  working directory. Without it the app starts on an empty graph and says so on
  stdout, so a blank UI is explained rather than mysterious.
- Feature flags in `src/config.ts` control optional capabilities (search,
  dark/light toggle, draggable layout, progress tracker).
- i18n supports Turkish (default), English, and Chinese via `react-i18next`.
- Users can mark items as "read"; progress is tracked in localStorage and shown as
  an SVG donut chart.
- Dashboards, widget instances, and per-instance filters are persisted to
  `.burkut/layouts/dashboard.json` in the active content directory.

## Developing against library source

To iterate on `@ay/ui-library` or `@ay/ui-library` while running Bürküt, set the Local
Dev Alias instead of linking packages:

```bash
AY_LOCAL=1 pnpm dev
```

Vite then resolves `@ay/*` specifiers to `packages/*/src`, so edits appear through
HMR with no rebuild and no reinstall. Unset, Bürküt resolves the packages' built
entry points, which is what `pnpm build` and CI use.

## Installation (for end users)

```bash
pnpm dlx burkut serve      # run without installing
pnpm add -g burkut         # or install globally
```
