import type { SpiralTimelineLabels, ZoomConfig } from "./types.ts";

export interface ZoomControlsProps {
  /** Current number of visible year rings. */
  yearsToShow: number;
  /** Total number of years in the dataset. */
  totalDataYears: number;
  /** Zoom configuration (buttons, slider visibility). */
  zoomConfig: ZoomConfig;
  /** Localized label strings. */
  labels: Required<SpiralTimelineLabels>;
  /** First year of the visible window (for display template). */
  windowStart: number;
  /** Last year of the visible window (for display template). */
  windowEnd: number;
  /** Called when the user changes the number of visible years. */
  onYearsToShowChange: (newValue: number) => void;
}

export function ZoomControls({
  yearsToShow,
  totalDataYears,
  zoomConfig,
  labels,
  windowStart,
  windowEnd,
  onYearsToShowChange,
}: ZoomControlsProps) {
  if (!zoomConfig.buttons && !zoomConfig.slider) return null;

  const handleZoomIn = () => {
    onYearsToShowChange(Math.max(1, yearsToShow - 1));
  };

  const handleZoomOut = () => {
    onYearsToShowChange(Math.min(totalDataYears, yearsToShow + 1));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onYearsToShowChange(Number.parseInt(e.target.value, 10));
  };

  const zoomValueText = labels.zoomValueTemplate
    .replace("{count}", String(yearsToShow))
    .replace("{start}", String(windowStart))
    .replace("{end}", String(windowEnd));

  return (
    <div className="spiral-timeline__controls">
      {zoomConfig.buttons && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: zoomConfig.slider ? 12 : 0,
          }}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={yearsToShow <= 1}
            aria-label="Zoom in"
          >
            −
          </button>
          <span
            style={{
              fontWeight: 700,
              fontSize: 18,
              color: "var(--spiral-primary)",
              minWidth: 40,
              textAlign: "center",
            }}
          >
            {yearsToShow}
          </span>
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={yearsToShow >= totalDataYears}
            aria-label="Zoom out"
          >
            +
          </button>
        </div>
      )}
      {zoomConfig.slider && (
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--spiral-text-secondary)",
              marginBottom: 4,
            }}
          >
            {labels.zoomSliderLabel}
            <input
              type="range"
              min={1}
              max={totalDataYears}
              step={1}
              value={yearsToShow}
              onChange={handleSliderChange}
              style={{ width: "100%", display: "block", marginTop: 4 }}
            />
          </label>
          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "var(--spiral-text-secondary)",
              marginTop: 4,
            }}
          >
            {zoomValueText}
          </div>
        </div>
      )}
    </div>
  );
}
