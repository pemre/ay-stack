import fc from "fast-check";
import { resolve, normalize } from "node:path";
import { describe, expect, it } from "vitest";
import { isPathWithinBoundary } from "./burkut-content.ts";

/**
 * Property-based tests for path traversal prevention in the burkut-content Vite plugin.
 *
 * Tests Property 13 from the design document.
 */

/** A fixed content directory used for all tests. */
const CONTENT_DIR = "/home/user/my-content";

/** Arbitrary for a simple safe filename segment. */
const arbSegment = fc
  .stringMatching(/^[a-zA-Z][a-zA-Z0-9_-]*$/)
  .filter((s) => s.length >= 1 && s.length <= 20);

/** Arbitrary for a file extension. */
const arbExt = fc.constantFrom(".md", ".jpg", ".png", ".mp4", ".mp3", ".webp", ".gif");

describe("Burkut Content Plugin — Property 13: Path traversal prevention", () => {
  /**
   * For any path that stays within the content directory (no `..` escaping),
   * isPathWithinBoundary returns true.
   *
   * **Validates: Requirements 6.4, 10.3**
   */
  it("accepts paths that resolve within the content directory", () => {
    fc.assert(
      fc.property(
        fc.array(arbSegment, { minLength: 0, maxLength: 3 }),
        arbSegment,
        arbExt,
        (dirs, filename, ext) => {
          const segments = [...dirs, `${filename}${ext}`];
          const relativePath = segments.join("/");
          expect(isPathWithinBoundary(CONTENT_DIR, relativePath)).toBe(true);
        },
      ),
      { numRuns: 300 },
    );
  });

  /**
   * For any path containing `../` sequences that escape the content directory,
   * isPathWithinBoundary returns false.
   *
   * **Validates: Requirements 6.4, 10.3**
   */
  it("rejects paths with ../ that escape the content directory", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        arbSegment,
        arbExt,
        (traversalDepth, filename, ext) => {
          // Build a path that goes up more levels than the content dir depth
          const contentDirDepth = CONTENT_DIR.split("/").filter(Boolean).length;
          const ups = "../".repeat(contentDirDepth + traversalDepth);
          const requestedPath = `${ups}${filename}${ext}`;
          expect(isPathWithinBoundary(CONTENT_DIR, requestedPath)).toBe(false);
        },
      ),
      { numRuns: 300 },
    );
  });

  /**
   * Paths that go up with `..` but still resolve within the content directory
   * are accepted (e.g., `subdir/../file.md` stays inside).
   *
   * **Validates: Requirements 6.4, 10.3**
   */
  it("accepts paths with ../ that still resolve within the content directory", () => {
    fc.assert(
      fc.property(arbSegment, arbSegment, arbExt, (subdir, filename, ext) => {
        const relativePath = `${subdir}/../${filename}${ext}`;
        expect(isPathWithinBoundary(CONTENT_DIR, relativePath)).toBe(true);
      }),
      { numRuns: 300 },
    );
  });

  /**
   * The content directory path itself is considered within boundary.
   *
   * **Validates: Requirements 6.4, 10.3**
   */
  it("accepts the content directory itself (empty relative path resolves to base)", () => {
    expect(isPathWithinBoundary(CONTENT_DIR, "")).toBe(true);
    expect(isPathWithinBoundary(CONTENT_DIR, ".")).toBe(true);
  });

  /**
   * Paths that are exactly one level above the content directory are rejected.
   *
   * **Validates: Requirements 6.4, 10.3**
   */
  it("rejects a single ../ that escapes the content directory", () => {
    expect(isPathWithinBoundary(CONTENT_DIR, "../secret.txt")).toBe(false);
    expect(isPathWithinBoundary(CONTENT_DIR, "..")).toBe(false);
  });

  /**
   * For any content directory and any path with enough `../` to escape,
   * the function rejects it regardless of the content directory depth.
   *
   * **Validates: Requirements 6.4, 10.3**
   */
  it("rejects traversal regardless of content directory depth", () => {
    fc.assert(
      fc.property(
        fc.array(arbSegment, { minLength: 1, maxLength: 5 }).map((segs) => `/${segs.join("/")}`),
        arbSegment,
        arbExt,
        (contentDir, filename, ext) => {
          const depth = contentDir.split("/").filter(Boolean).length;
          const ups = "../".repeat(depth + 1);
          const requestedPath = `${ups}${filename}${ext}`;
          expect(isPathWithinBoundary(contentDir, requestedPath)).toBe(false);
        },
      ),
      { numRuns: 300 },
    );
  });
});
