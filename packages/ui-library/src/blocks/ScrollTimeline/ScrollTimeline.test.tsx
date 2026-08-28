import { render, screen } from "@testing-library/react";
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
 */

const sections = [
  { id: "alpha", label: "Alpha" },
  { id: "beta", label: "Beta" },
];

function TestContent() {
  return (
    <div>
      <div data-timeline-id="alpha" data-timeline-label="Alpha" style={{ minHeight: "200px" }}>
        <h2>Alpha content</h2>
      </div>
      <div data-timeline-id="beta" data-timeline-label="Beta" style={{ minHeight: "200px" }}>
        <h2>Beta content</h2>
      </div>
    </div>
  );
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
  });

  it("uses custom namePrefix for anchor links", () => {
    render(
      <ScrollTimeline sections={sections} namePrefix="chapter">
        <TestContent />
      </ScrollTimeline>,
    );
    // Links are inside the SVG, query by href
    const links = document.querySelectorAll("a.scroll-timeline-link");
    expect(links.length).toBeGreaterThan(0);
    const hrefs = Array.from(links).map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("#chapter-alpha");
    expect(hrefs).toContain("#chapter-beta");
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

  it("renders SVG with progress line and dots", () => {
    const { container } = render(
      <ScrollTimeline sections={sections}>
        <TestContent />
      </ScrollTimeline>,
    );
    const svg = container.querySelector("svg.scroll-timeline-svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.querySelector("line")).toBeInTheDocument();
    // 2 sections = 2 groups with 2 circles each
    expect(svg?.querySelectorAll("g")).toHaveLength(2);
    expect(svg?.querySelectorAll("circle")).toHaveLength(4);
  });
});
