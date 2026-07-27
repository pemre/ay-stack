import "./ProgressPie.css";

export interface ProgressPieProps {
  /** Completion percentage displayed by the donut chart. */
  percentage?: number;
  /** Width and height of the square SVG. */
  size?: number;
  /** Accessible name for the progress chart. */
  label?: string;
}

/**
 * SVG donut chart with percentage text in the center.
 *
 * The label is supplied by the consuming app so the block stays independent of
 * any translation or application context.
 */
export default function ProgressPie({
  percentage = 0,
  size = 28,
  label = "Progress",
}: ProgressPieProps) {
  const stroke = 2.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const accessibleLabel = `${label}: ${percentage}%`;

  return (
    <div className="progress-pie" role="img" aria-label={accessibleLabel} title={accessibleLabel}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <title>{accessibleLabel}</title>
        <circle
          className="progress-pie__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="progress-pie__fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          className="progress-pie__text"
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
        >
          {percentage}
        </text>
      </svg>
    </div>
  );
}
