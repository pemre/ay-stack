import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import matter from "gray-matter";
import type { ScannedFile } from "../shared/types.ts";
import { detectContentType } from "./contentTypeRegistry.ts";
import { extractDate } from "./dateExtractor.ts";

/**
 * Recursively scan a directory for recognized content files.
 * Skips hidden entries (starting with `.`) and `node_modules`.
 * Parses markdown frontmatter with gray-matter; sets frontmatter/body
 * to null for non-markdown files.
 */
export function scanDirectory(rootPath: string): ScannedFile[] {
  const results: ScannedFile[] = [];

  function walk(dir: string): void {
    let entries: ReturnType<typeof readdirSync>;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "EACCES" || code === "EPERM") {
        console.warn(
          `Warning: Permission denied reading directory ${relative(rootPath, dir) || "."}, skipping`,
        );
        return;
      }
      throw err;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") {
        continue;
      }

      const fullPath = join(dir, entry.name);
      const relPath = relative(rootPath, fullPath);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      const contentType = detectContentType(entry.name);
      if (contentType === null) continue;

      let frontmatter: Record<string, unknown> | null = null;
      let body: string | null = null;

      if (contentType === "markdown") {
        try {
          const raw = readFileSync(fullPath, "utf-8");
          const parsed = matter(raw);
          frontmatter = parsed.data;
          body = parsed.content;
        } catch (err) {
          const code = (err as NodeJS.ErrnoException).code;
          if (code === "EACCES" || code === "EPERM") {
            console.warn(`Warning: Permission denied reading ${relPath}, skipping`);
            continue;
          }
          // Malformed YAML frontmatter — include file with null frontmatter
          console.warn(`Warning: Could not parse frontmatter in ${relPath}, skipping metadata`);
          try {
            const raw = readFileSync(fullPath, "utf-8");
            frontmatter = null;
            body = raw;
          } catch {
            console.warn(`Warning: Could not read ${relPath}, skipping`);
            continue;
          }
        }
      }

      const date = extractDate(relPath, frontmatter);

      results.push({
        absolutePath: fullPath,
        relativePath: relPath,
        contentType,
        date,
        frontmatter,
        body,
      });
    }
  }

  walk(rootPath);
  return results;
}
