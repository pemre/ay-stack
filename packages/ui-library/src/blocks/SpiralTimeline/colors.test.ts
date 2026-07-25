import { interpolateCool, interpolateRainbow, interpolateSpectral, interpolateWarm } from "d3";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { computeFogOpacity, getColorInterpolator, getYearColor } from "./colors.ts";
import type { ColorScale, FogConfig } from "./types.ts";

// Feature: d3-timeline-widget, Property 11: Ring gradient color interpolation — getYearColor matches D3 interpolator at (offset % 10) / 10

const allScales: ColorScale[] = ["spectral", "rainbow", "cool", "warm"];

const scaleToD3: Record<ColorScale, (t: number) => string> = {
  spectral: interpolateSpectral,
  rainbow: interpolateRainbow,
  cool: interpolateCool,
  warm: interpolateWarm,
};

describe("colors – Property 11: Ring gradient color interpolation", () => {
  it("getYearColor matches the D3 interpolator at (offset % 10) / 10 for any scale and offset", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allScales),
        fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
        (scale, offset) => {
          const interpolator = getColorInterpolator(scale);
          const actual = getYearColor(offset, interpolator);
          const t = (((offset % 10) + 10) % 10) / 10;
          const expected = scaleToD3[scale](t);
          expect(actual).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("getColorInterpolator returns the correct D3 interpolator for each scale", () => {
    fc.assert(
      fc.property(fc.constantFrom(...allScales), (scale) => {
        const interpolator = getColorInterpolator(scale);
        // Verify at a known t value
        expect(interpolator(0.5)).toBe(scaleToD3[scale](0.5));
      }),
      { numRuns: 100 },
    );
  });

  it("integer offsets produce the same color as the D3 interpolator at (offset % 10) / 10", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allScales),
        fc.integer({ min: -100, max: 100 }),
        (scale, offset) => {
          const interpolator = getColorInterpolator(scale);
          const actual = getYearColor(offset, interpolator);
          const t = (((offset % 10) + 10) % 10) / 10;
          const expected = scaleToD3[scale](t);
          expect(actual).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("offsets differing by 10 produce the same color (period-10 cycling)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allScales),
        fc.double({ min: -500, max: 500, noNaN: true, noDefaultInfinity: true }),
        (scale, offset) => {
          const interpolator = getColorInterpolator(scale);
          const color1 = getYearColor(offset, interpolator);
          const color2 = getYearColor(offset + 10, interpolator);
          expect(color1).toBe(color2);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("offset 0 maps to t=0 in the interpolator", () => {
    fc.assert(
      fc.property(fc.constantFrom(...allScales), (scale) => {
        const interpolator = getColorInterpolator(scale);
        const actual = getYearColor(0, interpolator);
        const expected = scaleToD3[scale](0);
        expect(actual).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: d3-timeline-widget, Property 10: Fog opacity scaling — rings ≤ startRing have opacity 1, rings beyond decrease proportionally; fog disabled → uniform opacity

describe("colors – Property 10: Fog opacity scaling", () => {
  const fogConfigArb = fc.record({
    enabled: fc.boolean(),
    startRing: fc.integer({ min: 0, max: 20 }),
    intensity: fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
  }) as fc.Arbitrary<FogConfig>;

  it("rings at or before startRing always have opacity 1 when fog is enabled", () => {
    fc.assert(
      fc.property(
        fogConfigArb.filter((cfg) => cfg.enabled),
        fc.integer({ min: 1, max: 50 }),
        (fog, totalRings) => {
          for (let ring = 0; ring <= fog.startRing; ring++) {
            expect(computeFogOpacity(ring, fog, totalRings)).toBe(1);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("rings beyond startRing have opacity < 1 when fog is enabled with meaningful intensity", () => {
    fc.assert(
      fc.property(
        fogConfigArb.filter((cfg) => cfg.enabled && cfg.intensity >= 0.01),
        fc.integer({ min: 2, max: 50 }),
        (fog, totalRings) => {
          const ringBeyond = fog.startRing + 1;
          if (ringBeyond < totalRings) {
            const opacity = computeFogOpacity(ringBeyond, fog, totalRings);
            expect(opacity).toBeLessThan(1);
            expect(opacity).toBeGreaterThanOrEqual(0.1);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("fog opacity decreases monotonically for rings beyond startRing", () => {
    fc.assert(
      fc.property(
        fogConfigArb.filter((cfg) => cfg.enabled && cfg.intensity > 0),
        fc.integer({ min: 3, max: 50 }),
        (fog, totalRings) => {
          let prevOpacity = computeFogOpacity(fog.startRing, fog, totalRings);
          for (let ring = fog.startRing + 1; ring < totalRings; ring++) {
            const opacity = computeFogOpacity(ring, fog, totalRings);
            expect(opacity).toBeLessThanOrEqual(prevOpacity);
            prevOpacity = opacity;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("all rings have opacity 1 when fog is disabled", () => {
    fc.assert(
      fc.property(
        fogConfigArb.map((cfg) => ({ ...cfg, enabled: false })),
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        (fog, ringIndex, totalRings) => {
          expect(computeFogOpacity(ringIndex, fog, totalRings)).toBe(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("fog opacity is always clamped to at least 0.1", () => {
    fc.assert(
      fc.property(
        fogConfigArb,
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 1, max: 50 }),
        (fog, ringIndex, totalRings) => {
          const opacity = computeFogOpacity(ringIndex, fog, totalRings);
          expect(opacity).toBeGreaterThanOrEqual(0.1);
          expect(opacity).toBeLessThanOrEqual(1);
        },
      ),
      { numRuns: 100 },
    );
  });
});
