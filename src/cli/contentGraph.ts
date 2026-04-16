import type { ContentEntry, ContentIndex } from "../shared/types.ts";
import type {
  ContentGraph,
  ContentNode,
  ContentType,
  DayBucket,
  ScannedFile,
} from "../shared/types.ts";

/**
 * Get the filename from a relative path (browser-safe, no node:path needed).
 */
function getFilename(relativePath: string): string {
  return relativePath.split("/").pop() ?? relativePath;
}

/**
 * Generate a stable, unique ID from a relative file path.
 *
 * "2025-03-15 journal.md" → "2025-03-15-journal"
 * "photos/2025-03-15 sunset.jpg" → "photos--2025-03-15-sunset"
 */
export function filePathToId(relativePath: string): string {
  return relativePath
    .replace(/\.[^.]+$/, "") // strip extension
    .replace(/\//g, "--") // replace path separators
    .replace(/\s+/g, "-") // replace spaces
    .toLowerCase();
}

/**
 * Derive a display title from a file path and optional frontmatter.
 *
 * Priority:
 *   1. frontmatter.title (if non-empty string)
 *   2. Filename with extension, date prefix, and separators stripped
 */
export function deriveTitle(
  relativePath: string,
  frontmatter: Record<string, unknown> | null,
): string {
  if (typeof frontmatter?.title === "string" && frontmatter.title.trim()) {
    return frontmatter.title.trim();
  }

  let name = getFilename(relativePath).replace(/\.[^.]+$/, "");

  // Strip leading YYYY-MM-DD prefix (with optional separator)
  name = name.replace(/^\d{4}-\d{2}-\d{2}[\s_-]*/, "");

  // Replace underscores and hyphens with spaces
  name = name.replace(/[_-]/g, " ").trim();

  return name || getFilename(relativePath);
}

/**
 * Transform a flat list of scanned files into a date-indexed content graph.
 *
 * - Generates stable IDs via `filePathToId()`
 * - Derives display titles via `deriveTitle()`
 * - Extracts tags from frontmatter (defaults to empty array)
 * - Groups dated nodes into `DayBucket[]` sorted newest-first
 * - Collects undated nodes separately
 * - Computes `dateRange` and summary `stats`
 */
export function buildContentGraph(files: ScannedFile[], _rootPath: string): ContentGraph {
  const nodes: Record<string, ContentNode> = {};
  const dateMap = new Map<string, ContentNode[]>();
  const undated: ContentNode[] = [];
  const byType: Record<ContentType, number> = {
    markdown: 0,
    image: 0,
    video: 0,
    audio: 0,
  };

  for (const file of files) {
    const id = filePathToId(file.relativePath);
    const title = deriveTitle(file.relativePath, file.frontmatter);
    const tags = Array.isArray(file.frontmatter?.tags) ? (file.frontmatter.tags as string[]) : [];

    const node: ContentNode = {
      id,
      relativePath: file.relativePath,
      contentType: file.contentType,
      date: file.date,
      frontmatter: file.frontmatter,
      body: file.body,
      title,
      tags,
    };

    nodes[id] = node;
    byType[file.contentType]++;

    if (file.date) {
      const bucket = dateMap.get(file.date) ?? [];
      bucket.push(node);
      dateMap.set(file.date, bucket);
    } else {
      undated.push(node);
    }
  }

  const sortedDates = [...dateMap.keys()].sort((a, b) => b.localeCompare(a));
  const days: DayBucket[] = sortedDates.map((date) => ({
    date,
    nodes: dateMap.get(date) ?? [],
  }));

  const datedFiles = files.length - undated.length;
  const dateRange =
    sortedDates.length > 0
      ? { earliest: sortedDates[sortedDates.length - 1], latest: sortedDates[0] }
      : null;

  return {
    nodes,
    days,
    undated,
    dateRange,
    stats: {
      totalFiles: files.length,
      byType,
      datedFiles,
      undatedFiles: undated.length,
    },
  };
}

/**
 * Convert a ContentGraph into the legacy ContentIndex format
 * so existing widgets (Sidebar, TimelinePanel, ContentPanel, MapPanel)
 * work without modification.
 *
 * Each ContentNode maps to a ContentEntry with:
 * - id, title, tags copied from the node
 * - _isHeader set to false (no group headers in CLI mode)
 * - _path set to the node's relativePath
 * - group derived from the date (or "Undated")
 * - markdown frontmatter fields spread into the entry
 */
export function contentGraphToLegacyIndex(graph: ContentGraph): ContentIndex {
  const index: ContentIndex = {};

  for (const node of Object.values(graph.nodes)) {
    const entry: ContentEntry = {
      id: node.id,
      title: node.title,
      tags: node.tags,
      _isHeader: false,
      _path: node.relativePath,
      group: node.date ?? "Undated",
      ...(node.frontmatter ?? {}),
    };

    // Ensure core fields are not overwritten by frontmatter spread
    entry.id = node.id;
    entry.title = node.title;
    entry.tags = node.tags;
    entry._isHeader = false;
    entry._path = node.relativePath;

    index[node.id] = entry;
  }

  return index;
}

/**
 * Get the markdown body for a content node by ID.
 * Returns null if the node doesn't exist or has no body.
 */
export function getContentBody(graph: ContentGraph, id: string): string | null {
  const node = graph.nodes[id];
  if (!node) return null;
  return node.body ?? null;
}
