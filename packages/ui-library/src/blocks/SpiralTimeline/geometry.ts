import type { YearLabelPosition } from "./types.ts";

/** Result of mapping a date onto the Archimedean spiral. */
export interface SpiralPoint {
  /** Cartesian x coordinate (relative to spiral center). */
  x: number;
  /** Cartesian y coordinate (relative to spiral center). */
  y: number;
  /** Polar angle in radians (−π/2 = 12 o'clock). */
  angle: number;
  /** Polar radius from center. */
  radius: number;
}

/**
 * Map a calendar date to a point on the Archimedean spiral.
 *
 * Formula:
 *   yearDiff = date.fullYear − oldestYear
 *   dayFraction = dayOfYear / 365
 *   totalRotations = yearDiff + dayFraction
 *   angle = −π/2 − totalRotations × 2π
 *   radius = totalRotations × radiusIncrement
 *
 * January 1 sits at −π/2 (12 o'clock). One full rotation per year.
 * More recent dates (smaller yearDiff) are closer to the center.
 */
export function dateToSpiral(date: Date, oldestYear: number, radiusIncrement: number): SpiralPoint {
  const yearDiff = date.getFullYear() - oldestYear;
  const dayOfYear = getDayOfYear(date);
  const totalRotations = yearDiff + dayOfYear / 365;
  const angle = -Math.PI / 2 - totalRotations * 2 * Math.PI;
  const radius = totalRotations * radiusIncrement;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    angle,
    radius,
  };
}

/**
 * Compute a spiral point for an absolute year value (fractional).
 *
 * This is the segment-level variant used for drawing spiral path segments
 * and computing transition positions. Unlike `dateToSpiral`, it takes a
 * continuous year value (e.g. 2023.5 = mid-2023) rather than a Date object.
 */
export function spiralPointAt(
  absYear: number,
  oldestYear: number,
  radiusIncrement: number,
): SpiralPoint {
  const rotations = absYear - oldestYear;
  const angle = -Math.PI / 2 - rotations * 2 * Math.PI;
  const radius = rotations * radiusIncrement;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    angle,
    radius,
  };
}

/** Position of a year marker dot and its text label. */
export interface YearMarkerPosition {
  /** Marker dot x. */
  mx: number;
  /** Marker dot y. */
  my: number;
  /** Label text x (offset outward from the dot). */
  lx: number;
  /** Label text y (offset outward from the dot). */
  ly: number;
}

/**
 * Compute the position of a year marker dot and its label on the spiral.
 *
 * The marker sits on the ring boundary at the angle determined by
 * `yearLabelPosition`. The label is offset outward by `labelOffset` pixels.
 */
export function yearMarkerPos(
  year: number,
  position: YearLabelPosition,
  oldestYear: number,
  radiusIncrement: number,
  labelOffset = 30,
): YearMarkerPosition {
  const markerAngle = yearLabelPositionToAngle(position);
  const rotations = year - oldestYear;
  const radius = rotations * radiusIncrement;
  const mx = Math.cos(markerAngle) * radius;
  const my = Math.sin(markerAngle) * radius;
  const lx = mx + Math.cos(markerAngle) * labelOffset;
  const ly = my + Math.sin(markerAngle) * labelOffset;
  return { mx, my, lx, ly };
}

/**
 * Convert a `YearLabelPosition` to its corresponding angle in radians.
 *
 * Mapping:
 *   top → −π/2, right → 0, bottom → π/2, left → π
 *   top-right → −π/4, top-left → −3π/4
 *   bottom-right → π/4, bottom-left → 3π/4
 */
export function yearLabelPositionToAngle(position: YearLabelPosition): number {
  switch (position) {
    case "top":
      return -Math.PI / 2;
    case "right":
      return 0;
    case "bottom":
      return Math.PI / 2;
    case "left":
      return Math.PI;
    case "top-right":
      return -Math.PI / 4;
    case "top-left":
      return (-3 * Math.PI) / 4;
    case "bottom-right":
      return Math.PI / 4;
    case "bottom-left":
      return (3 * Math.PI) / 4;
    default:
      return -Math.PI / 2;
  }
}

/**
 * Compute the maximum spiral radius that fits within a container.
 *
 * Uses 40% of the smaller dimension to leave room for month labels
 * and controls around the spiral.
 */
export function computeMaxRadius(width: number, height: number): number {
  return Math.min(width, height) * 0.4;
}

/** Return the zero-based day-of-year for a Date (Jan 1 = 0). */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}
