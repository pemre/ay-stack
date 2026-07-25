## 🦅 Bürküt — Content Visualizer

**Bürküt** takes its name from the golden eagle of Turkic mythology — the *ongon* of khans, the earthly eye of Tengri, the divine scout that soared above the steppe and saw everything below.

Bürküt is a CLI-driven content visualization tool. Point it at any local directory of content files (markdown, images, video, audio) and it serves an interactive UI on localhost — complete with a timeline, map, sidebar, and detail panel. Dates are extracted automatically from filenames, folder names, and frontmatter. No database, no backend, no CMS.

> *"Rise above time. See everything."*

Bürküt is the app at `apps/burkut/` in the [ay-stack](../../README.md) workspace. It consumes two workspace packages — `@ay/tokens` for the shared design language and `@ay/ui-library` for shared React blocks — and depends on nothing else in the repository. Live build: https://pemre.github.io/ay-stack/burkut/

---

## Features

- ⚡ CLI-driven — `burkut serve <directory>` scans and serves instantly
- 🔀 Draggable & resizable widget grid — rearrange Sidebar, Content, Map, and Timeline widgets; layout and visibility persisted
- 🌗 Dark / Light theme toggle
- 🌐 i18n — Turkish, English, and Chinese
- 📝 Markdown-driven content with YAML front matter
- 🗺️ Interactive map (Leaflet) with markers and polygons
- 📅 Interactive timeline (vis.js), grouped by category
- ✓ Reading progress tracker with new-content detection
- 🔄 HMR — adding, editing, or deleting files updates the UI live

## Multi-Dashboard System

Bürküt uses a Datadog-style multi-dashboard system. Instead of a single fixed layout, you create named dashboards — each a canvas of independently configured widget instances.

- **Dashboards** — create, rename, and delete dashboards via the Dashboard Bar in the app header. Each dashboard holds its own set of widgets with independent layout and filters.
- **Widget instances** — multiple instances of the same widget type (Sidebar, Content, Map, Timeline) can coexist on a single dashboard, each with its own configuration. Add widgets from the Widget Picker; duplicate or remove them from the widget header.
- **Per-instance configuration** — each widget instance is configured independently: Sidebar (tag/type filters), Timeline (date range), Map (bounding box), Content (pinned item).
- **Dashboard templates** — bootstrap new dashboards from predefined templates (Daily, Monthly, Travel, Overview) or start with a blank canvas.
- **Cross-tab sync** — dashboard definitions sync across browser tabs via BroadcastChannel. Each tab independently selects which dashboard to view, enabling multi-monitor workflows.
- **Layout persistence** — dashboard state is persisted to `.burkut/layouts/dashboard.json` inside the active content directory. Each tab's active dashboard selection is stored in sessionStorage so refreshes restore your view.

## CLI Usage

### Installation

```bash
# Run directly, without installing
pnpm dlx burkut serve

# Or install globally
pnpm add -g burkut
```

### Commands

```bash
# Serve the current directory
burkut serve

# Serve a specific directory
burkut serve ~/diary

# Serve with options
burkut serve ~/diary --port 3000 --host localhost --open

# Build (stubbed — coming in a future release)
burkut build
```

A directory argument is resolved against **your** working directory, while Bürküt's
own files resolve against the installed package — so `burkut serve ../notes` means
what it looks like from wherever you run it.

### Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--port` | `5173` | Dev server port |
| `--host` | `localhost` | Dev server host |
| `--open` | `false` | Open browser on start |

### Example Directory Structure

```
~/diary/
├── 2025-03-15 journal.md          # date from filename
├── 2025-03-15 photos/             # date from folder name
│   ├── sunset.jpg                 # inherits 2025-03-15
│   └── dinner.jpg                 # inherits 2025-03-15
├── 2025-03-16 journal.md
├── movies/
│   └── in-the-mood-for-love.md    # date from frontmatter
├── travel/
│   └── 2025-01-10 istanbul.md     # date from filename
└── .burkut/
    ├── config.ts                  # optional workspace config
    └── layouts/                   # dashboard state, written by the app
```

Dates are extracted automatically from frontmatter `date` fields, `YYYY-MM-DD` filename prefixes, or parent folder prefixes. Files are grouped by date and displayed newest-first.

Supported file types: `.md`, `.mdx`, `.markdown`, `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`, `.avif`, `.mp4`, `.webm`, `.mov`, `.avi`, `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`.

## Development

All commands run from the workspace root. `pnpm install` once at the root installs
every package.

```bash
pnpm dev                                        # dev server (same as --filter burkut dev)
pnpm --filter burkut serve                      # exercise the CLI entry point directly
BURKUT_CONTENT_DIR=./apps/burkut/src/content pnpm dev   # repo-local content
AY_LOCAL=1 pnpm dev                             # resolve @ay/* to package source, with HMR
```

`BURKUT_CONTENT_DIR` is resolved against your working directory, the same rule the
CLI applies to its directory argument. Unset, the app starts on an empty content
graph and says so on stdout.

Bürküt resolves `@ay/tokens` and `@ay/ui-library` from their build output unless
`AY_LOCAL=1` is set, so build them when their `dist/` is cold:

```bash
pnpm --filter "burkut..." build   # tokens → ui-library → burkut, topologically
```

## Testing & Quality

```bash
pnpm --filter burkut test         # all tests (single run)
pnpm --filter burkut coverage     # coverage report
pnpm --filter burkut typecheck    # tsc --noEmit
pnpm --filter burkut lint         # biome check src
pnpm --filter burkut build        # production build
```

All four gates must pass before merging; `pnpm verify` at the root runs them for
every package. See [.kiro/steering/tech.md](.kiro/steering/tech.md) for the full
command reference and configuration details.

## Stylesheets and Design Tokens

Bürküt declares no core or semantic design token — both tiers live in `@ay/tokens`.
The app's own stylesheets are:

| File | Contents |
|------|----------|
| `src/styles/tailwind.css` | Tailwind v4 plus the `@ay/tokens` theme entry |
| `src/styles/app-tokens.css` | legacy aliases, timeline layer colors, vis-timeline overrides, base rules |
| `src/styles/layout.css` | app shell and panel layout |

Token tiers, naming patterns, and tier ownership rules live in one place:
[`packages/tokens/TOKEN-ARCHITECTURE.md`](../../packages/tokens/TOKEN-ARCHITECTURE.md).
UI primitive conventions and component APIs are in
[`src/components/ui/GUIDELINES.md`](src/components/ui/GUIDELINES.md).

## Roadmap

- [ ] Custom localization for Vis.js based on app language
- [ ] Search bar (by title + tag)
- [ ] E2E tests (Playwright)
- [ ] Mobile responsive layout

Longer-term phases are tracked in the workspace [ROADMAP.md](../../ROADMAP.md).

## Documentation

Project documentation lives in `.kiro/steering/`:

| File | Contents |
|------|----------|
| [product.md](.kiro/steering/product.md) | Product overview, key concepts, place in the workspace |
| [tech.md](.kiro/steering/tech.md) | Tech stack, commands, quality gates, stylesheets, path resolution |
| [structure.md](.kiro/steering/structure.md) | Project layout, component conventions, coding patterns |

---

*Built with TypeScript + Vite + React + Tailwind v4 + react-grid-layout + vis.js + react-leaflet + Biome. Markdown-driven, no backend required.*
