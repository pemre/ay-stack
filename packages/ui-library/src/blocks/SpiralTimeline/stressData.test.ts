import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { generateStressData } from "./stressData.ts";

const VALID_TYPES = ["history", "cinema", "literature", "science"];

/** Arbitrary for valid stress data options with startYear < endYear */
const arbOptions = fc
  .integer({ min: 1900, max: 2020 })
  .chain((startYear) =>
    fc.tuple(
      fc.integer({ min: 1, max: 500 }),
      fc.constant(startYear),
      fc.integer({ min: startYear + 1, max: startYear + 200 }),
    ),
  )
  .map(([count, startYear, endYear]) => ({ count, startYear, endYear }));

describe("generateStressData", () => {
  // Feature: spiral-timeline-perf-story, Property 1: Generator output length matches requested count
  it("Property 1: output length matches requested count", () => {
    fc.assert(
      fc.property(arbOptions, ({ count, startYear, endYear }) => {
        const result = generateStressData({ count, startYear, endYear });
        expect(result).toHaveLength(count);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: spiral-timeline-perf-story, Property 2: All generated dates fall within the specified range
  it("Property 2: all generated dates fall within the specified range", () => {
    fc.assert(
      fc.property(arbOptions, ({ count, startYear, endYear }) => {
        const result = generateStressData({ count, startYear, endYear });
        const rangeStart = new Date(startYear, 0, 1).getTime();
        const rangeEnd = new Date(endYear, 0, 1).getTime();
        for (const node of result) {
          expect(node.date.getTime()).toBeGreaterThanOrEqual(rangeStart);
          expect(node.date.getTime()).toBeLessThan(rangeEnd);
        }
      }),
      { numRuns: 100 },
    );
  });

  // Feature: spiral-timeline-perf-story, Property 3: All generated nodes have valid fields
  it("Property 3: all generated nodes have valid fields", () => {
    fc.assert(
      fc.property(arbOptions, ({ count, startYear, endYear }) => {
        const result = generateStressData({ count, startYear, endYear });
        for (const node of result) {
          expect(VALID_TYPES).toContain(node.type);
          expect(node.title.length).toBeGreaterThan(0);
          expect(node.content.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 },
    );
  });

  // Feature: spiral-timeline-perf-story, Property 4: Generator determinism
  it("Property 4: generator determinism", () => {
    fc.assert(
      fc.property(arbOptions, ({ count, startYear, endYear }) => {
        const a = generateStressData({ count, startYear, endYear });
        const b = generateStressData({ count, startYear, endYear });
        expect(a).toEqual(b);
      }),
      { numRuns: 100 },
    );
  });

  // Edge case unit tests
  describe("edge cases", () => {
    it("returns empty array for count: 0", () => {
      expect(generateStressData({ count: 0, startYear: 2000, endYear: 2003 })).toEqual([]);
    });

    it("returns empty array for startYear >= endYear", () => {
      expect(generateStressData({ count: 10, startYear: 2005, endYear: 2005 })).toEqual([]);
      expect(generateStressData({ count: 10, startYear: 2010, endYear: 2005 })).toEqual([]);
    });

    it("returns a single valid node for count: 1", () => {
      const result = generateStressData({ count: 1, startYear: 2000, endYear: 2003 });
      expect(result).toHaveLength(1);
      const node = result[0];
      expect(node.id).toBe("stress-0");
      expect(node.title).toBe("Node 0");
      expect(VALID_TYPES).toContain(node.type);
      expect(node.date.getTime()).toBeGreaterThanOrEqual(new Date(2000, 0, 1).getTime());
      expect(node.date.getTime()).toBeLessThan(new Date(2003, 0, 1).getTime());
    });
  });
});

// Feature: spiral-timeline-perf-story, Property 5: Rendered data node count matches nodeCount argument
it("Property 5: rendered data node count matches nodeCount argument", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 5 }).map((n) => n * 100),
      (nodeCount) => {
        const now = new Date();
        const endYear = now.getFullYear() + 1;
        const startYear = endYear - 3;
        const data = generateStressData({ count: nodeCount, startYear, endYear });
        expect(data).toHaveLength(nodeCount);
      },
    ),
    { numRuns: 100 },
  );
});
