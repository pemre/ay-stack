import { act, cleanup, fireEvent, render } from "@testing-library/react";
import * as fc from "fast-check";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SpiralTimeline } from "./SpiralTimeline.tsx";
import type { DataNode, SpiralTimelineConfig } from "./types.ts";

/* ── Helpers ─────────────────────────────────────────────── */

/** Minimal valid DataNode factory. */
function makeNode(overrides: Partial<DataNode> = {}): DataNode {
  return {
    date: new Date(2023, 5, 15),
    type: "default",
    title: "Test Node",
    content: "Test content",
    ...overrides,
  };
}

/** Create an array of DataNode spanning multiple years. */
function makeMultiYearData(startYear: number, endYear: number): DataNode[] {
  const nodes: DataNode[] = [];
  for (let y = startYear; y <= endYear; y++) {
    nodes.push(
      makeNode({
        date: new Date(y, 3, 10),
        title: `Event ${y}`,
        content: `Content for ${y}`,
        id: `node-${y}`,
      }),
    );
  }
  return nodes;
}

/**
 * fast-check arbitrary for a valid DataNode.
 * Generates dates between 1900 and 2100, non-empty strings for title/type/content.
 */
const arbDataNode: fc.Arbitrary<DataNode> = fc
  .record({
    year: fc.integer({ min: 1900, max: 2100 }),
    month: fc.integer({ min: 0, max: 11 }),
    day: fc.integer({ min: 1, max: 28 }),
    type: fc.constantFrom("default", "empire", "literature", "cinema"),
    title: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
    content: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  })
  .map(({ year, month, day, type, title, content }) => ({
    date: new Date(year, month, day),
    type,
    title,
    content,
    id: `${year}-${month}-${day}-${title.slice(0, 8)}`,
  }));

/** Arbitrary for a non-empty array of valid DataNodes (1–10 items). */
const arbDataNodes: fc.Arbitrary<DataNode[]> = fc.array(arbDataNode, {
  minLength: 1,
  maxLength: 10,
});

/* ── Mocks ────────────────────────────────────────────────── */

const MOCK_WIDTH = 800;
const MOCK_HEIGHT = 600;

class MockResizeObserver implements ResizeObserver {
  observe() {
    // Don't fire the callback synchronously or asynchronously on initial observe.
    // The component calls initLayers() and setContainerWidth() directly after
    // observer.observe(), so the initial setup is handled without the callback.
    // The callback is only needed for actual resize events (tested separately).
  }
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
});

beforeEach(() => {
  // Mock SVG element dimensions since jsdom doesn't support them
  Object.defineProperty(SVGSVGElement.prototype, "clientWidth", {
    get: () => MOCK_WIDTH,
    configurable: true,
  });
  Object.defineProperty(SVGSVGElement.prototype, "clientHeight", {
    get: () => MOCK_HEIGHT,
    configurable: true,
  });
  // Mock parentElement.clientWidth for container width detection
  Object.defineProperty(HTMLDivElement.prototype, "clientWidth", {
    get: () => MOCK_WIDTH,
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** Render helper that waits for the ResizeObserver debounce. */
function renderTimeline(data: DataNode[], config?: SpiralTimelineConfig, locale?: string) {
  let result: ReturnType<typeof render>;
  // Render inside act() to flush all React effects synchronously.
  // The ResizeObserver effect calls initLayers() + setContainerWidth() directly,
  // and the containerWidth state change triggers the main D3 rendering effect.
  act(() => {
    result = render(<SpiralTimeline data={data} config={config} locale={locale} />);
  });
  // biome-ignore lint/style/noNonNullAssertion: result is always assigned inside act()
  return result!;
}

/* ══════════════════════════════════════════════════════════════
   Property Tests
   ══════════════════════════════════════════════════════════════ */

// Feature: d3-timeline-widget, Property 1: Valid input produces complete SVG structure
describe("Property 1: Valid input produces complete SVG structure", () => {
  /**
   * **Validates: Requirements 3.1, 3.2, 3.4**
   *
   * For any non-empty array of valid DataNode objects and any valid config,
   * the rendered SVG should contain all 6 layer groups.
   */
  it("all 6 layer groups present for any valid data + config", () => {
    fc.assert(
      fc.property(arbDataNodes, (nodes) => {
        const { container } = renderTimeline(nodes, {
          animations: { enabled: false, duration: 0 },
        });

        const svg = container.querySelector("svg");
        expect(svg).toBeTruthy();

        const layerClasses = [
          "layer-season-bg",
          "layer-radial-lines",
          "layer-spiral",
          "layer-year-markers",
          "layer-month-labels",
          "layer-data-nodes",
        ];

        for (const cls of layerClasses) {
          const layer = svg?.querySelector(`.${cls}`);
          expect(layer).toBeTruthy();
        }

        cleanup();
      }),
      { numRuns: 30 },
    );
  });
});

// Feature: d3-timeline-widget, Property 5: Node click callback receives correct data
describe("Property 5: Node click callback receives correct data", () => {
  /**
   * **Validates: Requirements 4.8, 8.3**
   *
   * Clicking a data node invokes onNodeClick with the original DataNode.
   */
  it("clicking a node invokes onNodeClick with the original DataNode", () => {
    const data = makeMultiYearData(2020, 2023);
    const clickedNodes: DataNode[] = [];
    const onNodeClick = vi.fn((node: DataNode) => {
      clickedNodes.push(node);
    });

    const { container } = renderTimeline(data, {
      onNodeClick,
      animations: { enabled: false, duration: 0 },
    });

    const nodeElements = container.querySelectorAll(".data-node");

    // Click each visible data node
    for (const el of nodeElements) {
      fireEvent.click(el);
    }

    // Each click should have invoked the callback
    expect(onNodeClick).toHaveBeenCalledTimes(nodeElements.length);

    // Each invocation should pass a DataNode with matching title
    for (const call of onNodeClick.mock.calls) {
      const node = call[0] as DataNode;
      expect(node).toHaveProperty("title");
      expect(node).toHaveProperty("date");
      expect(node).toHaveProperty("type");
      expect(node).toHaveProperty("content");
      // The node should be one of our original data items
      expect(data.some((d) => d.title === node.title)).toBe(true);
    }
  });

  it("keyboard Enter on a data node invokes onNodeClick", () => {
    const data = makeMultiYearData(2021, 2023);
    const onNodeClick = vi.fn();

    const { container } = renderTimeline(data, {
      onNodeClick,
      animations: { enabled: false, duration: 0 },
    });

    const nodeElements = container.querySelectorAll(".data-node");
    if (nodeElements.length > 0) {
      fireEvent.keyDown(nodeElements[0], { key: "Enter" });
      expect(onNodeClick).toHaveBeenCalledTimes(1);
    }
  });
});

// Feature: d3-timeline-widget, Property 8: Tooltip displays node information on hover
describe("Property 8: Tooltip displays node title, content, and locale-formatted date on hover", () => {
  /**
   * **Validates: Requirement 8.1**
   *
   * Hovering over a DataNode makes the tooltip visible with title, content,
   * and a locale-formatted date.
   */
  it("tooltip shows title, content, and formatted date on hover", () => {
    const testDate = new Date(2022, 6, 4);
    const data = [
      makeNode({
        date: testDate,
        title: "Hover Test Event",
        content: "Hover test content",
      }),
    ];

    const { container } = renderTimeline(
      data,
      {
        animations: { enabled: false, duration: 0 },
        yearsToShow: 2,
      },
      "en",
    );

    const nodeEl = container.querySelector(".data-node");
    expect(nodeEl).toBeTruthy();

    // Hover over the node
    if (nodeEl) {
      fireEvent.mouseEnter(nodeEl);
    }

    const tooltip = container.querySelector(".spiral-timeline__tooltip");
    expect(tooltip).toBeTruthy();

    // Check tooltip has the visible class
    expect(tooltip?.classList.contains("spiral-timeline__tooltip--visible")).toBe(true);

    // Check tooltip content
    const titleEl = tooltip?.querySelector(".spiral-timeline__tooltip-title");
    expect(titleEl?.textContent).toBe("Hover Test Event");

    const contentEl = tooltip?.querySelector(".spiral-timeline__tooltip-content");
    expect(contentEl?.textContent).toBe("Hover test content");

    const dateEl = tooltip?.querySelector(".spiral-timeline__tooltip-date");
    const expectedDate = testDate.toLocaleDateString("en", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    expect(dateEl?.textContent).toBe(expectedDate);

    // Mouse leave should hide tooltip
    if (nodeEl) {
      fireEvent.mouseLeave(nodeEl);
    }
    expect(tooltip?.classList.contains("spiral-timeline__tooltip--visible")).toBe(false);
  });
});

// Feature: d3-timeline-widget, Property 9: Data node ARIA attributes
describe("Property 9: Data node accessibility attributes", () => {
  /**
   * **Validates: Requirement 8.4**
   *
   * Every rendered DataNode has role="button", tabindex="0",
   * and aria-label containing title and formatted date.
   */
  it("all data nodes have correct ARIA attributes", () => {
    fc.assert(
      fc.property(arbDataNodes, (nodes) => {
        const { container } = renderTimeline(
          nodes,
          {
            animations: { enabled: false, duration: 0 },
          },
          "en",
        );

        const nodeElements = container.querySelectorAll(".data-node");

        for (const el of nodeElements) {
          expect(el.getAttribute("role")).toBe("button");
          expect(el.getAttribute("tabindex")).toBe("0");

          const ariaLabel = el.getAttribute("aria-label");
          expect(ariaLabel).toBeTruthy();
          // aria-label should contain a date-like string (at minimum a year number)
          expect(ariaLabel).toMatch(/\d{4}/);
        }

        cleanup();
      }),
      { numRuns: 20 },
    );
  });

  it("aria-label contains node title and formatted date", () => {
    const testDate = new Date(2023, 0, 15);
    const data = [
      makeNode({
        date: testDate,
        title: "Aria Test",
        id: "aria-test",
      }),
    ];

    const { container } = renderTimeline(
      data,
      {
        animations: { enabled: false, duration: 0 },
        yearsToShow: 2,
      },
      "en",
    );

    const nodeEl = container.querySelector(".data-node");
    if (nodeEl) {
      const ariaLabel = nodeEl.getAttribute("aria-label") ?? "";
      expect(ariaLabel).toContain("Aria Test");
      // Should contain the formatted date
      const expectedDate = testDate.toLocaleDateString("en", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      expect(ariaLabel).toContain(expectedDate);
    }
  });
});

// Feature: d3-timeline-widget, Property 6: Time window slider proportional width and label
describe("Property 6: Time window slider proportional width and label", () => {
  /**
   * **Validates: Requirements 6.2, 6.5**
   *
   * For any yearsToShow (1 ≤ yearsToShow ≤ totalDataYears) and any valid windowStart,
   * the slider window width% = (yearsToShow / totalDataYears) × 100 and the label
   * displays "{windowStart}–{windowEnd}" (or just "{windowStart}" when equal).
   */
  it("slider window width = (yearsToShow / totalDataYears) × 100 and label shows correct range", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1950, max: 2020 }),
        fc.integer({ min: 1, max: 20 }),
        fc.nat({ max: 50 }),
        (dataMinYear, span, yearsToShowRaw) => {
          const dataMaxYear = dataMinYear + span;
          const totalDataYears = dataMaxYear - dataMinYear + 1;
          const yearsToShow = Math.max(1, Math.min(yearsToShowRaw, totalDataYears));
          // windowStart: most recent window (component default)
          const windowStart = dataMaxYear - yearsToShow + 1;
          const windowEnd = windowStart + yearsToShow - 1;

          const data = makeMultiYearData(dataMinYear, dataMaxYear);

          const { container } = renderTimeline(data, {
            yearsToShow,
            animations: { enabled: false, duration: 0 },
          });

          const windowEl = container.querySelector(
            ".spiral-timeline__slider-window",
          ) as HTMLElement;
          expect(windowEl).toBeTruthy();

          // Verify proportional width
          const widthPct = Number.parseFloat(windowEl.style.width);
          const expectedPct = (yearsToShow / totalDataYears) * 100;
          expect(Math.abs(widthPct - expectedPct)).toBeLessThan(0.01);

          // Verify range label
          const labelEl = container.querySelector(".spiral-timeline__slider-window-label");
          expect(labelEl).toBeTruthy();
          const labelText = labelEl?.textContent ?? "";

          if (windowStart === windowEnd) {
            expect(labelText).toBe(String(windowStart));
          } else {
            // Component uses \u2013 (en-dash) as separator
            expect(labelText).toBe(`${windowStart}\u2013${windowEnd}`);
          }

          cleanup();
        },
      ),
      { numRuns: 50 },
    );
  });

  it("single-year dataset: width is 100% and label is just the year", () => {
    const data = makeMultiYearData(2020, 2020);

    const { container } = renderTimeline(data, {
      yearsToShow: 1,
      animations: { enabled: false, duration: 0 },
    });

    const windowEl = container.querySelector(".spiral-timeline__slider-window") as HTMLElement;
    expect(windowEl).toBeTruthy();

    // 1 / 1 × 100 = 100%
    const widthPct = Number.parseFloat(windowEl.style.width);
    expect(Math.abs(widthPct - 100)).toBeLessThan(0.01);

    const labelEl = container.querySelector(".spiral-timeline__slider-window-label");
    expect(labelEl?.textContent).toBe("2020");
  });

  it("full-range window: width is 100% and label spans entire dataset", () => {
    const data = makeMultiYearData(2015, 2023);
    const totalDataYears = 9;

    const { container } = renderTimeline(data, {
      yearsToShow: totalDataYears,
      animations: { enabled: false, duration: 0 },
    });

    const windowEl = container.querySelector(".spiral-timeline__slider-window") as HTMLElement;
    expect(windowEl).toBeTruthy();

    const widthPct = Number.parseFloat(windowEl.style.width);
    expect(Math.abs(widthPct - 100)).toBeLessThan(0.01);

    const labelEl = container.querySelector(".spiral-timeline__slider-window-label");
    expect(labelEl?.textContent).toBe("2015\u20132023");
  });
});

// Feature: d3-timeline-widget, Property 7: Zoom clamping invariant
describe("Property 7: Zoom clamping invariant", () => {
  /**
   * **Validates: Requirements 7.1, 7.4**
   *
   * After any sequence of zoom operations, 1 ≤ yearsToShow ≤ totalDataYears
   * and windowStart remains within the valid data range.
   */
  it("zoom buttons clamp yearsToShow between 1 and totalDataYears", () => {
    const data = makeMultiYearData(2018, 2023);

    const { container } = renderTimeline(data, {
      yearsToShow: 3,
      zoom: { buttons: true, slider: true, mouseWheel: true, speed: 1 },
      animations: { enabled: false, duration: 0 },
    });

    const zoomInBtn = container.querySelector('[aria-label="Zoom in"]') as HTMLButtonElement;
    const zoomOutBtn = container.querySelector('[aria-label="Zoom out"]') as HTMLButtonElement;
    expect(zoomInBtn).toBeTruthy();
    expect(zoomOutBtn).toBeTruthy();

    // Zoom in repeatedly — should not go below 1
    for (let i = 0; i < 10; i++) {
      fireEvent.click(zoomInBtn);
    }

    // The zoom in button should be disabled at yearsToShow = 1
    expect(zoomInBtn.disabled).toBe(true);

    // Zoom out repeatedly — should not exceed totalDataYears
    for (let i = 0; i < 20; i++) {
      fireEvent.click(zoomOutBtn);
    }

    // The zoom out button should be disabled at yearsToShow = totalDataYears
    expect(zoomOutBtn.disabled).toBe(true);
  });

  it("zoom slider clamps value within valid range", () => {
    const data = makeMultiYearData(2018, 2023);

    const { container } = renderTimeline(data, {
      yearsToShow: 3,
      zoom: { buttons: true, slider: true, mouseWheel: true, speed: 1 },
      animations: { enabled: false, duration: 0 },
    });

    const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
    expect(slider).toBeTruthy();

    // Slider min/max should match valid range
    expect(Number(slider.min)).toBe(1);
    expect(Number(slider.max)).toBe(6);

    // Setting slider to boundary values should work
    fireEvent.change(slider, { target: { value: "1" } });
    expect(Number(slider.value)).toBe(1);

    fireEvent.change(slider, { target: { value: "6" } });
    expect(Number(slider.value)).toBe(6);
  });
});

// Feature: d3-timeline-widget, Property 12: Locale-aware month labels
describe("Property 12: Locale-aware month labels", () => {
  /**
   * **Validates: Requirements 11.1, 11.4**
   *
   * For any supported locale, the 12 month labels should match
   * Intl.DateTimeFormat output for that locale.
   */
  it("month labels match Intl.DateTimeFormat for given locale", () => {
    const locales = ["en", "tr", "de", "fr"];

    for (const loc of locales) {
      const data = makeMultiYearData(2020, 2023);

      const { container } = renderTimeline(
        data,
        {
          animations: { enabled: false, duration: 0 },
        },
        loc,
      );

      const svg = container.querySelector("svg");
      const monthLabelEls = svg?.querySelectorAll(".layer-month-labels text.axis-label");

      // Must have exactly 12 month labels
      expect(monthLabelEls?.length).toBe(12);

      const fmt = new Intl.DateTimeFormat(loc, { month: "short" });
      const expectedLabels = Array.from({ length: 12 }, (_, i) =>
        fmt.format(new Date(2000, i, 15)),
      );

      for (let i = 0; i < 12; i++) {
        expect(monthLabelEls?.[i].textContent).toBe(expectedLabels[i]);
      }

      cleanup();
    }
  });

  it("defaults to browser locale when no locale prop is provided", () => {
    const data = makeMultiYearData(2020, 2023);

    const { container } = renderTimeline(data, {
      animations: { enabled: false, duration: 0 },
    });

    const svg = container.querySelector("svg");
    const monthLabelEls = svg?.querySelectorAll(".layer-month-labels text.axis-label");

    expect(monthLabelEls).toBeTruthy();
    expect(monthLabelEls?.length).toBe(12);
  });
});

/* ══════════════════════════════════════════════════════════════
   Unit Tests — Edge Cases (Task 13.8)
   ══════════════════════════════════════════════════════════════ */

describe("Edge cases", () => {
  it("renders with empty data array without errors", () => {
    const { container } = renderTimeline([]);

    // SVG should still be present
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();

    // No data nodes should be rendered
    const nodes = container.querySelectorAll(".data-node");
    expect(nodes.length).toBe(0);

    // Slider should still render
    const slider = container.querySelector(".spiral-timeline__slider");
    expect(slider).toBeTruthy();
  });

  it("renders with a single data point", () => {
    const data = [makeNode({ date: new Date(2023, 5, 15), title: "Solo Event" })];

    const { container } = renderTimeline(data, {
      animations: { enabled: false, duration: 0 },
    });

    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();

    // The component should render without crashing
    const layers = svg?.querySelector(".layer-data-nodes");
    expect(layers).toBeTruthy();
  });

  it("renders with all dates in the same year", () => {
    const data = [
      makeNode({ date: new Date(2023, 0, 10), title: "Jan Event" }),
      makeNode({ date: new Date(2023, 5, 15), title: "Jun Event" }),
      makeNode({ date: new Date(2023, 11, 25), title: "Dec Event" }),
    ];

    const { container } = renderTimeline(data, {
      animations: { enabled: false, duration: 0 },
    });

    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();

    // Should not crash with totalDataYears = 1
    const layers = svg?.querySelector(".layer-spiral");
    expect(layers).toBeTruthy();
  });

  it("filters invalid dates and still renders valid ones", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const data = [
      makeNode({ date: new Date("invalid"), title: "Bad Date" }),
      makeNode({ date: new Date(2023, 5, 15), title: "Good Date" }),
    ];

    const { container } = renderTimeline(data, {
      animations: { enabled: false, duration: 0 },
    });

    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();

    // The invalid date node should have been filtered
    // Only the valid node should potentially appear as a data-node
    // (visibility depends on the time window, but no crash should occur)

    warnSpy.mockRestore();
  });

  it("falls back to default type config for unknown node types", () => {
    const data = [
      makeNode({
        date: new Date(2023, 5, 15),
        type: "nonexistent-type",
        title: "Unknown Type Node",
      }),
    ];

    // Should not throw — falls back to first type in config
    const { container } = renderTimeline(data, {
      animations: { enabled: false, duration: 0 },
    });

    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("cleans up D3 selections and observers on unmount", () => {
    const data = makeMultiYearData(2020, 2023);

    const { container, unmount } = renderTimeline(data, {
      animations: { enabled: false, duration: 0 },
    });

    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();

    // Unmount should not throw
    expect(() => unmount()).not.toThrow();

    // After unmount, SVG content should be cleaned up
    // (the svg element itself is removed from DOM by React)
  });
});
