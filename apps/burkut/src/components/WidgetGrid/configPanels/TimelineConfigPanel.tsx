import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TimelineWidgetConfig } from "../../../shared/types.ts";
import type { WidgetConfigPanelProps } from "./types.ts";
import "./configPanels.css";

export function TimelineConfigPanel({ instance, onUpdate, onClose }: WidgetConfigPanelProps) {
  const { t } = useTranslation();
  const config = instance.config as TimelineWidgetConfig;

  const handleStartDateChange = (value: string) => {
    onUpdate({ type: "timeline", startDate: value || null, endDate: config.endDate });
  };

  const handleEndDateChange = (value: string) => {
    onUpdate({ type: "timeline", startDate: config.startDate, endDate: value || null });
  };

  return (
    <div className="config-panel" role="dialog" aria-label={t("config.timeline.title")}>
      <div className="config-panel__header">
        <span>{t("config.timeline.title")}</span>
        <button
          type="button"
          className="config-panel__close"
          aria-label={t("widget.close")}
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>

      <label className="config-panel__field">
        <span className="config-panel__label">{t("config.timeline.startDate")}</span>
        <input
          type="date"
          className="config-panel__input"
          value={config.startDate ?? ""}
          onChange={(e) => handleStartDateChange(e.target.value)}
        />
      </label>

      <label className="config-panel__field">
        <span className="config-panel__label">{t("config.timeline.endDate")}</span>
        <input
          type="date"
          className="config-panel__input"
          value={config.endDate ?? ""}
          onChange={(e) => handleEndDateChange(e.target.value)}
        />
      </label>
    </div>
  );
}
