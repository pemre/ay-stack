// Feature: react-grid-layout-widgets
// Properties 1, 3, 4 + unit tests for useLayoutPersistence

import { act, renderHook } from "@testing-library/react";
import * as fc from "fast-check";
import type { LayoutItem, ResponsiveLayouts } from "react-grid-layout";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_LAYOUTS } from "../components/WidgetGrid/defaultLayouts";
import { WIDGET_IDS } from "../components/WidgetGrid/widgetRegistry";
import { useLayoutPersistence } from "./useLayoutPersistence";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const WIDGET_ID_VALUES = Object.values(WIDGET_IDS) as string[];

/** Generates a valid LayoutItem with a known widget ID and w/h >= 2 */
const arbitraryLayoutItem = (id: string): fc.Arbitrary<LayoutItem> =>
  fc.record({
    i: fc.constant(id),
    x: fc.nat({ max: 10 }),
    y: fc.nat({ max: 20 }),
    w: fc.integer({ min: 2, max: 12 }),
    h: fc.integer({ min: 2, max: 12 }),
  });

/** Generates a valid ResponsiveLayouts with all five breakpoints */
const arbitraryLayouts: fc.Arbitrary<ResponsiveLayouts> = fc
  .tuple(...WIDGET_ID_VALUES.map((id) => arbitraryLayoutItem(id)))
  .chain((lgItems) =>
    fc.record({
      lg: fc.constant(lgItems),
      md: fc.constant(lgItems),
      sm: fc.constant(lgItems),
      xs: fc.constant(lgItems),
      xxs: fc.constant(lgItems),
    }),
  );

/** Generates strings that are NOT valid Layouts JSON */
const arbitraryCorruptedString: fc.Arbitrary<string> = fc.oneof(
  fc.string(),
  fc.constant(""),
  fc.constant("null"),
  fc.constant("[]"),
  fc.constant("{}"),
  fc.constant('{"lg":null}'),
  fc.constant('{"lg":[{"i":"sidebar","x":0,"y":0,"w":1,"h":1}]}'), // w/h < 2
  fc.constant('{"lg":[{"i":"unknown","x":0,"y":0,"w":3,"h":3}]}'), // unknown id
  fc.constant('{"lg":[{"x":0,"y":0,"w":3,"h":3}]}'), // missing i
  fc.constant("{not valid json"),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LAYOUTS_KEY = "burkut-widget-layouts";
const VISIBILITY_KEY = "burkut-widget-visibility";

function clearStorage() {
  localStorage.removeItem(LAYOUTS_KEY);
  localStorage.removeItem(VISIBILITY_KEY);
}

// ---------------------------------------------------------------------------
// Property 1: Layout persistence round trip
// Validates: Requirements 4.1, 4.2
// ---------------------------------------------------------------------------

describe("Property 1: Layout persistence round trip", () => {
  beforeEach(clearStorage);
  afterEach(clearStorage);

  it("saving via onLayoutChange and re-initializing returns equivalent layouts", () => {
    fc.assert(
      fc.property(arbitraryLayouts, (layouts) => {
        clearStorage();

        // First render — save layouts
        const { result: first, unmount } = renderHook(() => useLayoutPersistence());
        act(() => {
          first.current.onLayoutChange(layouts.lg ?? [], layouts);
        });
        unmount();

        // Second render — should restore saved layouts
        const { result: second } = renderHook(() => useLayoutPersistence());
        expect(second.current.layouts).toEqual(layouts);
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: Corrupted data fallback
// Validates: Requirements 4.4
// ---------------------------------------------------------------------------

describe("Property 3: Corrupted data fallback", () => {
  beforeEach(clearStorage);
  afterEach(clearStorage);

  it("returns DEFAULT_LAYOUTS for any invalid localStorage value without throwing", () => {
    fc.assert(
      fc.property(arbitraryCorruptedString, (corrupt) => {
        localStorage.setItem(LAYOUTS_KEY, corrupt);
        const { result } = renderHook(() => useLayoutPersistence());
        expect(result.current.layouts).toEqual(DEFAULT_LAYOUTS);
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Reset restores default layout
// Validates: Requirements 10.1
// ---------------------------------------------------------------------------

describe("Property 4: Reset restores default layout", () => {
  beforeEach(clearStorage);
  afterEach(clearStorage);

  it("after resetLayout, state equals DEFAULT_LAYOUTS and localStorage is cleared", () => {
    fc.assert(
      fc.property(arbitraryLayouts, (layouts) => {
        clearStorage();
        localStorage.setItem(LAYOUTS_KEY, JSON.stringify(layouts));

        const { result } = renderHook(() => useLayoutPersistence());
        act(() => {
          result.current.resetLayout();
        });

        expect(result.current.layouts).toEqual(DEFAULT_LAYOUTS);
        expect(localStorage.getItem(LAYOUTS_KEY)).toBeNull();
        expect(localStorage.getItem(VISIBILITY_KEY)).toBeNull();
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Unit tests
// Validates: Requirements 4.1, 4.2, 4.3, 4.4, 10.1, 13.3, 13.4
// ---------------------------------------------------------------------------

describe("useLayoutPersistence — unit tests", () => {
  beforeEach(clearStorage);
  afterEach(clearStorage);

  it("returns DEFAULT_LAYOUTS when localStorage is empty", () => {
    const { result } = renderHook(() => useLayoutPersistence());
    expect(result.current.layouts).toEqual(DEFAULT_LAYOUTS);
  });

  it("returns DEFAULT_LAYOUTS when localStorage.getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    const { result } = renderHook(() => useLayoutPersistence());
    expect(result.current.layouts).toEqual(DEFAULT_LAYOUTS);
    vi.restoreAllMocks();
  });

  it("persists layout on onLayoutChange call", () => {
    const { result } = renderHook(() => useLayoutPersistence());
    act(() => {
      result.current.onLayoutChange(DEFAULT_LAYOUTS.lg ?? [], DEFAULT_LAYOUTS);
    });
    const stored = JSON.parse(localStorage.getItem(LAYOUTS_KEY) ?? "null");
    expect(stored).toEqual(DEFAULT_LAYOUTS);
  });

  it("resetLayout clears both localStorage keys", () => {
    localStorage.setItem(LAYOUTS_KEY, JSON.stringify(DEFAULT_LAYOUTS));
    localStorage.setItem(VISIBILITY_KEY, JSON.stringify({ sidebar: false }));

    const { result } = renderHook(() => useLayoutPersistence());
    act(() => {
      result.current.resetLayout();
    });

    expect(localStorage.getItem(LAYOUTS_KEY)).toBeNull();
    expect(localStorage.getItem(VISIBILITY_KEY)).toBeNull();
  });

  it("visibility state defaults to all-visible when localStorage is empty", () => {
    const { result } = renderHook(() => useLayoutPersistence());
    for (const id of WIDGET_ID_VALUES) {
      expect(result.current.visibilityState[id]).toBe(true);
    }
  });

  it("setWidgetVisible updates state and persists to localStorage", () => {
    const { result } = renderHook(() => useLayoutPersistence());
    act(() => {
      result.current.setWidgetVisible("sidebar", false);
    });
    expect(result.current.visibilityState.sidebar).toBe(false);
    const stored = JSON.parse(localStorage.getItem(VISIBILITY_KEY) ?? "null");
    expect(stored.sidebar).toBe(false);
  });

  it("resetLayout restores all widgets to visible", () => {
    const { result } = renderHook(() => useLayoutPersistence());
    act(() => {
      result.current.setWidgetVisible("sidebar", false);
      result.current.setWidgetVisible("map", false);
    });
    act(() => {
      result.current.resetLayout();
    });
    for (const id of WIDGET_ID_VALUES) {
      expect(result.current.visibilityState[id]).toBe(true);
    }
  });
});
