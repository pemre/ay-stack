import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import fc from "fast-check";
import { afterEach, describe, expect, it } from "vitest";
import { CONTENT_TYPE_REGISTRY } from "./contentTypeRegistry.ts";
import { scanDirectory } from "./scanner.ts";

/**
 * Property-based tests for the Directory Scanner.
 *
 * Tests Properties 1 and 2 from the design document.
 * Uses real temporary directories on disk for each test run.
 */

/** All recognized extensions from the registry. */
const RECOGNIZED_EXTENSIONS = CONTENT_TYPE_REGISTRY.flatMap((def) => def.extensions);

/** Markdown extensions specifically. */
const MARKDOWN_EXTENSIONS = CONTENT_TYPE_REGISTRY.find((d) => d.type === "markdown")!.extensions;

/** Non-markdown recognized extensions (image, video, audio). */
const NON_MARKDOWN_EXTENSIONS = RECOGNIZED_EXTENSIONS.filter(
  (ext) => !MARKDOWN_EXTENSIONS.includes(ext),
);

/** Extensions that are NOT in the registry. */
const UNRECOGNIZED_EXTENSIONS = [".txt", ".pdf", ".doc", ".json", ".xml", ".py", ".js", ".css"];

/** Arbitrary for a simple filename stem (letters, digits, hyphens). */
const arbStem = fc
  .stringMatching(/^[a-z][a-z0-9-]*$/)
  .filter((s) => s.length >= 2 && s.length <= 20);

/** Track temp dirs for cleanup. */
const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "scanner-pbt-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
  tempDirs.length = 0;
});

describe("Scanner — Property 1: Scan completeness and exclusion", () => {
  /**
   * For any directory tree, scanDirectory returns exactly one ScannedFile for every
   * non-hidden, non-node_modules file with a recognized content extension, and returns
   * no entries for hidden files, node_modules contents, or unrecognized extensions.
   *
   * **Validates: Requirements 2.1, 2.2, 2.4**
   */
  it("returns exactly the recognized, non-hidden, non-node_modules files", () => {
    fc.assert(
      fc.property(
        fc.record({
          recognizedFiles: fc.array(fc.tuple(arbStem, fc.constantFrom(...RECOGNIZED_EXTENSIONS)), {
            minLength: 1,
            maxLength: 6,
          }),
          hiddenFiles: fc.array(fc.tuple(arbStem, fc.constantFrom(...RECOGNIZED_EXTENSIONS)), {
            minLength: 0,
            maxLength: 3,
          }),
          nodeModulesFiles: fc.array(fc.tuple(arbStem, fc.constantFrom(...RECOGNIZED_EXTENSIONS)), {
            minLength: 0,
            maxLength: 2,
          }),
          unrecognizedFiles: fc.array(
            fc.tuple(arbStem, fc.constantFrom(...UNRECOGNIZED_EXTENSIONS)),
            { minLength: 0, maxLength: 3 },
          ),
        }),
        ({ recognizedFiles, hiddenFiles, nodeModulesFiles, unrecognizedFiles }) => {
          const root = createTempDir();

          // Deduplicate filenames to avoid collisions
          const usedNames = new Set<string>();

          // Create recognized content files (should be returned)
          const expectedRelPaths = new Set<string>();
          for (const [stem, ext] of recognizedFiles) {
            const name = `${stem}${ext}`;
            if (usedNames.has(name)) continue;
            usedNames.add(name);
            const content = ext === ".md" ? "---\ntitle: test\n---\nHello" : "binary-placeholder";
            writeFileSync(join(root, name), content);
            expectedRelPaths.add(name);
          }

          // Create hidden files (should be excluded)
          for (const [stem, ext] of hiddenFiles) {
            const name = `.${stem}${ext}`;
            if (usedNames.has(name)) continue;
            usedNames.add(name);
            writeFileSync(join(root, name), "hidden");
          }

          // Create node_modules directory with files (should be excluded)
          if (nodeModulesFiles.length > 0) {
            const nmDir = join(root, "node_modules");
            mkdirSync(nmDir, { recursive: true });
            for (const [stem, ext] of nodeModulesFiles) {
              writeFileSync(join(nmDir, `${stem}${ext}`), "nm-content");
            }
          }

          // Create unrecognized extension files (should be excluded)
          for (const [stem, ext] of unrecognizedFiles) {
            const name = `${stem}${ext}`;
            if (usedNames.has(name)) continue;
            usedNames.add(name);
            writeFileSync(join(root, name), "unrecognized");
          }

          const results = scanDirectory(root);
          const resultRelPaths = new Set(results.map((r) => r.relativePath));

          // Every expected file is present
          for (const expected of expectedRelPaths) {
            expect(resultRelPaths.has(expected)).toBe(true);
          }

          // No unexpected files are present
          expect(results.length).toBe(expectedRelPaths.size);

          // No hidden files
          for (const r of results) {
            const segments = r.relativePath.split("/");
            for (const seg of segments) {
              expect(seg.startsWith(".")).toBe(false);
            }
          }

          // No node_modules files
          for (const r of results) {
            expect(r.relativePath.includes("node_modules")).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Recognized files in subdirectories are also discovered.
   *
   * **Validates: Requirement 2.1**
   */
  it("recursively discovers files in subdirectories", () => {
    fc.assert(
      fc.property(
        arbStem,
        arbStem,
        fc.constantFrom(...RECOGNIZED_EXTENSIONS),
        (dirName, fileStem, ext) => {
          const root = createTempDir();
          const subDir = join(root, dirName);
          mkdirSync(subDir, { recursive: true });

          const fileName = `${fileStem}${ext}`;
          const content = ext === ".md" ? "---\ntitle: sub\n---\nBody" : "data";
          writeFileSync(join(subDir, fileName), content);

          const results = scanDirectory(root);
          const expectedRel = `${dirName}/${fileName}`;

          expect(results.length).toBe(1);
          expect(results[0].relativePath).toBe(expectedRel);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Scanner — Property 2: Frontmatter population correctness", () => {
  /**
   * For any ScannedFile returned by the scanner, if the file's content type is "markdown"
   * then frontmatter and body are populated (non-null attempt), and if the content type
   * is not "markdown" then frontmatter is null and body is null.
   *
   * **Validates: Requirements 2.5, 2.6**
   */
  it("markdown files have non-null frontmatter and body; non-markdown have null", () => {
    fc.assert(
      fc.property(
        fc.record({
          mdFiles: fc.array(
            fc.tuple(
              arbStem,
              fc.constantFrom(...MARKDOWN_EXTENSIONS),
              fc.record({
                title: arbStem,
                tags: fc.array(arbStem, { minLength: 0, maxLength: 3 }),
              }),
              arbStem, // body text
            ),
            { minLength: 1, maxLength: 4 },
          ),
          nonMdFiles: fc.array(fc.tuple(arbStem, fc.constantFrom(...NON_MARKDOWN_EXTENSIONS)), {
            minLength: 1,
            maxLength: 4,
          }),
        }),
        ({ mdFiles, nonMdFiles }) => {
          const root = createTempDir();
          const usedNames = new Set<string>();

          // Create markdown files with frontmatter
          const expectedMdPaths = new Set<string>();
          for (const [stem, ext, fm, bodyText] of mdFiles) {
            const name = `${stem}${ext}`;
            if (usedNames.has(name)) continue;
            usedNames.add(name);
            const content = `---\ntitle: "${fm.title}"\ntags: [${fm.tags.map((t) => `"${t}"`).join(", ")}]\n---\n${bodyText}`;
            writeFileSync(join(root, name), content);
            expectedMdPaths.add(name);
          }

          // Create non-markdown files
          const expectedNonMdPaths = new Set<string>();
          for (const [stem, ext] of nonMdFiles) {
            const name = `${stem}${ext}`;
            if (usedNames.has(name)) continue;
            usedNames.add(name);
            writeFileSync(join(root, name), "binary-placeholder-data");
            expectedNonMdPaths.add(name);
          }

          const results = scanDirectory(root);

          for (const file of results) {
            if (file.contentType === "markdown") {
              // Markdown files: frontmatter and body should be non-null
              expect(file.frontmatter).not.toBeNull();
              expect(file.body).not.toBeNull();
              expect(typeof file.body).toBe("string");
            } else {
              // Non-markdown files: frontmatter and body must be null
              expect(file.frontmatter).toBeNull();
              expect(file.body).toBeNull();
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Markdown frontmatter fields are correctly parsed into the frontmatter object.
   *
   * **Validates: Requirement 2.5**
   */
  it("markdown frontmatter fields are correctly parsed", () => {
    fc.assert(
      fc.property(
        arbStem,
        fc.constantFrom(...MARKDOWN_EXTENSIONS),
        arbStem,
        arbStem,
        (stem, ext, title, bodyText) => {
          const root = createTempDir();
          const name = `${stem}${ext}`;
          const content = `---\ntitle: "${title}"\n---\n${bodyText}`;
          writeFileSync(join(root, name), content);

          const results = scanDirectory(root);
          expect(results.length).toBe(1);

          const file = results[0];
          expect(file.frontmatter).not.toBeNull();
          expect(file.frontmatter?.title).toBe(title);
          expect(file.body).not.toBeNull();
          expect(file.body?.trim()).toBe(bodyText);
        },
      ),
      { numRuns: 100 },
    );
  });
});
