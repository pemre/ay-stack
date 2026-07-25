// Feature: react-grid-layout-widgets, Property 2: Minimum widget size invariant

import * as fc from "fast-check";
import { describe, it } from "vitest";
import { DEFAULT_LAYOUTS } from "./defaultLayouts";

/**
 * Validates: Requirements 3.2
 *
 * Property 2: Minimum widget size invariant
 * For any layout item in DEFAULT_LAYOUTS across all breakpoints,
 * minW >= 2, minH >= 2, w >= minW, and h >= minH must all hold.
 */
describe("DEFAULT_LAYOUTS — minimum widget size invariant", () => {
  it("all items across all breakpoints satisfy w >= minW >= 2 and h >= minH >= 2", () => {
    const breakpoints = Object.keys(DEFAULT_LAYOUTS) as Array<keyof typeof DEFAULT_LAYOUTS>;

    fc.assert(
      fc.property(fc.constantFrom(...breakpoints), (breakpoint) => {
        const items = DEFAULT_LAYOUTS[breakpoint] ?? [];
        for (const item of items) {
          const minW = item.minW ?? 1;
          const minH = item.minH ?? 1;

          if (minW < 2) return false;
          if (minH < 2) return false;
          if (item.w < minW) return false;
          if (item.h < minH) return false;
        }
        return true;
      }),
    );
  });
});
