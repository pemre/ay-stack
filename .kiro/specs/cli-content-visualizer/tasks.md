# Implementation Plan: CLI Content Visualizer (Phase 1)

## Overview

Transform Bürküt from a bundled-content history explorer into a CLI-driven content visualization tool. Implementation proceeds bottom-up: shared types → pure utility modules → scanner pipeline → Vite plugin → React integration → CLI entry point → documentation updates.

## Tasks

- [x] 1. Define shared types and data models
  - [x] 1.1 Create `src/shared/types.ts` with `ContentType`, `ContentNode`, `DayBucket`, `ContentGraph`, `ScannedFile`, and `CLIOptions` interfaces
    - Export all types used by both CLI (Node.js) and browser (React) code
    - Include `ContentTypeDefinition` with `type`, `extensions`, and `mimePrefix` fields
    - Include `BurkutConfig` interface for workspace configuration
    - _Requirements: 3.1, 5.1, 5.2, 5.3, 5.6, 9.1_

- [x] 2. Implement Content Type Registry
  - [x] 2.1 Create `src/cli/contentTypeRegistry.ts` with `CONTENT_TYPE_REGISTRY`, `detectContentType()`, and `getDefinition()`
    - Register markdown extensions (`.md`, `.mdx`, `.markdown`), image (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`, `.avif`), video (`.mp4`, `.webm`, `.mov`, `.avi`), audio (`.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`)
    - `detectContentType()` must be case-insensitive and return `null` for unrecognized extensions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 2.2 Write property test for content type extension mapping
    - **Property 3: Content type extension mapping**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

- [x] 3. Implement Date Extractor
  - [x] 3.1 Create `src/cli/dateExtractor.ts` with `extractDate()` and `isValidDate()` helper
    - Implement priority chain: frontmatter `date` → filename prefix → parent folder prefix
    - Support `Date` objects and `YYYY-MM-DD` strings in frontmatter
    - Validate calendar dates (reject month > 12, day > 31, etc.)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 3.2 Write property test for date extraction priority chain
    - **Property 4: Date extraction priority chain**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x] 3.3 Write property test for date output validity
    - **Property 5: Date output validity**
    - **Validates: Requirements 4.5, 4.7**

  - [x] 3.4 Write property test for date format equivalence
    - **Property 6: Date format equivalence**
    - **Validates: Requirement 4.6**

- [x] 4. Implement ID generation and title derivation utilities
  - [x] 4.1 Create `filePathToId()` and `deriveTitle()` in `src/cli/contentGraph.ts` (or a shared utils file)
    - `filePathToId`: strip extension, replace `/` with `--`, replace spaces with `-`, lowercase
    - `deriveTitle`: prefer `frontmatter.title`, fallback to filename with extension/date-prefix/separators stripped
    - _Requirements: 5.7, 5.8, 12.1, 12.2, 12.3_

  - [x] 4.2 Write property test for ID uniqueness and generation
    - **Property 10: ID uniqueness and generation**
    - **Validates: Requirements 5.7, 12.1, 12.3**

  - [x] 4.3 Write property test for title derivation priority
    - **Property 11: Title derivation priority**
    - **Validates: Requirements 5.8, 12.2**

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Directory Scanner
  - [x] 6.1 Create `src/cli/scanner.ts` with `scanDirectory()` function
    - Recursive directory traversal using `node:fs` `readdirSync` with `withFileTypes`
    - Skip hidden files/directories (names starting with `.`) and `node_modules`
    - Delegate to `detectContentType()` for file type detection
    - Parse markdown frontmatter with `gray-matter` for `.md` files; set `frontmatter: null` and `body: null` for non-markdown
    - Delegate to `extractDate()` for date resolution
    - Handle malformed YAML frontmatter gracefully (log warning, set `frontmatter: null`, `body` as full content)
    - Handle permission errors gracefully (log warning, skip inaccessible entry)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 8.1, 8.2_

  - [x] 6.2 Write property test for scan completeness and exclusion
    - **Property 1: Scan completeness and exclusion**
    - **Validates: Requirements 2.1, 2.2, 2.4**

  - [x] 6.3 Write property test for frontmatter population correctness
    - **Property 2: Frontmatter population correctness**
    - **Validates: Requirements 2.5, 2.6**

- [x] 7. Implement Content Graph Builder
  - [x] 7.1 Create `buildContentGraph()` in `src/cli/contentGraph.ts`
    - Generate stable IDs via `filePathToId()`, derive titles via `deriveTitle()`
    - Extract tags from frontmatter (default to empty array)
    - Group nodes by date into `DayBucket[]`, collect undated nodes separately
    - Sort days descending (newest first)
    - Compute `dateRange` and `stats` (totalFiles, byType, datedFiles, undatedFiles)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [x] 7.2 Write property test for graph node completeness and stats consistency
    - **Property 7: Graph node completeness and stats consistency**
    - **Validates: Requirements 5.1, 5.6**

  - [x] 7.3 Write property test for graph partition
    - **Property 8: Graph partition**
    - **Validates: Requirements 5.2, 5.3**

  - [x] 7.4 Write property test for day sort order
    - **Property 9: Day sort order**
    - **Validates: Requirement 5.4**

  - [x] 7.5 Write property test for tags default to empty array
    - **Property 12: Tags default to empty array**
    - **Validates: Requirement 5.9**

- [x] 8. Implement Legacy Adapter
  - [x] 8.1 Create `contentGraphToLegacyIndex()` in `src/cli/contentGraph.ts` (or a dedicated adapter file)
    - Convert every `ContentNode` to a `ContentEntry` compatible with existing `useMdLoader` consumers
    - Map `id`, `title`, `tags`; set `_isHeader: false`, `_path: relativePath`
    - Spread markdown frontmatter fields into the `ContentEntry`
    - Implement `getContentBody(graph, id)` helper
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 8.2 Write property test for legacy adapter fidelity
    - **Property 14: Legacy adapter fidelity**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

- [x] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Vite Plugin for CLI mode
  - [x] 10.1 Create `vite-plugins/burkut-content.ts` with `burkutContent()` plugin function
    - Scan directory on startup, build ContentGraph, serve as `virtual:burkut-content` JSON module
    - Watch content directory for file changes; re-scan and invalidate virtual module on changes (HMR)
    - Serve media files from content directory via `/content-assets/` URL prefix middleware
    - Validate `/content-assets/` requests resolve within content directory boundary (prevent path traversal)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 10.3_

  - [x] 10.2 Write property test for path traversal prevention
    - **Property 13: Path traversal prevention**
    - **Validates: Requirements 6.4, 10.3**

- [x] 11. Implement useContentGraph hook
  - [x] 11.1 Create `src/hooks/useContentGraph.ts` to consume `virtual:burkut-content`
    - Import ContentGraph from the virtual module
    - Provide `graph`, `legacyIndex`, and `getContent` to consumers
    - Use `contentGraphToLegacyIndex()` adapter internally so existing widgets work without modification
    - _Requirements: 7.1, 6.1_

- [x] 12. Implement CLI entry point and dev server launcher
  - [x] 12.1 Create `src/cli/bin/burkut.ts` as the CLI entry point
    - Parse `serve` and `build` subcommands using `cac`
    - Resolve target directory (default: `process.cwd()`), validate it exists and is a directory
    - Pass `--port`, `--host`, `--open` flags to dev server
    - `build` command prints stub message and exits with code 0
    - Print error and exit with code 1 for missing directory or file-instead-of-directory
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 12.2 Create `src/cli/devServer.ts` with `startDevServer()` function
    - Configure Vite with `burkut-content` plugin pointing to the target directory
    - Load optional `.burkut/config.ts` workspace config and merge with defaults
    - Bind to `localhost` by default; warn about network exposure when `--host 0.0.0.0`
    - Handle empty directory gracefully (start server, show empty-state message)
    - _Requirements: 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2_

- [x] 13. Update package.json for CLI distribution
  - [x] 13.1 Add `bin`, `files`, and dependency changes to `package.json`
    - Add `"bin": { "burkut": "./dist/cli/bin/burkut.js" }`
    - Add `"files": ["dist/"]`
    - Add `cac` as a production dependency
    - Move `gray-matter` from devDependencies to dependencies
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 14. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Update project documentation
  - [x] 15.1 Update `README.md` with CLI usage documentation
    - Document `burkut serve` command, installation instructions (`npx burkut serve`, `npm i -g burkut`), and example usage
    - _Requirements: 13.1_

  - [x] 15.2 Update `.kiro/steering/structure.md` with new directories and files
    - Add `src/cli/`, `src/shared/`, and `vite-plugins/burkut-content.ts` to the project structure
    - _Requirements: 13.2_

  - [x] 15.3 Update `.kiro/steering/tech.md` with dependency and script changes
    - List `cac` as a production dependency, note `gray-matter` move to production, document any new npm scripts or build changes
    - _Requirements: 13.3_

  - [x] 15.4 Update `.kiro/steering/product.md` with CLI capability description
    - Describe the CLI-driven content visualization capability alongside the existing history explorer functionality
    - _Requirements: 13.4_

- [x] 16. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use `fast-check` (already in devDependencies) and validate universal correctness properties from the design document
- The existing `vite-plugins/md-content.ts` and `src/hooks/useMdLoader.ts` are kept for backward compatibility (non-CLI mode)
