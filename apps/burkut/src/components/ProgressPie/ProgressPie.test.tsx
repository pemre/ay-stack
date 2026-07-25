import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProgressPie from "./ProgressPie";

/**
 * SPEC: ProgressPie component
 * ---------------------------
 * 1. Renders an SVG element
 * 2. Shows correct percentage text
 * 3. Handles 0% (empty pie)
 * 4. Handles 100% (full pie)
 * 5. Has accessible role and aria-label
 */

describe("ProgressPie", () => {
  it("renders an SVG element", () => {
    const { container } = render(<ProgressPie percentage={42} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("shows the correct percentage text", () => {
    render(<ProgressPie percentage={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("handles 0% (empty pie)", () => {
    render(<ProgressPie percentage={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("handles 100% (full pie)", () => {
    render(<ProgressPie percentage={100} />);
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("has accessible role and aria-label", () => {
    render(<ProgressPie percentage={55} />);
    const pie = screen.getByRole("img");
    expect(pie).toHaveAttribute("aria-label", "progress.title: 55%");
  });

  it("uses the specified size", () => {
    const { container } = render(<ProgressPie percentage={10} size={40} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "40");
    expect(svg).toHaveAttribute("height", "40");
  });

  it("renders track and fill circles", () => {
    const { container } = render(<ProgressPie percentage={50} />);
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(2);
    expect(circles[0]).toHaveClass("progress-pie__track");
    expect(circles[1]).toHaveClass("progress-pie__fill");
  });
});
