import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ScrollTimeline } from "./ScrollTimeline.tsx";

/**
 * SPEC: ScrollTimeline
 * ---------------------------------------------------------
 * 1. Renders a nav element with the configured aria-label.
 * 2. Renders children content alongside the timeline.
 * 3. Uses custom namePrefix for anchor links.
 * 4. Falls back to content-only on narrow viewports.
 * 5. Renders SVG with progress line and dots.
 * 6. Computes dot positions from DOM after layout (rAF).
 * 7. Labels are visible when alwaysShowLabels is true.
 * 8. Active section updates on scroll.
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
        style={{ minHeight: "200px", padding: "1rem" }}
      >
        <h2>Alpha content</h2>
      </div>
      <div
        data-timeline-id="beta"
        data-timeline-label={withLabels ? "Beta" : ""}
        style={{ minHeight: "200px", padding: "1rem" }}
      >
        <h2>Beta content</h2>
      </div>
      <div
        data-timeline-id="gamma"
        data-timeline-label={withLabels ? "Gamma" : ""}
        style={{ minHeight: "200px", padding: "1rem" }}
      >
        <h2>Gamma content</h2>
      </div>
    </div>
  );
}

// Helper: flush all pending rAF callbacks
function flushRaf() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

describe("ScrollTimeline", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1200,
    });
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

  it("computes dot positions from DOM after layout via rAF", async () => {
    const { container } = render(
      <ScrollTimeline sections={sections} config={{ alwaysShowLabels: true }}>
        <TestContent />
      </ScrollTimeline>,
    );

    await act(async () => {
      await flushRaf();
    });

    // After rAF, all 3 labels should be rendered as <a> elements
    const links = container.querySelectorAll("a.scroll-timeline-link");
    expect(links).toHaveLength(3);

    // Each <g> should have a transform with a y-offset percentage
    const groups = container.querySelectorAll("svg.scroll-timeline-svg g");
    groups.forEach((g) => {
      const transform = g.getAttribute("transform");
      expect(transform).toContain("translate(0,");
      expect(transform).toContain("%");
    });
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

    // Labels exist but should not have the --visible class
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

    // Initially, the first section should be active (it's at the top)
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

    // After scroll, there should still be an active label
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
