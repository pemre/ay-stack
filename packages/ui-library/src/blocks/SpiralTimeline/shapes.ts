import type { Selection } from "d3";
import * as d3 from "d3";
import type { NodeShape } from "./types.ts";

/**
 * Derives a semi-transparent fill color (~0.5 opacity) from a stroke color.
 * For hex colors (e.g. "#3b82f6"), appends "50" alpha channel.
 * For non-hex colors (named, rgb(), etc.), uses d3.color() with opacity 0.5.
 */
export function deriveFillColor(color: string): string {
  if (color.startsWith("#")) {
    return `${color}50`;
  }
  const parsed = d3.color(color);
  if (parsed) {
    parsed.opacity = 0.5;
    return parsed.formatRgb();
  }
  return `${color}50`;
}

/**
 * Appends the correct SVG shape element to a D3 selection based on the
 * given shape type. Shapes have a semi-transparent fill derived from the
 * stroke color (~0.5 opacity) and are centered at (0, 0).
 */
export function drawShape(
  selection: Selection<SVGGElement, unknown, null, undefined>,
  shape: NodeShape,
  size: number,
  color: string,
): void {
  const s = size / 2;
  const fillColor = deriveFillColor(color);

  switch (shape) {
    case "circle":
      selection
        .append("circle")
        .attr("r", s)
        .attr("fill", fillColor)
        .attr("stroke", color)
        .attr("stroke-width", 2);
      break;

    case "square":
      selection
        .append("rect")
        .attr("x", -s)
        .attr("y", -s)
        .attr("width", s * 2)
        .attr("height", s * 2)
        .attr("fill", fillColor)
        .attr("stroke", color)
        .attr("stroke-width", 2);
      break;

    case "triangle": {
      const points: [number, number][] = [
        [0, -s],
        [s * 0.866, s * 0.5],
        [-s * 0.866, s * 0.5],
      ];
      selection
        .append("polygon")
        .attr("points", points.map((p) => p.join(",")).join(" "))
        .attr("fill", fillColor)
        .attr("stroke", color)
        .attr("stroke-width", 2);
      break;
    }

    case "star": {
      const starPoints: [number, number][] = [];
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? s : s * 0.4;
        starPoints.push([r * Math.cos(angle), r * Math.sin(angle)]);
      }
      selection
        .append("polygon")
        .attr("points", starPoints.map((p) => p.join(",")).join(" "))
        .attr("fill", fillColor)
        .attr("stroke", color)
        .attr("stroke-width", 2);
      break;
    }

    case "pentagon": {
      const pentPoints: [number, number][] = [];
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        pentPoints.push([s * Math.cos(angle), s * Math.sin(angle)]);
      }
      selection
        .append("polygon")
        .attr("points", pentPoints.map((p) => p.join(",")).join(" "))
        .attr("fill", fillColor)
        .attr("stroke", color)
        .attr("stroke-width", 2);
      break;
    }
  }
}
