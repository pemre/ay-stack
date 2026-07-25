import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { computeMaxRadius, dateToSpiral } from "./geometry.ts";

// Feature: d3-timeline-widget, Property 2: Angle mapping — January at 12 o'clock, one year per rotation

/**
 * Helper: compute day-of-year the same way the geometry module does internally.
 * Jan 1 → 1, Jan 2 → 2, etc.
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

describe("geometry – Property 2: Angle mapping", () => {
  const EPSILON = 1e-9;

  it("January 1 maps to angle ≈ −π/2 (12 o'clock) for any year and radiusIncrement", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1900, max: 2100 }),
        fc.double({ min: 1, max: 500, noNaN: true }),
        (year, radiusIncrement) => {
          const jan1 = new Date(year, 0, 1);
          const result = dateToSpiral(jan1, year, radiusIncrement);

          // getDayOfYear(Jan 1) = 1, so totalRotations = 0 + 1/365
          // angle = -π/2 - (1/365) × 2π
          const expectedAngle = -Math.PI / 2 - (1 / 365) * 2 * Math.PI;
          expect(result.angle).toBeCloseTo(expectedAngle, 6);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("angle follows the Archimedean formula: −π/2 − (yearDiff + dayOfYear/365) × 2π", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1900, max: 2100 }),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 1, max: 28 }),
        fc.integer({ min: 1800, max: 2100 }),
        fc.double({ min: 1, max: 500, noNaN: true }),
        (year, month, day, oldestYear, radiusIncrement) => {
          // Ensure date is after oldestYear so yearDiff ≥ 0
          const effectiveOldest = Math.min(oldestYear, year);
          const date = new Date(year, month, day);
          const result = dateToSpiral(date, effectiveOldest, radiusIncrement);

          const yearDiff = date.getFullYear() - effectiveOldest;
          const dayFrac = getDayOfYear(date) / 365;
          const totalRotations = yearDiff + dayFrac;
          const expectedAngle = -Math.PI / 2 - totalRotations * 2 * Math.PI;

          expect(result.angle).toBeCloseTo(expectedAngle, 9);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("one full year of rotation: yearDiff +1 shifts angle by exactly 2π", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1900, max: 2100 }),
        fc.double({ min: 1, max: 500, noNaN: true }),
        (oldestYear, radiusIncrement) => {
          // Use spiralPointAt-equivalent: same fractional day, just +1 year apart.
          // dateToSpiral for two dates with identical dayOfYear but yearDiff differing by 1.
          // Construct dates in the same (non-leap) year to guarantee identical getDayOfYear.
          // Use Jan 15 in two consecutive years where neither crosses a leap boundary issue.
          const d1 = new Date(2001, 0, 15); // 2001 is not a leap year
          const d2 = new Date(2002, 0, 15); // 2002 is not a leap year

          const p1 = dateToSpiral(d1, oldestYear, radiusIncrement);
          const p2 = dateToSpiral(d2, oldestYear, radiusIncrement);

          // yearDiff differs by exactly 1, dayOfYear is identical → angle diff = 2π
          const angleDiff = Math.abs(p1.angle - p2.angle);
          expect(angleDiff).toBeCloseTo(2 * Math.PI, 9);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("angle decreases (becomes more negative) as dates move forward in time", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1900, max: 2090 }),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 1, max: 28 }),
        fc.integer({ min: 1, max: 3650 }),
        fc.double({ min: 1, max: 500, noNaN: true }),
        (year, month, day, daysLater, radiusIncrement) => {
          const oldestYear = year - 10;
          const d1 = new Date(year, month, day);
          const d2 = new Date(d1.getTime() + daysLater * 86400000);

          const p1 = dateToSpiral(d1, oldestYear, radiusIncrement);
          const p2 = dateToSpiral(d2, oldestYear, radiusIncrement);

          // Later date → larger totalRotations → more negative angle
          expect(p2.angle).toBeLessThan(p1.angle + EPSILON);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: d3-timeline-widget, Property 3: Radial distance monotonicity — more recent dates closer to center

describe("geometry – Property 3: Radial distance monotonicity", () => {
  /**
   * In the spiral layout, oldestYear sits at the center (radius ≈ 0) and
   * dates further from oldestYear spiral outward. Given a fixed oldestYear,
   * a more recent date (larger yearDiff from oldestYear) has a strictly
   * larger radius than an older date (smaller yearDiff).
   *
   * For any two dates d1, d2 where d1 > d2 (d1 is more recent) and both
   * are after oldestYear, radius(d1) > radius(d2).
   */
  it("for two dates after oldestYear, the more recent date has a strictly larger radius", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1900, max: 2090 }),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 1, max: 28 }),
        fc.integer({ min: 1, max: 3650 }),
        fc.double({ min: 1, max: 500, noNaN: true }),
        (year, month, day, daysLater, radiusIncrement) => {
          const oldestYear = year - 10;
          const d1 = new Date(year, month, day);
          const d2 = new Date(d1.getTime() + daysLater * 86400000);

          const p1 = dateToSpiral(d1, oldestYear, radiusIncrement);
          const p2 = dateToSpiral(d2, oldestYear, radiusIncrement);

          // d2 is more recent (later) than d1, so d2 should have larger radius
          expect(p2.radius).toBeGreaterThan(p1.radius);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("radius is zero at oldestYear and increases monotonically with time", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1900, max: 2100 }),
        fc.double({ min: 1, max: 500, noNaN: true }),
        (oldestYear, radiusIncrement) => {
          // A date at exactly oldestYear Jan 1 has dayOfYear=1, so radius > 0 but tiny
          // Dates further from oldestYear have progressively larger radii
          const dates = [
            new Date(oldestYear, 0, 1),
            new Date(oldestYear, 6, 1),
            new Date(oldestYear + 1, 0, 1),
            new Date(oldestYear + 2, 0, 1),
            new Date(oldestYear + 5, 0, 1),
          ];

          const radii = dates.map((d) => dateToSpiral(d, oldestYear, radiusIncrement).radius);

          for (let i = 1; i < radii.length; i++) {
            expect(radii[i]).toBeGreaterThan(radii[i - 1]);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("radius is always non-negative for dates at or after oldestYear", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1900, max: 2100 }),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 1, max: 28 }),
        fc.double({ min: 1, max: 500, noNaN: true }),
        (year, month, day, radiusIncrement) => {
          const oldestYear = year - 5;
          const date = new Date(year, month, day);
          const result = dateToSpiral(date, oldestYear, radiusIncrement);

          expect(result.radius).toBeGreaterThanOrEqual(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("radius equals totalRotations × radiusIncrement", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1900, max: 2100 }),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 1, max: 28 }),
        fc.double({ min: 1, max: 500, noNaN: true }),
        (year, month, day, radiusIncrement) => {
          const oldestYear = year - 5;
          const date = new Date(year, month, day);
          const result = dateToSpiral(date, oldestYear, radiusIncrement);

          const yearDiff = date.getFullYear() - oldestYear;
          const doy = getDayOfYear(date);
          const totalRotations = yearDiff + doy / 365;
          const expectedRadius = totalRotations * radiusIncrement;

          expect(result.radius).toBeCloseTo(expectedRadius, 9);
        },
      ),
      { numRuns: 100 },
    );
  });
});

import { yearLabelPositionToAngle } from "./geometry.ts";
import type { YearLabelPosition } from "./types.ts";

// Feature: d3-timeline-widget, Property 4: Year label position angle mapping — all 8 positions map to correct radians

describe("geometry – Property 4: Year label position angle mapping", () => {
  /**
   * Expected mapping from the design document:
   *   top → −π/2, right → 0, bottom → π/2, left → π
   *   top-right → −π/4, top-left → −3π/4
   *   bottom-right → π/4, bottom-left → 3π/4
   */
  const expectedAngles: Record<YearLabelPosition, number> = {
    top: -Math.PI / 2,
    right: 0,
    bottom: Math.PI / 2,
    left: Math.PI,
    "top-right": -Math.PI / 4,
    "top-left": (-3 * Math.PI) / 4,
    "bottom-right": Math.PI / 4,
    "bottom-left": (3 * Math.PI) / 4,
  };

  const allPositions: YearLabelPosition[] = [
    "top",
    "right",
    "bottom",
    "left",
    "top-right",
    "top-left",
    "bottom-right",
    "bottom-left",
  ];

  it("every YearLabelPosition maps to its expected radian value", () => {
    fc.assert(
      fc.property(fc.constantFrom(...allPositions), (position) => {
        const actual = yearLabelPositionToAngle(position);
        const expected = expectedAngles[position];
        expect(actual).toBeCloseTo(expected, 10);
      }),
      { numRuns: 100 },
    );
  });

  it("the mapping is exhaustive — all 8 positions produce distinct angles", () => {
    const angles = new Set(allPositions.map((p) => yearLabelPositionToAngle(p).toFixed(10)));
    expect(angles.size).toBe(8);
  });

  it("cardinal positions are exactly π/2 apart", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          ["top", "right"] as const,
          ["right", "bottom"] as const,
          ["bottom", "left"] as const,
        ),
        ([a, b]) => {
          const angleA = yearLabelPositionToAngle(a);
          const angleB = yearLabelPositionToAngle(b);
          expect(Math.abs(angleB - angleA)).toBeCloseTo(Math.PI / 2, 10);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("diagonal positions are exactly π/4 from each adjacent cardinal (shortest arc)", () => {
    /** Shortest angular distance, accounting for wrap-around. */
    function angularDistance(a: number, b: number): number {
      let d = Math.abs(a - b) % (2 * Math.PI);
      if (d > Math.PI) d = 2 * Math.PI - d;
      return d;
    }

    fc.assert(
      fc.property(
        fc.constantFrom(
          ["top", "top-right"] as const,
          ["right", "top-right"] as const,
          ["top", "top-left"] as const,
          ["left", "top-left"] as const,
          ["bottom", "bottom-right"] as const,
          ["right", "bottom-right"] as const,
          ["bottom", "bottom-left"] as const,
          ["left", "bottom-left"] as const,
        ),
        ([cardinal, diagonal]) => {
          const cAngle = yearLabelPositionToAngle(cardinal);
          const dAngle = yearLabelPositionToAngle(diagonal);
          expect(angularDistance(cAngle, dAngle)).toBeCloseTo(Math.PI / 4, 10);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: d3-timeline-widget, Property 13: Responsive radius — maxRadius = min(w, h) × 0.4

describe("geometry – Property 13: Responsive radius computation", () => {
  it("maxRadius equals min(width, height) × 0.4 for any positive dimensions", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 10000, noNaN: true }),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        (width, height) => {
          const result = computeMaxRadius(width, height);
          const expected = Math.min(width, height) * 0.4;
          expect(result).toBeCloseTo(expected, 10);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("maxRadius is determined by the smaller dimension regardless of which is smaller", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 10000, noNaN: true }),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        (a, b) => {
          // Swapping width and height should yield the same result
          expect(computeMaxRadius(a, b)).toBeCloseTo(computeMaxRadius(b, a), 10);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("maxRadius scales linearly — doubling both dimensions doubles the radius", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 5000, noNaN: true }),
        fc.double({ min: 1, max: 5000, noNaN: true }),
        fc.double({ min: 0.5, max: 4, noNaN: true }),
        (width, height, scale) => {
          const r1 = computeMaxRadius(width, height);
          const r2 = computeMaxRadius(width * scale, height * scale);
          expect(r2).toBeCloseTo(r1 * scale, 6);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("maxRadius is always positive for positive dimensions", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.001, max: 10000, noNaN: true }),
        fc.double({ min: 0.001, max: 10000, noNaN: true }),
        (width, height) => {
          expect(computeMaxRadius(width, height)).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("square containers yield maxRadius = width × 0.4", () => {
    fc.assert(
      fc.property(fc.double({ min: 1, max: 10000, noNaN: true }), (size) => {
        expect(computeMaxRadius(size, size)).toBeCloseTo(size * 0.4, 10);
      }),
      { numRuns: 100 },
    );
  });
});
