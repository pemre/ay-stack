# Product: Bürküt — Content Visualizer

Bürküt is a CLI-driven content visualization tool. Run `burkut serve <directory>` to scan any local directory for content files (markdown, images, video, audio), extract dates from filenames, folder names, and frontmatter, and serve an interactive daily-stream UI on localhost via Vite.

- Install with `npm i -g burkut` or run directly with `npx burkut serve`
- Dates are extracted automatically using a priority chain: frontmatter `date` → filename `YYYY-MM-DD` prefix → parent folder prefix
- Content is grouped by date into day buckets and displayed newest-first
- HMR support: adding, editing, or deleting files in the target directory updates the UI live
- Optional per-directory configuration via `.burkut/config.ts`

## Key Concepts

- In CLI mode, `vite-plugins/burkut-content.ts` scans the user's directory and serves a `ContentGraph` as `virtual:burkut-content`.
- Feature flags in `config.features` control optional capabilities (search, dark/light toggle, draggable layout, progress tracker).
- i18n supports Turkish (default), English, and Chinese via `react-i18next`.
- Users can mark items as "read"; progress is tracked in localStorage and shown as an SVG donut chart.
