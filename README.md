## 🦅 Bürküt — Content Visualizer

**Bürküt** takes its name from the golden eagle of Turkic mythology — the *ongon* of khans, the earthly eye of Tengri, the divine scout that soared above the steppe and saw everything below.

Bürküt is a CLI-driven content visualization tool. Point it at any local directory of content files (markdown, images, video, audio) and it serves an interactive UI on localhost — complete with a timeline, map, sidebar, and detail panel. Dates are extracted automatically from filenames, folder names, and frontmatter. No database, no backend, no CMS.

> *"Rise above time. See everything."*

---

## Features

- ⚡ CLI-driven — `burkut serve <directory>` scans and serves instantly
- 🔀 Draggable & resizable widget grid — rearrange Sidebar, Content, Map, and Timeline widgets; layout and visibility persisted to localStorage
- 🌗 Dark / Light theme toggle
- 🌐 i18n — Turkish, English, and Chinese
- 📝 Markdown-driven content with YAML front matter
- 🗺️ Interactive map (Leaflet) with markers and polygons
- 📅 Interactive timeline (vis.js), grouped by category
- ✓ Reading progress tracker with new-content detection
- 🔄 HMR — adding, editing, or deleting files updates the UI live

## Roadmap

- [ ] Custom localization for Vis.js based on app language
- [ ] Search bar (by title + tag)
- [ ] E2E tests (Playwright)
- [ ] Mobile responsive layout

## CLI Usage

### Installation

```bash
# Run directly with npx (no install needed)
npx burkut serve

# Or install globally
npm i -g burkut
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

npm run serve -- ./src/content
```

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
    └── config.ts                  # optional workspace config
```

Dates are extracted automatically from frontmatter `date` fields, `YYYY-MM-DD` filename prefixes, or parent folder prefixes. Files are grouped by date and displayed newest-first.

Supported file types: `.md`, `.mdx`, `.markdown`, `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`, `.avif`, `.mp4`, `.webm`, `.mov`, `.avi`, `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`.

## Development

```bash
npm install
npm run dev
```

## Testing & Quality

```bash
npm test                # all tests (single run)
npm run coverage        # coverage report
npm run typecheck       # tsc --noEmit
npm run lint            # biome check src
npm run build           # production build
```

All four must pass before merging. See [.kiro/steering/tech.md](.kiro/steering/tech.md) for the full command reference and Biome config.

## Design System

Bürküt uses a three-tier design token architecture (core → semantic → component) and reusable UI primitives in `src/components/ui/`. See the [Design System Guidelines](src/components/ui/GUIDELINES.md) for token naming conventions, component APIs, and patterns for extending the system.

## Documentation

Detailed project documentation lives in `.kiro/steering/`:

| File | Contents |
|------|----------|
| [product.md](.kiro/steering/product.md) | Product overview, key concepts, feature flags |
| [tech.md](.kiro/steering/tech.md) | Tech stack, build commands, quality gates, Biome & TS config |
| [structure.md](.kiro/steering/structure.md) | Project layout, component conventions, coding patterns |

These steering files are the source of truth for architecture decisions and project conventions.

---

*Built with TypeScript + Vite + React + react-grid-layout + vis.js + react-leaflet + Biome. Markdown-driven, no backend required.*
