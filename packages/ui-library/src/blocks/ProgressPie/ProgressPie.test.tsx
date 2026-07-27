import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProgressPie from "./ProgressPie.tsx";

describe("ProgressPie", () => {
  it("renders the percentage and accessible label", () => {
    render(<ProgressPie percentage={42} label="Reading progress" />);

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Reading progress: 42%" })).toBeInTheDocument();
  });

  it("preserves the requested SVG size", () => {
    const { container } = render(<ProgressPie percentage={100} size={48} />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("width", "48");
    expect(svg).toHaveAttribute("height", "48");
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });
});
