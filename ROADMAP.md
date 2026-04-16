# Phase 1: CLI Foundation & Content Scanner

- [x] CLI tool (burkut serve, burkut build)
- [x] Directory scanning with file type detection
- [x] Content type registry (markdown + images to start)
- [x] Frontmatter extraction
- [x] Date-based content graph
- [x] Basic dev server (Vite-based)
- [x] Migrate existing Bürküt components to work with the new content graph

# Phase 2: Multi-Source & Media Support

Multiple source directories in config
Image/video/audio renderers
Sidecar YAML metadata for non-text files
EXIF extraction for photos
Thumbnail generation for media files
Content type auto-detection by extension

# Phase 3: Multi-Tab Dashboard System

Zustand-based tab state management
Tab creation/deletion/renaming
Per-tab time range picker (presets + custom)
Per-tab widget layout (react-grid-layout per tab)
Per-tab filters (type, tags, source)
Layout persistence in .burkut/layouts/
Dashboard templates (Daily, Monthly, Travel, etc.)

# Phase 4: Advanced Widgets

Heatmap widget (GitHub-style activity grid)
Photo wall / gallery widget
Stats widget (entry counts, streaks, etc.)
"On This Day" widget
Movie/book shelf widget
Tag frequency chart widget
Mood/custom field tracker widget

# Phase 5: Datadog-Style Query & Filtering

Query bar with syntax (type:movie date:>2024-01 tags:travel)
Faceted counters (top bar with type counts)
Cross-widget filtering (click a tag → all widgets filter)
Saved queries / bookmarks

# Phase 6: Static Build & Export

burkut build command
Static HTML generation
Asset optimization (image thumbnails, lazy loading)
Optional RSS/JSON feed generation
GitHub Pages / Netlify deployment support

# Phase 7: Graph & Relationships

Wiki-link parsing ([[other-file]])
Relationship graph widget
Backlinks panel
Auto-tagging from content analysis
