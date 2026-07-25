import { useCallback, useEffect, useRef, useState } from "react";
import type { SpiralTimelineLabels } from "./types.ts";

export interface TimeWindowSliderProps {
  /** Earliest year in the dataset. */
  dataMinYear: number;
  /** Latest year in the dataset. */
  dataMaxYear: number;
  /** Number of years currently visible on the spiral. */
  yearsToShow: number;
  /** First year of the visible window. */
  windowStart: number;
  /** Localized label strings. */
  labels: Required<SpiralTimelineLabels>;
  /** Called when the user drags or clicks to change the window start. */
  onWindowStartChange: (newStart: number) => void;
  /** Enable animated left/right transitions on the draggable window indicator (default: true). */
  animationEnabled?: boolean;
  /** Transition duration in ms for the draggable window indicator movement (default: 400). */
  animationDuration?: number;
}

export function TimeWindowSlider({
  dataMinYear,
  dataMaxYear,
  yearsToShow,
  windowStart,
  labels,
  onWindowStartChange,
  animationEnabled = true,
  animationDuration = 400,
}: TimeWindowSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWindowStart = useRef(0);
  const [isDraggingState, setIsDraggingState] = useState(false);

  const totalDataYears = Math.max(1, dataMaxYear - dataMinYear + 1);
  const windowEnd = windowStart + yearsToShow - 1;
  const windowWidthPercent = (yearsToShow / totalDataYears) * 100;
  const windowLeftPercent = ((windowStart - dataMinYear) / totalDataYears) * 100;

  const clampStart = useCallback(
    (value: number) => Math.max(dataMinYear, Math.min(dataMaxYear - yearsToShow + 1, value)),
    [dataMinYear, dataMaxYear, yearsToShow],
  );

  /* ── Drag handling ── */
  const handleWindowMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      setIsDraggingState(true);
      dragStartX.current = e.clientX;
      dragStartWindowStart.current = windowStart;
      document.body.style.cursor = "grabbing";
      e.preventDefault();
    },
    [windowStart],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !trackRef.current) return;
      const trackWidth = trackRef.current.getBoundingClientRect().width;
      const dx = e.clientX - dragStartX.current;
      const yearsDelta = Math.round((dx / trackWidth) * totalDataYears);
      onWindowStartChange(clampStart(dragStartWindowStart.current + yearsDelta));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      setIsDraggingState(false);
      document.body.style.cursor = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [totalDataYears, clampStart, onWindowStartChange]);

  /* ── Track click → center window on clicked position ── */
  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clickPercent = (e.clientX - rect.left) / rect.width;
      const clickedYear = dataMinYear + clickPercent * totalDataYears;
      onWindowStartChange(clampStart(Math.round(clickedYear - yearsToShow / 2)));
    },
    [dataMinYear, totalDataYears, yearsToShow, clampStart, onWindowStartChange],
  );

  /* ── Mouse wheel scroll → shift window ±1 year ── */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0 || e.deltaX > 0) {
        onWindowStartChange(clampStart(windowStart + 1));
      } else {
        onWindowStartChange(clampStart(windowStart - 1));
      }
    },
    [windowStart, clampStart, onWindowStartChange],
  );

  /* ── Tick marks ── */
  const tickYears: number[] = [];
  for (let y = dataMinYear; y <= dataMaxYear; y++) {
    tickYears.push(y);
  }

  const rangeLabel =
    windowStart === windowEnd ? String(windowStart) : `${windowStart}\u2013${windowEnd}`;

  const windowTransition =
    animationEnabled && !isDraggingState ? `left ${animationDuration}ms ease` : "none";

  return (
    <div className="spiral-timeline__slider" onWheel={handleWheel}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: track click is supplementary to the draggable slider */}
      <div
        className="spiral-timeline__slider-track"
        ref={trackRef}
        onClick={handleTrackClick}
        role="presentation"
      >
        <div className="spiral-timeline__slider-ticks">
          {tickYears.map((y) => {
            const leftPct = ((y - dataMinYear + 0.5) / totalDataYears) * 100;
            return (
              <div key={y} className="spiral-timeline__slider-tick" style={{ left: `${leftPct}%` }}>
                <div className="spiral-timeline__slider-tick-label">{y}</div>
              </div>
            );
          })}
        </div>

        {/* Draggable window indicator */}
        <div
          className="spiral-timeline__slider-window"
          style={{
            left: `${windowLeftPercent}%`,
            width: `${windowWidthPercent}%`,
            transition: windowTransition,
          }}
          onMouseDown={handleWindowMouseDown}
          role="slider"
          aria-label={labels.timeWindowTitle}
          aria-valuemin={dataMinYear}
          aria-valuemax={dataMaxYear}
          aria-valuenow={windowStart}
          aria-valuetext={rangeLabel}
          tabIndex={0}
        >
          <div className="spiral-timeline__slider-window-label">{rangeLabel}</div>
        </div>
      </div>
    </div>
  );
}
