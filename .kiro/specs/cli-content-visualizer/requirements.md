# Requirements Document

## Introduction

This document defines the requirements for the CLI Content Visualizer feature (Phase 1) of Bürküt. The feature transforms Bürküt from a bundled-content history explorer into a general-purpose, CLI-driven content visualization tool. Users run `burkut serve <directory>` to scan a local directory for content files (markdown, images, video, audio), extract dates, build a content graph, and serve an interactive daily-stream UI on localhost via Vite.

## Glossary

- **CLI**: The command-line interface entry point (`bin/burkut.ts`) that parses arguments and dispatches commands.
- **Scanner**: The directory scanner module (`src/cli/scanner.ts`) that recursively walks a directory and produces `ScannedFile` descriptors.
- **Date_Extractor**: The module (`src/cli/dateExtractor.ts`) responsible for extracting dates from file paths and frontmatter using a priority-based strategy.
- **Content_Type_Registry**: The module (`src/cli/contentTypeRegistry.ts`) that maps file extensions to content types.
- **Graph_Builder**: The module (`src/cli/contentGraph.ts`) that transforms scanned files into a date-indexed `ContentGraph`.
- **Vite_Plugin**: The Vite plugin (`vite-plugins/burkut-content.ts`) that serves the content graph as a virtual module and media files via middleware.
- **Legacy_Adapter**: The function (`contentGraphToLegacyIndex`) that converts a `ContentGraph` into the existing `ContentIndex` format consumed by current widgets.
- **ContentGraph**: The central data structure containing all content nodes indexed by ID, grouped by date into day buckets, with undated nodes and summary statistics.
- **ContentNode**: A single content entry in the graph with an ID, path, type, date, frontmatter, body, title, and tags.
- **DayBucket**: A grouping of `ContentNode` entries sharing the same date.
- **Dev_Server**: The Vite-based development server launched by the `serve` command.
- **Workspace_Config**: An optional `.burkut/config.ts` file in the target directory providing per-workspace overrides.

## Requirements

### Requirement 1: CLI Command Parsing

**User Story:** As a developer, I want to run `burkut serve <directory>` from the command line, so that I can visualize any local content directory without configuration.

#### Acceptance Criteria

1. WHEN a user runs `burkut serve` without a directory argument, THE CLI SHALL use the current working directory as the target.
2. WHEN a user runs `burkut serve <path>`, THE CLI SHALL resolve the path and use it as the target directory.
3. WHEN a user provides `--port`, `--host`, or `--open` flags, THE CLI SHALL pass those options to the Dev_Server.
4. WHEN a user runs `burkut build`, THE CLI SHALL print "Static build is not yet implemented. Coming in a future release." and exit with code 0.
5. IF the target path does not exist, THEN THE CLI SHALL print "Error: Directory not found: <path>" and exit with code 1.
6. IF the target path is a file instead of a directory, THEN THE CLI SHALL print "Error: Expected a directory, got a file: <path>" and exit with code 1.

---

### Requirement 2: Directory Scanning

**User Story:** As a developer, I want the tool to recursively scan a directory for content files, so that all my markdown, images, video, and audio are discovered automatically.

#### Acceptance Criteria

1. WHEN the Scanner receives a valid directory path, THE Scanner SHALL recursively traverse all subdirectories and return a `ScannedFile` descriptor for each recognized content file.
2. WHILE traversing the directory tree, THE Scanner SHALL skip files and directories whose names start with `.` (hidden entries).
3. WHILE traversing the directory tree, THE Scanner SHALL skip `node_modules` directories.
4. WHEN a file has an unrecognized extension, THE Scanner SHALL skip that file without error.
5. WHEN a markdown file is encountered, THE Scanner SHALL parse its YAML frontmatter using `gray-matter` and populate the `frontmatter` and `body` fields.
6. WHEN a non-markdown content file is encountered, THE Scanner SHALL set `frontmatter` to `null` and `body` to `null`.
7. THE Scanner SHALL produce unique `relativePath` values for every returned `ScannedFile`.

---

### Requirement 3: Content Type Detection

**User Story:** As a developer, I want file types to be detected by extension, so that the tool knows how to render each content file.

#### Acceptance Criteria

1. WHEN a file has a markdown extension (`.md`, `.mdx`, `.markdown`), THE Content_Type_Registry SHALL return `"markdown"`.
2. WHEN a file has an image extension (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`, `.avif`), THE Content_Type_Registry SHALL return `"image"`.
3. WHEN a file has a video extension (`.mp4`, `.webm`, `.mov`, `.avi`), THE Content_Type_Registry SHALL return `"video"`.
4. WHEN a file has an audio extension (`.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`), THE Content_Type_Registry SHALL return `"audio"`.
5. WHEN a file has an unrecognized extension, THE Content_Type_Registry SHALL return `null`.
6. THE Content_Type_Registry SHALL perform case-insensitive extension matching (e.g., `.MD` matches `.md`).
7. THE Content_Type_Registry SHALL return the same content type for the same extension across all invocations (deterministic behavior).

---

### Requirement 4: Date Extraction

**User Story:** As a developer, I want dates to be extracted from frontmatter, filenames, and folder names in priority order, so that my content is automatically organized chronologically.

#### Acceptance Criteria

1. WHEN a markdown file has a `date` field in its frontmatter, THE Date_Extractor SHALL use that value as the highest-priority date source.
2. WHEN the frontmatter `date` field is absent and the filename starts with a `YYYY-MM-DD` prefix, THE Date_Extractor SHALL extract the date from the filename.
3. WHEN neither frontmatter nor filename provides a date and the parent folder name starts with a `YYYY-MM-DD` prefix, THE Date_Extractor SHALL extract the date from the folder name.
4. WHEN none of the three sources yield a date, THE Date_Extractor SHALL return `null`.
5. IF an extracted date string represents an invalid calendar date (e.g., month > 12, day > 31), THEN THE Date_Extractor SHALL return `null`.
6. THE Date_Extractor SHALL accept frontmatter `date` values as both `Date` objects and `YYYY-MM-DD` strings.
7. THE Date_Extractor SHALL return dates exclusively in `YYYY-MM-DD` ISO format.

---

### Requirement 5: Content Graph Construction

**User Story:** As a developer, I want scanned files to be organized into a date-indexed content graph, so that the UI can render a chronological daily stream.

#### Acceptance Criteria

1. WHEN the Graph_Builder receives a list of scanned files, THE Graph_Builder SHALL produce exactly one `ContentNode` in `graph.nodes` per input file.
2. THE Graph_Builder SHALL place every node with a non-null date into exactly one `DayBucket` in `graph.days`.
3. THE Graph_Builder SHALL place every node with a null date into `graph.undated`.
4. THE Graph_Builder SHALL sort `graph.days` in descending chronological order (newest first).
5. THE Graph_Builder SHALL compute `graph.dateRange` as `{ earliest, latest }` from the sorted days, or `null` when no dated files exist.
6. THE Graph_Builder SHALL compute `graph.stats` such that `totalFiles` equals the number of input files, `datedFiles + undatedFiles` equals `totalFiles`, and `byType` counts match per-type totals.
7. THE Graph_Builder SHALL generate a unique `id` for each node derived from its relative path.
8. THE Graph_Builder SHALL derive a display `title` from frontmatter `title` (preferred) or from the filename by stripping the extension, date prefix, and replacing separators with spaces.
9. THE Graph_Builder SHALL extract `tags` from frontmatter as an array, defaulting to an empty array when absent.

---

### Requirement 6: Vite Plugin and Content Serving

**User Story:** As a developer, I want the content graph served as a virtual module with HMR support, so that the browser UI updates live as I add or edit files.

#### Acceptance Criteria

1. WHEN the Dev_Server starts, THE Vite_Plugin SHALL scan the target directory, build a ContentGraph, and serve it as the `virtual:burkut-content` module.
2. WHEN a content file is added, changed, or deleted in the target directory, THE Vite_Plugin SHALL re-scan, rebuild the ContentGraph, invalidate the virtual module, and trigger an HMR update.
3. WHEN the browser requests a media file (image, video, audio), THE Vite_Plugin SHALL serve the file from the content directory via a `/content-assets/` URL prefix.
4. IF a `/content-assets/` request resolves to a path outside the content directory, THEN THE Vite_Plugin SHALL reject the request to prevent path traversal.

---

### Requirement 7: Legacy Adapter Compatibility

**User Story:** As a developer, I want existing widgets (Sidebar, TimelinePanel, ContentPanel, MapPanel) to work with the new content graph without modification, so that Phase 1 reuses the existing UI.

#### Acceptance Criteria

1. THE Legacy_Adapter SHALL convert every `ContentNode` in a ContentGraph into a `ContentEntry` in the resulting `ContentIndex`.
2. THE Legacy_Adapter SHALL map each node's `id`, `title`, and `tags` to the corresponding `ContentEntry` fields.
3. THE Legacy_Adapter SHALL set `_isHeader` to `false` for all entries produced in CLI mode.
4. THE Legacy_Adapter SHALL set `_path` to the node's `relativePath`.
5. THE Legacy_Adapter SHALL spread markdown frontmatter fields into the `ContentEntry`.

---

### Requirement 8: Error Handling and Resilience

**User Story:** As a developer, I want the tool to handle errors gracefully, so that a single malformed file does not crash the entire scanning process.

#### Acceptance Criteria

1. IF a markdown file contains malformed YAML frontmatter, THEN THE Scanner SHALL log a warning and include the file with `frontmatter` set to `null` and `body` set to the full file content.
2. IF the Scanner encounters a file or directory it cannot read due to permissions, THEN THE Scanner SHALL log a warning and skip the inaccessible entry.
3. WHEN the target directory contains no recognized content files, THE Dev_Server SHALL start normally and display an empty-state message: "No content files found. Add markdown, image, video, or audio files to get started."
4. WHEN the requested port is already in use, THE Dev_Server SHALL fall back to the next available port using Vite's built-in behavior.

---

### Requirement 9: Workspace Configuration

**User Story:** As a developer, I want to optionally configure the tool per directory, so that I can customize titles, locales, and content type behavior.

#### Acceptance Criteria

1. WHEN a `.burkut/config.ts` file exists in the target directory, THE CLI SHALL load and merge its settings with defaults.
2. WHEN no `.burkut/config.ts` file exists, THE CLI SHALL use default settings without error.
3. WHERE a workspace config specifies a `title`, THE Dev_Server SHALL use that title in the UI header.
4. WHERE a workspace config specifies a `locale`, THE Dev_Server SHALL use that locale for i18n.
5. WHERE a workspace config specifies `dateExtraction` overrides, THE Date_Extractor SHALL use the overridden frontmatter field name or filename pattern.

---

### Requirement 10: Security

**User Story:** As a developer, I want the tool to serve content securely on localhost, so that my files are not exposed to unintended access.

#### Acceptance Criteria

1. THE Dev_Server SHALL bind to `localhost` by default.
2. WHEN the `--host` flag is set to `0.0.0.0`, THE CLI SHALL print a warning about network exposure before starting the server.
3. THE Vite_Plugin SHALL validate that all `/content-assets/` requests resolve within the content directory boundary.

---

### Requirement 11: Package Distribution

**User Story:** As a developer, I want to install and run the tool via npm, so that I can use it with `npx burkut serve` or install it globally.

#### Acceptance Criteria

1. THE package.json SHALL declare a `bin` entry mapping `"burkut"` to the compiled CLI entry point.
2. THE package.json SHALL include `gray-matter` as a production dependency (moved from devDependencies).
3. THE package.json SHALL include `cac` as a production dependency for CLI argument parsing.
4. THE package.json SHALL declare a `files` array that includes the `dist/` directory.

---

### Requirement 12: ID Generation and Title Derivation

**User Story:** As a developer, I want stable, human-readable IDs and titles derived from file paths, so that content is consistently identifiable across sessions.

#### Acceptance Criteria

1. THE Graph_Builder SHALL generate IDs by stripping the file extension, replacing path separators with `--`, replacing spaces with `-`, and lowercasing the result.
2. THE Graph_Builder SHALL derive titles by preferring `frontmatter.title`, then falling back to the filename with extension, date prefix, and separators stripped.
3. THE Graph_Builder SHALL produce unique IDs for files with distinct relative paths.

---

### Requirement 13: Post-Implementation Documentation Updates

**User Story:** As a maintainer, I want project documentation and steering files updated after implementation, so that README, structure, tech stack, and product docs stay in sync with the new CLI feature.

#### Acceptance Criteria

1. WHEN implementation is complete, THE README.md SHALL be updated to document the new `burkut serve` CLI command, installation instructions (`npx burkut serve`, `npm i -g burkut`), and example usage.
2. WHEN implementation is complete, THE `.kiro/steering/structure.md` SHALL be updated to reflect the new `src/cli/`, `src/shared/`, and `vite-plugins/burkut-content.ts` directories and files.
3. WHEN implementation is complete, THE `.kiro/steering/tech.md` SHALL be updated to list `cac` as a production dependency, note the `gray-matter` move to production dependencies, and document any new npm scripts or build changes.
4. WHEN implementation is complete, THE `.kiro/steering/product.md` SHALL be updated to describe the CLI-driven content visualization capability alongside the existing history explorer functionality.
