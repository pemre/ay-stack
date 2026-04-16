import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { CONTENT_TYPE_REGISTRY, detectContentType } from "./contentTypeRegistry.ts";

/**
 * Property-based tests for the Content Type Registry.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 *
 * Property 3: Content type extension mapping
 */

/** All registered extensions paired with their expected content type. */
const REGISTERED_EXTENSIONS = CONTENT_TYPE_REGISTRY.flatMap((def) =>
    def.extensions.map((ext) => ({ ext, type: def.type })),
);

/** Just the raw extension strings for use in generators. */
const REGISTERED_EXT_STRINGS = REGISTERED_EXTENSIONS.map((e) => e.ext);

/** Arbitrary for generating a simple filename (no dots, no path separators). */
const arbFilename = fc
    .stringMatching(/^[a-zA-Z0-9_-]+$/)
    .filter((s) => s.length >= 1 && s.length <= 50);

/** Arbitrary for generating an optional directory prefix. */
const arbDirPrefix = fc.constantFrom("", "docs/", "content/photos/", "a/b/c/");

/**
 * Generate a mixed-case variant of a string.
 * For each character, randomly choose upper or lower case.
 */
const arbMixedCase = (ext: string) =>
    fc
        .array(fc.boolean(), { minLength: ext.length, maxLength: ext.length })
        .map((flags) =>
            ext
                .split("")
                .map((ch, i) => (flags[i] ? ch.toUpperCase() : ch.toLowerCase()))
                .join(""),
        );

describe("Content Type Registry — Property 3: Content type extension mapping", () => {
    /**
     * For any file path with a registered extension (regardless of case),
     * `detectContentType` returns the correct `ContentType` for that extension.
     *
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6**
     */
    it("returns the correct ContentType for any registered extension in any case", () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...REGISTERED_EXTENSIONS).chain(({ ext, type }) =>
                    fc.tuple(
                        arbDirPrefix,
                        arbFilename,
                        arbMixedCase(ext),
                        fc.constant(type),
                    ),
                ),
                ([dir, name, mixedExt, expectedType]) => {
                    const filePath = `${dir}${name}${mixedExt}`;
                    const result = detectContentType(filePath);
                    expect(result).toBe(expectedType);
                },
            ),
            { numRuns: 300 },
        );
    });

    /**
     * For any file path with an unregistered extension,
     * `detectContentType` returns `null`.
     *
     * **Validates: Requirement 3.5**
     */
    it("returns null for any unregistered extension", () => {
        const unregisteredExts = [
            ".txt", ".pdf", ".doc", ".docx", ".xls", ".xlsx",
            ".ppt", ".json", ".xml", ".yaml", ".yml", ".csv",
            ".zip", ".tar", ".gz", ".exe", ".bat", ".sh",
            ".py", ".js", ".ts", ".tsx", ".jsx", ".css",
            ".html", ".htm", ".rtf", ".bmp", ".tiff",
        ];

        fc.assert(
            fc.property(
                fc.constantFrom(...unregisteredExts),
                arbDirPrefix,
                arbFilename,
                (ext, dir, name) => {
                    const filePath = `${dir}${name}${ext}`;
                    const result = detectContentType(filePath);
                    expect(result).toBeNull();
                },
            ),
            { numRuns: 200 },
        );
    });

    /**
     * The same input always produces the same output (deterministic behavior).
     *
     * **Validates: Requirement 3.6**
     */
    it("is deterministic — same input always produces the same output", () => {
        fc.assert(
            fc.property(
                arbDirPrefix,
                arbFilename,
                fc.constantFrom(...REGISTERED_EXT_STRINGS, ".txt", ".pdf", ".unknown", ""),
                (dir, name, ext) => {
                    const filePath = `${dir}${name}${ext}`;
                    const first = detectContentType(filePath);
                    const second = detectContentType(filePath);
                    expect(first).toBe(second);
                },
            ),
            { numRuns: 200 },
        );
    });
});
