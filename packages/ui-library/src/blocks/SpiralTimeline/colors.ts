import {
  interpolateCool,
  interpolateRainbow,
  interpolateRgb,
  interpolateSpectral,
  interpolateWarm,
} from "d3";
import type { ColorScale, FogConfig } from "./types.ts";

/**
 * Returns the D3 color interpolator function for the given scale name.
 * Falls back to spectral if the scale is unrecognized.
 */
export function getColorInterpolator(scale: ColorScale): (t: number) => string {
  switch (scale) {
    case "spectral":
      return interpolateSpectral;
    case "rainbow":
      return interpolateRainbow;
    case "cool":
      return interpolateCool;
    case "warm":
      return interpolateWarm;
    default:
      return interpolateSpectral;
  }
}

/**
 * Returns a color for a ring at the given offset using the interpolator.
 * Offset is mapped to a 0–1 range via `(offset % 10) / 10`.
 */
export function getYearColor(offset: number, interpolator: (t: number) => string): string {
  return interpolator((((offset % 10) + 10) % 10) / 10);
}

const MONTH_COLORS = [
  "#b6a6d9", // January
  "#7fa7e0", // February
  "#79c6d6", // March
  "#7fe3b5", // April
  "#9be36f", // May
  "#cfe96a", // June
  "#f1dd6b", // July
  "#f6c273", // August
  "#f3a07e", // September
  "#f16f6a", // October
  "#ea6fa2", // November
  "#c084d8", // December
];

export function getMonthColor(monthIndex: number): string {
  return MONTH_COLORS[monthIndex];
}

/**
 * Returns a season-appropriate color for the given month index (0–11).
 *
 * - Winter (Dec=11, Jan=0, Feb=1): blue shades
 * - Spring (Mar=2, Apr=3, May=4): yellow/green shades
 * - Summer (Jun=5, Jul=6, Aug=7): green/teal shades
 * - Autumn (Sep=8, Oct=9, Nov=10): orange/brown shades
 */
export function getSeasonColor(monthIndex: number): string {
  const m = ((monthIndex % 12) + 12) % 12;

  const seasons = [
    { start: 11, length: 3, from: "#3b4e9c", to: "#e0f2fe" }, // Winter
    { start: 2, length: 3, from: "#f9a8d4", to: "#86efac" }, // Spring
    { start: 5, length: 3, from: "#2e9d2a", to: "#f4ca61" }, // Summer
    { start: 8, length: 3, from: "#fdba74", to: "#c2410c" }, // Autumn
  ];

  for (const { start, length, from, to } of seasons) {
    const offset = (m - start + 12) % 12;
    if (offset < length) {
      const progress = offset / (length - 1);
      return interpolateRgb(from, to)(progress);
    }
  }

  return "#ffffff";
}

/**
 * Computes the opacity for a spiral ring based on fog configuration.
 *
 * - When fog is disabled, returns 1 (full opacity) for all rings.
 * - Rings at or before `fog.startRing` have opacity 1.
 * - Rings beyond `fog.startRing` fade proportionally, clamped to a minimum of 0.1.
 *
 * @param ringIndex - The ring index (0 = innermost/most recent).
 * @param fogConfig - The fog configuration object.
 * @param totalRings - Total number of rings in the visible range.
 */
export function computeFogOpacity(
  ringIndex: number,
  fogConfig: FogConfig,
  totalRings: number,
): number {
  if (!fogConfig.enabled || ringIndex <= fogConfig.startRing) {
    return 1;
  }
  const yearRange = Math.max(totalRings, 1);
  const opacity = 1 - ((ringIndex - fogConfig.startRing) / yearRange) * fogConfig.intensity;
  return Math.max(0.1, opacity);
}
