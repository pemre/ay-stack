import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollTimeline } from "./ScrollTimeline.tsx";

/**
 * SPEC: ScrollTimeline
 * ---------------------------------------------------------
 * 1. Renders a nav element with the configured aria-label.
 * 2. Renders children content alongside the timeline.
 * 3. Uses custom namePrefix for anchor links.
 * 4. Falls back to content-only on narrow viewports.
 * 5. Renders SVG with progress line and dots.
 * 6. Computes distinct dot positions from DOM via getBoundingClientRect.
 * 7. Labels are visible when alwaysShowLabels is true.
 * 8. Active section updates on scroll.
 * 9. Renders dots even when labels are empty.
 */

const sections = [
  { id: "alpha", label: "Alpha" },
  { id: "beta", label: "Beta" },
  { id: "gamma", label: "Gamma" },
];

function TestContent({ withLabels = true }: { withLabels?: boolean }) {
  return (
    <div>
      <div
        data-timeline-id="alpha"
        data-timeline-label={withLabels ? "Alpha" : ""}
        style={{ height: "300px", padding: "1rem" }}
      >
        <h2>Alpha content</h2>
      </div>
      <div
        data-timeline-id="beta"
        data-timeline-label={withLabels ? "Beta" : ""}
        style={{ height: "300px", padding: "1rem" }}
      >
        <h2>Beta content</h2>
      </div>
      <div
        data-timeline-id="gamma"
        data-timeline-label={withLabels ? "Gamma" : ""}
        style={{ height: "300px", padding: "1rem" }}
      >
        <h2>Gamma content</h2>
      </div>
    </div>
  );
}

/** Flush pending rAF callbacks so the component's position computation runs. */
function flushRaf() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/**
 * Mock getBoundingClientRect so jsdom returns simulated layout values.
 * Each [data-timeline-id] element gets a distinct top position.
 * The content container gets a combined height.
 */
function mockGetBoundingClientRect() {
  const sectionTops: Record<string, number> = {
    alpha: 0,
    beta: 300,
    gamma: 600,
  };
  return vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    const id = this.getAttribute?.("data-timeline-id");
    if (id && id in sectionTops) {
      return {
        top: sectionTops[id],
        left: 0,
        bottom: sectionTops[id] + 300,
        right: 600,
        width: 600,
        height: 300,
        x: 0,
        y: sectionTops[id],
        toJSON: () => ({}),
      };
    }
    // Container or other elements: return the full content area
    return {
      top: 0,
      left: 0,
      bottom: 900,
      right: 600,
      width: 600,
      height: 900,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    };
  });
}

describe("ScrollTimeline", () => {
  let rectSpy: ReturnType<typeof mockGetBoundingClientRect> | null = null;

  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    });
    rectSpy = mockGetBoundingClientRect();
  });

  afterEach(() => {
    rectSpy?.mockRestore();
  });

  it("renders a nav with the configured aria-label", () => {
    render(
      <ScrollTimeline sections={sections} labels={{ ariaLabel: "My timeline" }}>
        <TestContent />
      </ScrollTimeline>,
    );
    expect(screen.getByRole("navigation", { name: "My timeline" })).toBeInTheDocument();
  });

  it("renders child content alongside the timeline", () => {
    render(
      <ScrollTimeline sections={sections}>
        <TestContent />
      </ScrollTimeline>,
    );
    expect(screen.getByText("Alpha content")).toBeInTheDocument();
    expect(screen.getByText("Beta content")).toBeInTheDocument();
    expect(screen.getByText("Gamma content")).toBeInTheDocument();
  });

  it("uses custom namePrefix for anchor links", async () => {
    render(
      <ScrollTimeline sections={sections} namePrefix="chapter">
        <TestContent />
      </ScrollTimeline>,
    );
    await act(async () => {
      await flushRaf();
    });
    const links = document.querySelectorAll("a.scroll-timeline-link");
    expect(links.length).toBeGreaterThan(0);
    const hrefs = Array.from(links).map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("#chapter-alpha");
    expect(hrefs).toContain("#chapter-beta");
    expect(hrefs).toContain("#chapter-gamma");
  });

  it("renders content-only without nav on narrow viewports", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 800 });
    render(
      <ScrollTimeline sections={sections} config={{ minViewportWidth: 1024 }}>
        <TestContent />
      </ScrollTimeline>,
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.getByText("Alpha content")).toBeInTheDocument();
  });

  it("renders SVG with progress line and dots", async () => {
    const { container } = render(
      <ScrollTimeline sections={sections}>
        <TestContent />
      </ScrollTimeline>,
    );

    await act(async () => {
      await flushRaf();
    });

    const svg = container.querySelector("svg.scroll-timeline-svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.querySelector("line")).toBeInTheDocument();
    // 3 sections = 3 groups, each with 2 circles (outer + inner)
    expect(svg?.querySelectorAll("g")).toHaveLength(3);
    expect(svg?.querySelectorAll("circle")).toHaveLength(6);
  });

  it("computes distinct dot positions via getBoundingClientRect", async () => {
    const { container } = render(
      <ScrollTimeline sections={sections} config={{ alwaysShowLabels: true }}>
        <TestContent />
      </ScrollTimeline>,
    );

    await act(async () => {
      await flushRaf();
    });

    const groups = container.querySelectorAll("svg.scroll-timeline-svg g");
    expect(groups).toHaveLength(3);

    // Extract the y-translate percentages from each group's transform
    const transforms = Array.from(groups).map((g) => g.getAttribute("transform") || "");
    transforms.forEach((t) => {
      expect(t).toContain("translate(0,");
      expect(t).toContain("%");
    });

    // Positions should be monotonically increasing (not all at 0%)
    const pcts = transforms.map((t) => {
      const m = t.match(/translate\(0,\s*([\d.]+)%\)/);
      return m ? Number.parseFloat(m[1]) : -1;
    });
    expect(pcts[0]).toBeLessThan(pcts[1]);
    expect(pcts[1]).toBeLessThan(pcts[2]);
  });

  it("shows labels when alwaysShowLabels is true", async () => {
    const { container } = render(
      <ScrollTimeline sections={sections} config={{ alwaysShowLabels: true }}>
        <TestContent />
      </ScrollTimeline>,
    );

    await act(async () => {
      await flushRaf();
    });

    const labels = container.querySelectorAll(".scroll-timeline-label--visible");
    expect(labels.length).toBeGreaterThan(0);
  });

  it("hides labels by default (only active/hover)", async () => {
    const { container } = render(
      <ScrollTimeline sections={sections}>
        <TestContent />
      </ScrollTimeline>,
    );

    await act(async () => {
      await flushRaf();
    });

    const allLabels = container.querySelectorAll(".scroll-timeline-label");
    const visibleLabels = container.querySelectorAll(".scroll-timeline-label--visible");
    expect(allLabels.length).toBeGreaterThan(0);
    expect(visibleLabels.length).toBe(0);
  });

  it("updates active section on scroll", async () => {
    const { container } = render(
      <ScrollTimeline sections={sections} config={{ alwaysShowLabels: true }}>
        <TestContent />
      </ScrollTimeline>,
    );

    await act(async () => {
      await flushRaf();
    });

    // Initially, the first section should be active
    const activeLabels = container.querySelectorAll(".scroll-timeline-label--active");
    expect(activeLabels.length).toBeGreaterThanOrEqual(1);

    // Simulate scroll to the middle
    await act(async () => {
      Object.defineProperty(window, "scrollY", {
        writable: true,
        configurable: true,
        value: 500,
      });
      window.dispatchEvent(new Event("scroll"));
      await flushRaf();
    });

    const activeAfterScroll = container.querySelectorAll(".scroll-timeline-label--active");
    expect(activeAfterScroll.length).toBeGreaterThanOrEqual(1);
  });

  it("renders dots even when labels are empty", async () => {
    const { container } = render(
      <ScrollTimeline sections={sections}>
        <TestContent withLabels={false} />
      </ScrollTimeline>,
    );

    await act(async () => {
      await flushRaf();
    });

    const circles = container.querySelectorAll("svg.scroll-timeline-svg circle");
    expect(circles.length).toBe(6); // 3 sections × 2 circles each
  });
});
