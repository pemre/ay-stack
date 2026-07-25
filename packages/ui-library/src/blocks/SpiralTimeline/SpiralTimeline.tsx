import * as d3 from "d3";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computeFogOpacity, getColorInterpolator, getMonthColor, getYearColor } from "./colors.ts";
import { DEFAULT_CONFIG } from "./defaults.ts";
import {
  computeMaxRadius,
  dateToSpiral,
  yearLabelPositionToAngle,
  yearMarkerPos,
} from "./geometry.ts";
import { drawShape } from "./shapes.ts";
import { TimeWindowSlider } from "./TimeWindowSlider.tsx";
import type {
  AnimationConfig,
  DataNode,
  FogConfig,
  RadialGridConfig,
  RingGradientConfig,
  SpiralTimelineLabels,
  SpiralTimelineProps,
  TimeWindowConfig,
  TypeConfig,
  ZoomConfig,
} from "./types.ts";
import { ZoomControls } from "./ZoomControls.tsx";
import "./SpiralTimeline.css";

/* ── Helpers ─────────────────────────────────────────────── */

interface MergedConfig {
  yearsToShow: number;
  yearLabelPosition: string;
  zoom: ZoomConfig;
  fog: FogConfig;
  ringGradient: RingGradientConfig;
  animations: AnimationConfig;
  radialGrid: RadialGridConfig;
  timeWindow: TimeWindowConfig;
  types: TypeConfig[];
  labels: Required<SpiralTimelineLabels>;
  onNodeClick?: (node: DataNode, event: MouseEvent) => void;
}

function mergeConfig(user: SpiralTimelineProps["config"]): MergedConfig {
  return {
    yearsToShow: user?.yearsToShow ?? DEFAULT_CONFIG.yearsToShow,
    yearLabelPosition: user?.yearLabelPosition ?? DEFAULT_CONFIG.yearLabelPosition,
    zoom: { ...DEFAULT_CONFIG.zoom, ...user?.zoom },
    fog: { ...DEFAULT_CONFIG.fog, ...user?.fog },
    ringGradient: { ...DEFAULT_CONFIG.ringGradient, ...user?.ringGradient },
    animations: { ...DEFAULT_CONFIG.animations, ...user?.animations },
    radialGrid: { ...DEFAULT_CONFIG.radialGrid, ...user?.radialGrid },
    timeWindow: {
      ...DEFAULT_CONFIG.timeWindow,
      ...user?.timeWindow,
      animationDuration:
        user?.timeWindow?.animationDuration ??
        user?.animations?.duration ??
        DEFAULT_CONFIG.timeWindow.animationDuration,
    },
    types: user?.types ?? DEFAULT_CONFIG.types,
    labels: { ...DEFAULT_CONFIG.labels, ...user?.labels },
    onNodeClick: user?.onNodeClick,
  };
}

function isValidDate(d: Date): boolean {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

/** Segments per year for the spiral path resolution. */
const SEGS_PER_YEAR = 60;
const FADE_OUT_FRACTION = 0.25;
const NODE_SIZE = 5;
const RESIZE_DEBOUNCE_MS = 200;

interface PrevGeom {
  oldestYear: number;
  radiusIncrement: number;
  yearRange: number;
  newestYear: number;
}

interface LayerRefs {
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
  seasonBg: d3.Selection<SVGGElement, unknown, null, undefined>;
  radialLines: d3.Selection<SVGGElement, unknown, null, undefined>;
  spiral: d3.Selection<SVGGElement, unknown, null, undefined>;
  yearMarkers: d3.Selection<SVGGElement, unknown, null, undefined>;
  monthLabels: d3.Selection<SVGGElement, unknown, null, undefined>;
  dataNodes: d3.Selection<SVGGElement, unknown, null, undefined>;
  initialized: boolean;
}

/* ── Component ───────────────────────────────────────────── */

export function SpiralTimeline({
  data,
  config: userConfig,
  locale,
  className,
  onYearsToShowChange,
  onWindowStartChange: onWindowStartChangeProp,
  windowStart: controlledWindowStart,
}: SpiralTimelineProps) {
  const cfg = useMemo(() => mergeConfig(userConfig), [userConfig]);

  // Filter invalid dates
  const validData = useMemo(() => {
    return data.filter((node) => {
      if (!isValidDate(node.date)) {
        if (import.meta.env.DEV) {
          console.warn(`[SpiralTimeline] Filtered node with invalid date: "${node.title}"`);
        }
        return false;
      }
      return true;
    });
  }, [data]);

  // Data year range
  const dataMinYear = useMemo(
    () =>
      validData.length
        ? Math.min(...validData.map((d) => d.date.getFullYear()))
        : new Date().getFullYear(),
    [validData],
  );
  const dataMaxYear = useMemo(
    () =>
      validData.length
        ? Math.max(...validData.map((d) => d.date.getFullYear()))
        : new Date().getFullYear(),
    [validData],
  );
  const totalDataYears = Math.max(1, dataMaxYear - dataMinYear + 1);

  // Internal state
  const [yearsToShow, setYearsToShow] = useState(cfg.yearsToShow);
  const [internalWindowStart, setInternalWindowStart] = useState(dataMaxYear - cfg.yearsToShow + 1);
  const [hoveredNode, setHoveredNode] = useState<DataNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [containerWidth, setContainerWidth] = useState(0);
  const [renderKey, setRenderKey] = useState(0);

  // Controlled vs uncontrolled windowStart
  const isWindowStartControlled = controlledWindowStart !== undefined;
  const windowStart = isWindowStartControlled ? controlledWindowStart : internalWindowStart;
  const updateWindowStart = useCallback(
    (value: number | ((prev: number) => number)) => {
      if (isWindowStartControlled) {
        const newVal = typeof value === "function" ? value(controlledWindowStart) : value;
        onWindowStartChangeProp?.(newVal);
      } else {
        setInternalWindowStart((prev) => {
          const newVal = typeof value === "function" ? value(prev) : value;
          onWindowStartChangeProp?.(newVal);
          return newVal;
        });
      }
    },
    [isWindowStartControlled, controlledWindowStart, onWindowStartChangeProp],
  );

  // Sync yearsToShow when config changes from outside (controlled mode)
  useEffect(() => {
    setYearsToShow(cfg.yearsToShow);
  }, [cfg.yearsToShow]);

  // Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const layersRef = useRef<LayerRefs | null>(null);
  const prevGeomRef = useRef<PrevGeom | null>(null);
  const lastChangeSourceRef = useRef<"slider" | "other">("other");

  const windowEnd = windowStart + yearsToShow - 1;

  // Clamp windowStart when yearsToShow changes
  useEffect(() => {
    updateWindowStart((prev) => {
      const maxStart = dataMaxYear - yearsToShow + 1;
      return Math.max(dataMinYear, Math.min(prev, maxStart));
    });
  }, [yearsToShow, dataMinYear, dataMaxYear, updateWindowStart]);

  // Month labels via Intl
  const monthLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: "short" });
    return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2000, i, 15)));
  }, [locale]);

  // Color interpolator
  const colorInterpolator = useMemo(
    () => getColorInterpolator(cfg.ringGradient.scale),
    [cfg.ringGradient.scale],
  );

  const getTypeConfig = useCallback(
    (type: string): TypeConfig => {
      return cfg.types.find((t) => t.key === type) ?? cfg.types[0] ?? DEFAULT_CONFIG.types[0];
    },
    [cfg.types],
  );

  /* ── One-time SVG layer initialization ── */
  const initLayers = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const sel = d3.select(svg);
    sel.selectAll("*").remove();

    const width = svg.clientWidth;
    const height = svg.clientHeight;
    if (width === 0 || height === 0) return;

    const root = sel
      .append("g")
      .attr("class", "root")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    layersRef.current = {
      root,
      seasonBg: root.append("g").attr("class", "layer-season-bg"),
      radialLines: root.append("g").attr("class", "layer-radial-lines"),
      spiral: root.append("g").attr("class", "layer-spiral"),
      yearMarkers: root.append("g").attr("class", "layer-year-markers"),
      monthLabels: root.append("g").attr("class", "layer-month-labels"),
      dataNodes: root.append("g").attr("class", "layer-data-nodes"),
      initialized: false,
    };
  }, []);

  /* ── Draw static layers (season bg, radial lines, month labels) ── */
  const drawStaticLayers = useCallback(
    (maxRadius: number) => {
      const layers = layersRef.current;
      if (!layers) return;

      layers.seasonBg.selectAll("*").remove();
      layers.radialLines.selectAll("*").remove();
      layers.monthLabels.selectAll("*").remove();

      // Season background wedges + radial lines
      for (let m = 0; m < 12; m++) {
        const arcStartAngle = -(m + 1) * (Math.PI / 6);
        const arcEndAngle = -m * (Math.PI / 6);
        const segmentsPerWedge = 12;
        const seasonColor = getMonthColor(m);

        for (let seg = 0; seg < segmentsPerWedge; seg++) {
          const innerR = (seg * maxRadius) / segmentsPerWedge;
          const outerR = ((seg + 1) * maxRadius) / segmentsPerWedge;
          const progress = seg / segmentsPerWedge;
          const segColor = d3.interpolateRgb("rgba(0,0,0,0)", seasonColor)(progress);
          const opacity = 0.2 * progress;

          const arcPath = d3
            .arc<unknown>()
            .innerRadius(innerR)
            .outerRadius(outerR)
            .startAngle(arcStartAngle)
            .endAngle(arcEndAngle);

          layers.seasonBg
            .append("path")
            .attr("d", arcPath(null as never))
            .attr("fill", segColor)
            .attr("opacity", opacity);
        }

        // Radial month grid line with gradient opacity
        const monthAngle = -Math.PI / 2 - (m * Math.PI) / 6;
        const lineSegments = 6;
        for (let i = 0; i < lineSegments; i++) {
          const r1 = (i / lineSegments) * maxRadius + cfg.radialGrid.monthExtraLength;
          const r2 = ((i + 1) / lineSegments) * maxRadius + cfg.radialGrid.monthExtraLength;
          const lineOpacity = (i / lineSegments) * 0.2;
          layers.radialLines
            .append("line")
            .attr("x1", Math.cos(monthAngle) * r1)
            .attr("y1", Math.sin(monthAngle) * r1)
            .attr("x2", Math.cos(monthAngle) * r2)
            .attr("y2", Math.sin(monthAngle) * r2)
            .attr("stroke", "var(--spiral-text-secondary, #cbd5e1)")
            .attr("stroke-width", 1.5)
            .attr("opacity", lineOpacity);
        }

        // Week tick marks (3 per month) at outer edge
        const monthArcSpan = Math.PI / 6; // 30° per month
        for (let w = 1; w <= 3; w++) {
          const weekFraction = w / 4; // 4 weeks per month
          if (weekFraction >= 1) break;
          const weekAngle = -Math.PI / 2 - (m + weekFraction) * monthArcSpan;
          const wr1 = maxRadius;
          const wr2 = maxRadius + cfg.radialGrid.weekExtraLength;
          layers.radialLines
            .append("line")
            .attr("x1", Math.cos(weekAngle) * wr1)
            .attr("y1", Math.sin(weekAngle) * wr1)
            .attr("x2", Math.cos(weekAngle) * wr2)
            .attr("y2", Math.sin(weekAngle) * wr2)
            .attr("stroke", "var(--spiral-text-secondary, #cbd5e1)")
            .attr("stroke-width", 1)
            .attr("opacity", 0.2);
        }

        // Day tick marks (28 per month, like "7 days a week") at outer edge
        for (let d = 1; d < 28; d++) {
          const dayFraction = d / 28;
          const dayAngle = -Math.PI / 2 - (m + dayFraction) * monthArcSpan;
          // Skip positions that overlap with week lines
          const isWeekDay = d % 7 === 0;
          if (isWeekDay) continue;
          const dr1 = maxRadius;
          const dr2 = maxRadius + cfg.radialGrid.dayExtraLength;
          layers.radialLines
            .append("line")
            .attr("x1", Math.cos(dayAngle) * dr1)
            .attr("y1", Math.sin(dayAngle) * dr1)
            .attr("x2", Math.cos(dayAngle) * dr2)
            .attr("y2", Math.sin(dayAngle) * dr2)
            .attr("stroke", "var(--spiral-text-secondary, #cbd5e1)")
            .attr("stroke-width", 1)
            .attr("opacity", 0.2);
        }
      }

      // Month labels at outer edge
      for (let m = 0; m < 12; m++) {
        const angle = -Math.PI / 2 - (m + 0.5) * (Math.PI / 6);
        const labelRadius = maxRadius + 30;
        layers.monthLabels
          .append("text")
          .attr("x", Math.cos(angle) * labelRadius)
          .attr("y", Math.sin(angle) * labelRadius)
          .attr("class", "axis-label")
          .text(monthLabels[m]);
      }
    },
    [monthLabels, cfg.radialGrid],
  );

  /* ── Spiral point helper with fog/gradient for a given geometry ── */
  const spiralPointWith = useCallback(
    (
      absYear: number,
      geomOldestYear: number,
      geomRadiusIncrement: number,
      geomYearRange: number,
      geomNewestYear: number,
    ) => {
      const rotations = absYear - geomOldestYear;
      const angle = -Math.PI / 2 - rotations * 2 * Math.PI;
      const radius = rotations * geomRadiusIncrement;

      let opacity: number;
      if (rotations < 0) {
        opacity = 0;
      } else if (absYear > geomNewestYear + FADE_OUT_FRACTION) {
        opacity = 0;
      } else if (rotations < 1) {
        opacity = rotations;
      } else if (absYear > geomNewestYear) {
        const tailProgress = (absYear - geomNewestYear) / FADE_OUT_FRACTION;
        opacity = (1 - tailProgress) ** 3;
      } else if (cfg.fog.enabled && rotations > cfg.fog.startRing) {
        opacity = Math.max(
          0.1,
          1 - ((rotations - cfg.fog.startRing) / geomYearRange) * cfg.fog.intensity,
        );
      } else {
        opacity = 1;
      }

      const color =
        cfg.ringGradient.enabled && cfg.ringGradient.applyTo.includes("grid")
          ? getYearColor(Math.floor(Math.max(0, rotations)), colorInterpolator)
          : "rgba(203, 213, 225, 0.3)";

      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        opacity,
        color,
        rotations,
      };
    },
    [cfg.fog, cfg.ringGradient, colorInterpolator],
  );

  const prevMonthLabelsRef = useRef<string[]>(monthLabels);

  /* ── Main D3 rendering effect ── */
  // biome-ignore lint/correctness/useExhaustiveDependencies: renderKey triggers re-render on resize
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !layersRef.current) return;

    const layers = layersRef.current;
    const isFirstRender = !layers.initialized;
    layers.initialized = true;

    const width = svg.clientWidth;
    const height = svg.clientHeight;
    if (width === 0 || height === 0) return;

    // Re-center root
    layers.root.attr("transform", `translate(${width / 2},${height / 2})`);

    const maxRadius = computeMaxRadius(width, height);
    const oldestYear = windowStart - 1;
    const newestYear = windowEnd + 1;
    const yearRange = newestYear - oldestYear;
    const totalTurns = yearRange;
    const radiusIncrement = maxRadius / totalTurns;

    const DURATION = isFirstRender ? 0 : cfg.animations.enabled ? cfg.animations.duration : 0;

    // Reset after use
    lastChangeSourceRef.current = "other";

    // Draw static layers on first render, resize, or locale change
    const labelsChanged =
      prevMonthLabelsRef.current.length !== monthLabels.length ||
      prevMonthLabelsRef.current.some((l, i) => l !== monthLabels[i]);
    if (isFirstRender || labelsChanged) {
      drawStaticLayers(maxRadius);
      prevMonthLabelsRef.current = monthLabels;
    }

    const spiralPointAtCurrent = (absYear: number) =>
      spiralPointWith(absYear, oldestYear, radiusIncrement, yearRange, newestYear);

    const prevGeom = prevGeomRef.current;
    const hasPrevGeom = prevGeom !== null && !isFirstRender;

    const spiralPointAtPrev = hasPrevGeom
      ? (absYear: number) =>
          spiralPointWith(
            absYear,
            prevGeom.oldestYear,
            prevGeom.radiusIncrement,
            prevGeom.yearRange,
            prevGeom.newestYear,
          )
      : spiralPointAtCurrent;

    // ── SPIRAL PATH SEGMENTS (data-joined) ──
    interface SegDatum {
      key: number;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      opacity: number;
      color: string;
      px1: number;
      py1: number;
      px2: number;
      py2: number;
      pOpacity: number;
      pColor: string;
    }

    const spiralSegData: SegDatum[] = [];
    const mainSegments = yearRange * SEGS_PER_YEAR;

    for (let i = 0; i < mainSegments; i++) {
      const absY1 = oldestYear + i / SEGS_PER_YEAR;
      const absY2 = oldestYear + (i + 1) / SEGS_PER_YEAR;
      const p1 = spiralPointAtCurrent(absY1);
      const p2 = spiralPointAtCurrent(absY2);
      const pp1 = spiralPointAtPrev(absY1);
      const pp2 = spiralPointAtPrev(absY2);
      spiralSegData.push({
        key: Math.round(absY1 * SEGS_PER_YEAR),
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        opacity: p1.opacity,
        color: p1.color,
        px1: pp1.x,
        py1: pp1.y,
        px2: pp2.x,
        py2: pp2.y,
        pOpacity: pp1.opacity,
        pColor: pp1.color,
      });
    }

    // Fade-out tail beyond newestYear
    const tailSegments = Math.ceil(FADE_OUT_FRACTION * SEGS_PER_YEAR);
    for (let i = 0; i < tailSegments; i++) {
      const absY1 = newestYear + i / SEGS_PER_YEAR;
      const absY2 = newestYear + (i + 1) / SEGS_PER_YEAR;
      const p1 = spiralPointAtCurrent(absY1);
      const p2 = spiralPointAtCurrent(absY2);
      p1.opacity = (1 - i / tailSegments) ** 3;
      const pp1 = spiralPointAtPrev(absY1);
      const pp2 = spiralPointAtPrev(absY2);
      spiralSegData.push({
        key: Math.round(absY1 * SEGS_PER_YEAR),
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        opacity: p1.opacity,
        color: p1.color,
        px1: pp1.x,
        py1: pp1.y,
        px2: pp2.x,
        py2: pp2.y,
        pOpacity: pp1.opacity,
        pColor: pp1.color,
      });
    }

    // D3 data join for spiral segments
    layers.spiral
      .selectAll<SVGLineElement, SegDatum>("line.spiral-seg")
      .data(spiralSegData, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append("line")
            .attr("class", "spiral-seg")
            .attr("x1", (d) => d.px1)
            .attr("y1", (d) => d.py1)
            .attr("x2", (d) => d.px2)
            .attr("y2", (d) => d.py2)
            .attr("stroke", (d) => d.pColor)
            .attr("stroke-width", 2)
            .attr("opacity", (d) => (hasPrevGeom ? d.pOpacity : 0))
            .call((sel) =>
              sel
                .transition()
                .duration(DURATION)
                .attr("x1", (d) => d.x1)
                .attr("y1", (d) => d.y1)
                .attr("x2", (d) => d.x2)
                .attr("y2", (d) => d.y2)
                .attr("stroke", (d) => d.color)
                .attr("opacity", (d) => d.opacity),
            ),
        (update) =>
          update.call((sel) =>
            sel
              .transition()
              .duration(DURATION)
              .attr("x1", (d) => d.x1)
              .attr("y1", (d) => d.y1)
              .attr("x2", (d) => d.x2)
              .attr("y2", (d) => d.y2)
              .attr("stroke", (d) => d.color)
              .attr("opacity", (d) => d.opacity),
          ),
        (exit) =>
          exit.call((sel) =>
            sel.each(function (d) {
              const absY1 = d.key / SEGS_PER_YEAR;
              const absY2 = absY1 + 1 / SEGS_PER_YEAR;
              const np1 = spiralPointAtCurrent(absY1);
              const np2 = spiralPointAtCurrent(absY2);
              d3.select(this)
                .transition()
                .duration(DURATION)
                .attr("x1", np1.x)
                .attr("y1", np1.y)
                .attr("x2", np2.x)
                .attr("y2", np2.y)
                .attr("opacity", 0)
                .remove();
            }),
          ),
      );

    // Save current geometry for next transition
    prevGeomRef.current = { oldestYear, radiusIncrement, yearRange, newestYear };

    // ── YEAR MARKERS (data-joined) ──
    const _markerAngle = yearLabelPositionToAngle(
      cfg.yearLabelPosition as Parameters<typeof yearLabelPositionToAngle>[0],
    );

    interface YearDatum {
      year: number;
      mx: number;
      my: number;
      lx: number;
      ly: number;
      opacity: number;
      labelColor: string;
      pmx: number;
      pmy: number;
      plx: number;
      ply: number;
      prevOpacity: number;
    }

    const yearMarkerData: YearDatum[] = [];
    for (let i = 0; i <= yearRange; i++) {
      const year = oldestYear + i;
      const rotations = i;
      let opacity: number;
      if (i === 0) {
        opacity = 0;
      } else if (cfg.fog.enabled && rotations >= cfg.fog.startRing) {
        opacity = computeFogOpacity(rotations, cfg.fog, yearRange);
      } else {
        opacity = 1;
      }

      const labelColor =
        cfg.ringGradient.enabled && cfg.ringGradient.applyTo.includes("labels")
          ? getYearColor(i, colorInterpolator)
          : "var(--spiral-text-secondary, #cbd5e1)";

      const pos = yearMarkerPos(
        year,
        cfg.yearLabelPosition as Parameters<typeof yearMarkerPos>[1],
        oldestYear,
        radiusIncrement,
      );

      let pPos = pos;
      let prevOpacity = 0;
      if (hasPrevGeom) {
        pPos = yearMarkerPos(
          year,
          cfg.yearLabelPosition as Parameters<typeof yearMarkerPos>[1],
          prevGeom.oldestYear,
          prevGeom.radiusIncrement,
        );
        const prevRotations = year - prevGeom.oldestYear;
        if (prevRotations > 0 && prevRotations <= prevGeom.yearRange) {
          prevOpacity = prevRotations < 1 ? prevRotations : 1;
        }
      }

      yearMarkerData.push({
        year,
        ...pos,
        opacity,
        labelColor,
        pmx: pPos.mx,
        pmy: pPos.my,
        plx: pPos.lx,
        ply: pPos.ly,
        prevOpacity,
      });
    }

    // Pre-compute exit positions for year markers
    const yearExitTargets = new Map<number, { mx: number; my: number; lx: number; ly: number }>();
    layers.yearMarkers.selectAll<SVGGElement, YearDatum>("g.year-marker").each((d) => {
      if (!yearMarkerData.find((v) => v.year === d.year)) {
        const pos = yearMarkerPos(
          d.year,
          cfg.yearLabelPosition as Parameters<typeof yearMarkerPos>[1],
          oldestYear,
          radiusIncrement,
        );
        yearExitTargets.set(d.year, pos);
      }
    });

    layers.yearMarkers
      .selectAll<SVGGElement, YearDatum>("g.year-marker")
      .data(yearMarkerData, (d) => d.year)
      .join(
        (enter) => {
          const g = enter.append("g").attr("class", "year-marker");
          g.append("circle")
            .attr("cx", (d) => d.pmx)
            .attr("cy", (d) => d.pmy)
            .attr("r", 5)
            .attr("fill", (d) => d.labelColor);
          g.append("text")
            .attr("x", (d) => d.plx)
            .attr("y", (d) => d.ply)
            .attr("class", "year-label")
            .attr("fill", (d) => d.labelColor)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "700")
            .text((d) => d.year);
          g.attr("opacity", (d) => d.prevOpacity);
          g.each(function (d) {
            const el = d3.select(this);
            el.transition().duration(DURATION).attr("opacity", d.opacity);
            el.select("circle").transition().duration(DURATION).attr("cx", d.mx).attr("cy", d.my);
            el.select("text").transition().duration(DURATION).attr("x", d.lx).attr("y", d.ly);
          });
          return g;
        },
        (update) =>
          update.call((sel) => {
            sel
              .transition()
              .duration(DURATION)
              .attr("opacity", (d) => d.opacity);
            sel.each(function (d) {
              const el = d3.select(this);
              el.select("circle")
                .transition()
                .duration(DURATION)
                .attr("cx", d.mx)
                .attr("cy", d.my)
                .attr("fill", d.labelColor);
              el.select("text")
                .transition()
                .duration(DURATION)
                .attr("x", d.lx)
                .attr("y", d.ly)
                .attr("fill", d.labelColor);
            });
          }),
        (exit) =>
          exit.call((sel) =>
            sel.each(function (d) {
              const target = yearExitTargets.get(d.year);
              const el = d3.select(this);
              el.transition().duration(DURATION).attr("opacity", 0).remove();
              if (target) {
                el.select("circle")
                  .transition()
                  .duration(DURATION)
                  .attr("cx", target.mx)
                  .attr("cy", target.my);
                el.select("text")
                  .transition()
                  .duration(DURATION)
                  .attr("x", target.lx)
                  .attr("y", target.ly);
              }
            }),
          ),
      );

    // ── DATA NODES (data-joined) ──
    const frameDataStart = oldestYear + 1;
    const frameDataEnd = newestYear;
    const prevFrameStart = hasPrevGeom ? prevGeom.oldestYear + 1 : frameDataStart;
    const prevFrameEnd = hasPrevGeom ? prevGeom.newestYear : frameDataEnd;

    const dateToSpiralPrev = hasPrevGeom
      ? (date: Date) => {
          const yDiff = date.getFullYear() - prevGeom.oldestYear;
          const doy = getDayOfYear(date);
          const rot = yDiff + doy / 365;
          const a = -Math.PI / 2 - rot * 2 * Math.PI;
          const r = rot * prevGeom.radiusIncrement;
          return { x: Math.cos(a) * r, y: Math.sin(a) * r };
        }
      : (date: Date) => {
          const sp = dateToSpiral(date, oldestYear, radiusIncrement);
          return { x: sp.x, y: sp.y };
        };

    interface VisibleNode extends DataNode {
      nodeId: string;
      x: number;
      y: number;
      px: number;
      py: number;
      wasVisible: boolean;
      color: string;
      shape: string;
    }

    const visibleData: VisibleNode[] = validData
      .filter((node) => {
        const y = node.date.getFullYear();
        return y >= frameDataStart && y < frameDataEnd;
      })
      .map((node) => {
        const pos = dateToSpiral(node.date, oldestYear, radiusIncrement);
        const prevPos = dateToSpiralPrev(node.date);
        const tc = getTypeConfig(node.type);
        const y = node.date.getFullYear();
        const wasVisible = hasPrevGeom && y >= prevFrameStart && y < prevFrameEnd;
        return {
          ...node,
          nodeId: `${node.id ?? node.title}_${node.date.getTime()}`,
          x: pos.x,
          y: pos.y,
          px: prevPos.x,
          py: prevPos.y,
          wasVisible,
          color: tc.color,
          shape: tc.shape,
        };
      });

    // Spiral tween helper for smooth position interpolation
    const spiralTween = (
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      scaleStart: number,
      scaleEnd: number,
    ) => {
      const interpX = d3.interpolate(startX, endX);
      const interpY = d3.interpolate(startY, endY);
      const interpS = d3.interpolate(scaleStart, scaleEnd);
      return (t: number) => `translate(${interpX(t)},${interpY(t)}) scale(${interpS(t)})`;
    };

    const dateFormatOpts: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    layers.dataNodes
      .selectAll<SVGGElement, VisibleNode>("g.data-node")
      .data(visibleData, (d) => d.nodeId)
      .join(
        (enter) => {
          const g = enter
            .append("g")
            .attr("class", "data-node")
            .attr("tabindex", "0")
            .attr("role", "button")
            .attr(
              "aria-label",
              (d) => `${d.title} - ${d.date.toLocaleDateString(locale, dateFormatOpts)}`,
            )
            .attr("transform", (d) =>
              d.wasVisible
                ? `translate(${d.px},${d.py}) scale(1)`
                : `translate(${d.px},${d.py}) scale(0)`,
            )
            .attr("opacity", (d) => (d.wasVisible ? 1 : 0));

          g.each(function (d) {
            drawShape(
              d3.select(this) as d3.Selection<SVGGElement, unknown, null, undefined>,
              d.shape as Parameters<typeof drawShape>[1],
              NODE_SIZE,
              d.color,
            );
          });

          // Interaction handlers
          g.on("mouseenter", (event: MouseEvent, d: VisibleNode) => {
            setHoveredNode(d);
            const svgEl = svgRef.current;
            if (svgEl) {
              const [mx, my] = d3.pointer(event, svgEl);
              setTooltipPos({ x: mx, y: my });
            }
          })
            .on("mouseleave", () => {
              setHoveredNode(null);
            })
            .on("click", (event: MouseEvent, d: VisibleNode) => {
              cfg.onNodeClick?.(d, event);
            })
            .on("keydown", (event: KeyboardEvent, d: VisibleNode) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                cfg.onNodeClick?.(d, event as unknown as MouseEvent);
              }
            });

          g.transition()
            .duration(DURATION)
            .attrTween("transform", (d) =>
              spiralTween(d.px, d.py, d.x, d.y, d.wasVisible ? 1 : 0, 1),
            )
            .attr("opacity", 1);

          return g;
        },

        (update) =>
          update.call((sel) =>
            sel.each(function (d) {
              const cur = d3.select(this).attr("transform");
              const m = cur?.match(/translate\(([-\d.e+]+),([-\d.e+]+)\)/);
              const cx = m ? +m[1] : d.px;
              const cy = m ? +m[2] : d.py;
              d3.select(this)
                .transition()
                .duration(DURATION)
                .attrTween("transform", () => spiralTween(cx, cy, d.x, d.y, 1, 1))
                .attr("opacity", 1);
            }),
          ),
        (exit) =>
          exit.call((sel) =>
            sel.each(function (d) {
              const target = dateToSpiral(d.date, oldestYear, radiusIncrement);
              const cur = d3.select(this).attr("transform");
              const m = cur?.match(/translate\(([-\d.e+]+),([-\d.e+]+)\)/);
              const cx = m ? +m[1] : 0;
              const cy = m ? +m[2] : 0;
              d3.select(this)
                .transition()
                .duration(DURATION)
                .attrTween("transform", () => spiralTween(cx, cy, target.x, target.y, 1, 0))
                .attr("opacity", 0)
                .remove();
            }),
          ),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    validData,
    windowStart,
    windowEnd,
    renderKey,
    cfg,
    drawStaticLayers,
    spiralPointWith,
    colorInterpolator,
    getTypeConfig,
    locale,
    monthLabels,
  ]);

  /* ── ResizeObserver (debounced 200ms) ── */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const container = svg.parentElement;
    if (!container) return;

    let prevWidth = 0;
    let prevHeight = 0;
    let timeout: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver((entries) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const entry = entries[0];
        if (!entry) return;
        const { width, height } = entry.contentRect;
        // Skip if neither dimension changed — avoids wiping a valid render
        if (width === prevWidth && height === prevHeight) return;
        prevWidth = width;
        prevHeight = height;
        initLayers();
        setContainerWidth(width);
        setRenderKey((k) => k + 1);
      }, RESIZE_DEBOUNCE_MS);
    });

    observer.observe(container);
    // Initial size
    prevWidth = container.clientWidth;
    prevHeight = container.clientHeight;
    setContainerWidth(container.clientWidth);
    setRenderKey((k) => k + 1);
    initLayers();

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      // Clean up D3 selections
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll("*").interrupt();
        d3.select(svgRef.current).selectAll("*").remove();
      }
      layersRef.current = null;
      prevGeomRef.current = null;
    };
  }, [initLayers]);

  /* ── Slider-driven window start change ── */
  const handleWindowStartChange = useCallback(
    (newStart: number) => {
      lastChangeSourceRef.current = "slider";
      updateWindowStart(newStart);
    },
    [updateWindowStart],
  );

  /* ── Mouse wheel scroll ── */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!cfg.zoom.mouseWheel) return;
      e.preventDefault();
      if (e.deltaY > 0) {
        // Scroll forward in time
        updateWindowStart((prev) => Math.min(dataMaxYear - yearsToShow + 1, prev + 1));
      } else {
        // Scroll backward in time
        updateWindowStart((prev) => Math.max(dataMinYear, prev - 1));
      }
    },
    [cfg.zoom.mouseWheel, dataMinYear, dataMaxYear, yearsToShow, updateWindowStart],
  );

  /* ── Zoom handler (for ZoomControls + mouse wheel) ── */
  const handleYearsToShowChange = useCallback(
    (newValue: number) => {
      const clamped = Math.max(1, Math.min(totalDataYears, newValue));
      setYearsToShow(clamped);
      onYearsToShowChange?.(clamped);
    },
    [totalDataYears, onYearsToShowChange],
  );

  /* ── Tooltip date formatting ── */
  const formattedTooltipDate = useMemo(() => {
    if (!hoveredNode) return "";
    return hoveredNode.date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [hoveredNode, locale]);

  const showControls = containerWidth >= 300;

  /* ── Render ── */
  return (
    <div className={`spiral-timeline${className ? ` ${className}` : ""}`}>
      {showControls && (
        <ZoomControls
          yearsToShow={yearsToShow}
          totalDataYears={totalDataYears}
          zoomConfig={cfg.zoom}
          labels={cfg.labels}
          windowStart={windowStart}
          windowEnd={windowEnd}
          onYearsToShowChange={handleYearsToShowChange}
        />
      )}

      <div className="spiral-timeline__svg-wrap" onWheel={handleWheel}>
        <svg ref={svgRef}>
          <title>Spiral Timeline</title>
        </svg>
        <div
          className={`spiral-timeline__tooltip${hoveredNode ? " spiral-timeline__tooltip--visible" : ""}`}
          style={{ left: tooltipPos.x + 10, top: tooltipPos.y + 10 }}
        >
          {hoveredNode && (
            <>
              <div className="spiral-timeline__tooltip-title">{hoveredNode.title}</div>
              <div className="spiral-timeline__tooltip-content">{hoveredNode.content}</div>
              <div className="spiral-timeline__tooltip-date">{formattedTooltipDate}</div>
            </>
          )}
        </div>
      </div>

      {cfg.timeWindow.visible && (
        <TimeWindowSlider
          dataMinYear={dataMinYear}
          dataMaxYear={dataMaxYear}
          yearsToShow={yearsToShow}
          windowStart={windowStart}
          labels={cfg.labels}
          onWindowStartChange={handleWindowStartChange}
          animationEnabled={cfg.timeWindow.animationEnabled}
          animationDuration={cfg.timeWindow.animationDuration}
        />
      )}
    </div>
  );
}
