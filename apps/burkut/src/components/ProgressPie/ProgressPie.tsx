import "./ProgressPie.css";
import { useTranslation } from "react-i18next";

interface ProgressPieProps {
  percentage?: number;
  size?: number;
}

/**
 * ProgressPie — SVG donut chart with percentage text in the center.
 */
export default function ProgressPie({ percentage = 0, size = 28 }: ProgressPieProps) {
  const { t } = useTranslation();
  const stroke = 2.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="progress-pie"
      role="img"
      aria-label={`${t("progress.title")}: ${percentage}%`}
      title={`${t("progress.title")}: ${percentage}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <title>{`${t("progress.title")}: ${percentage}%`}</title>
        {/* Track (background circle) */}
        <circle
          className="progress-pie__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        {/* Fill (progress arc) */}
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
        {/* Percentage text */}
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
