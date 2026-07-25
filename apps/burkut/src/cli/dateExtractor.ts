import { basename, dirname } from "node:path";

const DATE_PREFIX_RE = /^(\d{4}-\d{2}-\d{2})/;

/**
 * Validate that a YYYY-MM-DD string represents a real calendar date.
 * Rejects invalid dates like 2025-13-45 or 2025-02-30.
 */
export function isValidDate(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/**
 * Extract a date from a file path and optional frontmatter.
 * Priority order:
 *   1. Frontmatter `date` field (markdown only)
 *   2. Filename prefix: YYYY-MM-DD-rest-of-name.ext
 *   3. Parent folder prefix: YYYY-MM-DD-folder-name/
 * Returns ISO date string (YYYY-MM-DD) or null.
 */
export function extractDate(
  relativePath: string,
  frontmatter: Record<string, unknown> | null,
): string | null {
  // Priority 1: Frontmatter date field
  if (frontmatter?.date != null) {
    const fm = frontmatter.date;
    let dateStr: string | null = null;

    if (fm instanceof Date) {
      dateStr = fm.toISOString().slice(0, 10);
    } else if (typeof fm === "string") {
      const match = fm.match(DATE_PREFIX_RE);
      if (match) dateStr = match[1];
    }

    if (dateStr && isValidDate(dateStr)) return dateStr;
  }

  // Priority 2: Filename prefix
  const filename = basename(relativePath);
  const filenameMatch = filename.match(DATE_PREFIX_RE);
  if (filenameMatch && isValidDate(filenameMatch[1])) {
    return filenameMatch[1];
  }

  // Priority 3: Parent folder prefix
  const parentDir = dirname(relativePath);
  if (parentDir !== ".") {
    const folderName = basename(parentDir);
    const folderMatch = folderName.match(DATE_PREFIX_RE);
    if (folderMatch && isValidDate(folderMatch[1])) {
      return folderMatch[1];
    }
  }

  return null;
}
