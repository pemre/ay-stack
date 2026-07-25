import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { extractDate, isValidDate } from "./dateExtractor.ts";

/**
 * Property-based tests for the Date Extractor.
 *
 * Tests Properties 4, 5, and 6 from the design document.
 */

/**
 * Arbitrary for a valid calendar date as { year, month, day, dateStr, dateObj }.
 * Uses integer-based generation with day capped at 28 to guarantee validity
 * for all months. Date objects use UTC noon to avoid timezone boundary issues
 * with toISOString().
 */
const arbValidDate = fc
  .record({
    year: fc.integer({ min: 1900, max: 2099 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 28 }),
  })
  .map(({ year, month, day }) => {
    const dateStr = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return { year, month, day, dateStr, dateObj };
  });

/** Arbitrary for a simple filename stem (no dots, no slashes). */
const arbStem = fc
  .stringMatching(/^[a-zA-Z][a-zA-Z0-9_-]*$/)
  .filter((s) => s.length >= 1 && s.length <= 30);

/** Arbitrary for a file extension. */
const arbExt = fc.constantFrom(".md", ".jpg", ".png", ".mp4", ".mp3");

describe("Date Extractor — Property 4: Date extraction priority chain", () => {
  /**
   * For any file with a valid frontmatter date AND a valid filename date prefix,
   * extractDate returns the frontmatter date.
   *
   * **Validates: Requirements 4.1, 4.2, 4.3**
   */
  it("frontmatter date takes priority over filename date prefix", () => {
    fc.assert(
      fc.property(arbValidDate, arbValidDate, arbStem, arbExt, (fmDate, fileDate, stem, ext) => {
        const relativePath = `${fileDate.dateStr}-${stem}${ext}`;
        const frontmatter = { date: fmDate.dateStr };
        const result = extractDate(relativePath, frontmatter);
        expect(result).toBe(fmDate.dateStr);
      }),
      { numRuns: 300 },
    );
  });

  /**
   * For any file without a frontmatter date but with a valid filename date prefix,
   * extractDate returns the filename date.
   *
   * **Validates: Requirements 4.1, 4.2**
   */
  it("filename date prefix is used when no frontmatter date exists", () => {
    fc.assert(
      fc.property(arbValidDate, arbStem, arbExt, (fileDate, stem, ext) => {
        const relativePath = `${fileDate.dateStr}-${stem}${ext}`;
        const result = extractDate(relativePath, null);
        expect(result).toBe(fileDate.dateStr);
      }),
      { numRuns: 300 },
    );
  });

  /**
   * For any file where only the parent folder has a valid date prefix,
   * extractDate returns the folder date.
   *
   * **Validates: Requirements 4.2, 4.3**
   */
  it("parent folder date prefix is used when no frontmatter or filename date exists", () => {
    fc.assert(
      fc.property(
        arbValidDate,
        arbStem,
        arbStem,
        arbExt,
        (folderDate, folderStem, fileStem, ext) => {
          const relativePath = `${folderDate.dateStr}-${folderStem}/${fileStem}${ext}`;
          const result = extractDate(relativePath, null);
          expect(result).toBe(folderDate.dateStr);
        },
      ),
      { numRuns: 300 },
    );
  });

  /**
   * Frontmatter date takes priority over folder date as well.
   *
   * **Validates: Requirements 4.1, 4.3**
   */
  it("frontmatter date takes priority over folder date prefix", () => {
    fc.assert(
      fc.property(
        arbValidDate,
        arbValidDate,
        arbStem,
        arbStem,
        arbExt,
        (fmDate, folderDate, folderStem, fileStem, ext) => {
          const relativePath = `${folderDate.dateStr}-${folderStem}/${fileStem}${ext}`;
          const frontmatter = { date: fmDate.dateStr };
          const result = extractDate(relativePath, frontmatter);
          expect(result).toBe(fmDate.dateStr);
        },
      ),
      { numRuns: 300 },
    );
  });
});

describe("Date Extractor — Property 5: Date output validity", () => {
  /**
   * For any non-null value returned by extractDate, the value is a valid
   * calendar date in YYYY-MM-DD ISO format.
   *
   * **Validates: Requirements 4.5, 4.7**
   */
  it("non-null results are always valid YYYY-MM-DD calendar dates", () => {
    const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

    fc.assert(
      fc.property(
        arbValidDate,
        arbStem,
        arbExt,
        fc.constantFrom("frontmatter", "filename", "folder") as fc.Arbitrary<string>,
        (date, stem, ext, source) => {
          let relativePath: string;
          let frontmatter: Record<string, unknown> | null = null;

          if (source === "frontmatter") {
            relativePath = `${stem}${ext}`;
            frontmatter = { date: date.dateStr };
          } else if (source === "filename") {
            relativePath = `${date.dateStr}-${stem}${ext}`;
          } else {
            relativePath = `${date.dateStr}-${stem}/${stem}${ext}`;
          }

          const result = extractDate(relativePath, frontmatter);

          if (result !== null) {
            expect(result).toMatch(ISO_DATE_RE);
            expect(isValidDate(result)).toBe(true);
          }
        },
      ),
      { numRuns: 300 },
    );
  });

  /**
   * For any input where the extracted date string represents an invalid calendar date,
   * extractDate returns null.
   *
   * **Validates: Requirements 4.5, 4.7**
   */
  it("returns null for invalid calendar dates", () => {
    const invalidDates = [
      "2025-13-01", // month > 12
      "2025-00-15", // month 0
      "2025-02-30", // Feb 30
      "2025-04-31", // Apr 31
      "2025-06-31", // Jun 31
      "2025-11-31", // Nov 31
      "2025-02-29", // non-leap year
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...invalidDates),
        arbStem,
        arbExt,
        fc.constantFrom("frontmatter", "filename", "folder") as fc.Arbitrary<string>,
        (invalidDate, stem, ext, source) => {
          let relativePath: string;
          let frontmatter: Record<string, unknown> | null = null;

          if (source === "frontmatter") {
            relativePath = `${stem}${ext}`;
            frontmatter = { date: invalidDate };
          } else if (source === "filename") {
            relativePath = `${invalidDate}-${stem}${ext}`;
          } else {
            relativePath = `${invalidDate}-${stem}/${stem}${ext}`;
          }

          const result = extractDate(relativePath, frontmatter);
          expect(result).toBeNull();
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe("Date Extractor — Property 6: Date format equivalence", () => {
  /**
   * For any valid calendar date, providing it as a Date object or as a
   * YYYY-MM-DD string in frontmatter produces the same extractDate output.
   *
   * **Validates: Requirement 4.6**
   */
  it("Date object and YYYY-MM-DD string in frontmatter produce the same result", () => {
    fc.assert(
      fc.property(arbValidDate, arbStem, arbExt, (date, stem, ext) => {
        const relativePath = `${stem}${ext}`;

        const resultFromString = extractDate(relativePath, { date: date.dateStr });
        const resultFromDateObj = extractDate(relativePath, { date: date.dateObj });

        expect(resultFromString).toBe(resultFromDateObj);
      }),
      { numRuns: 300 },
    );
  });

  /**
   * Both formats produce the expected date string value.
   *
   * **Validates: Requirement 4.6**
   */
  it("both Date object and string format return the correct date value", () => {
    fc.assert(
      fc.property(arbValidDate, arbStem, arbExt, (date, stem, ext) => {
        const relativePath = `${stem}${ext}`;

        const resultFromString = extractDate(relativePath, { date: date.dateStr });
        const resultFromDateObj = extractDate(relativePath, { date: date.dateObj });

        expect(resultFromString).toBe(date.dateStr);
        expect(resultFromDateObj).toBe(date.dateStr);
      }),
      { numRuns: 300 },
    );
  });
});
