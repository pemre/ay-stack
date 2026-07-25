import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ContentWidgetConfig } from "../../../shared/types.ts";
import type { WidgetConfigPanelProps } from "./types.ts";
import "./configPanels.css";

export function ContentConfigPanel({ instance, onUpdate, onClose }: WidgetConfigPanelProps) {
  const { t } = useTranslation();
  const config = instance.config as ContentWidgetConfig;

  const handlePinnedItemChange = (value: string) => {
    onUpdate({ type: "content", pinnedItemId: value || null });
  };

  return (
    <div className="config-panel" role="dialog" aria-label={t("config.content.title")}>
      <div className="config-panel__header">
        <span>{t("config.content.title")}</span>
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
        <span className="config-panel__label">{t("config.content.pinnedItemId")}</span>
        <input
          type="text"
          className="config-panel__input"
          value={config.pinnedItemId ?? ""}
          onChange={(e) => handlePinnedItemChange(e.target.value)}
          placeholder={t("config.content.pinnedItemPlaceholder")}
        />
      </label>
    </div>
  );
}
