import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { MapWidgetConfig } from "../../../shared/types.ts";
import type { WidgetConfigPanelProps } from "./types.ts";
import "./configPanels.css";

export function MapConfigPanel({ instance, onUpdate, onClose }: WidgetConfigPanelProps) {
  const { t } = useTranslation();
  const config = instance.config as MapWidgetConfig;

  const bbox = config.boundingBox ?? { north: 0, south: 0, east: 0, west: 0 };

  const handleBboxChange = (field: "north" | "south" | "east" | "west", value: string) => {
    const num = value === "" ? 0 : Number(value);
    const updated = { ...bbox, [field]: num };
    const isAllZero =
      updated.north === 0 && updated.south === 0 && updated.east === 0 && updated.west === 0;
    onUpdate({
      type: "map",
      boundingBox: isAllZero ? null : updated,
      zoomLevel: config.zoomLevel,
    });
  };

  const handleZoomChange = (value: string) => {
    const zoom = value === "" ? null : Number(value);
    onUpdate({ type: "map", boundingBox: config.boundingBox, zoomLevel: zoom });
  };

  return (
    <div className="config-panel" role="dialog" aria-label={t("config.map.title")}>
      <div className="config-panel__header">
        <span>{t("config.map.title")}</span>
        <button
          type="button"
          className="config-panel__close"
          aria-label={t("widget.close")}
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>

      <div className="config-panel__field">
        <span className="config-panel__label">{t("config.map.boundingBox")}</span>
        <div className="config-panel__row">
          <label className="config-panel__field">
            <span className="config-panel__label">{t("config.map.north")}</span>
            <input
              type="number"
              className="config-panel__input"
              value={bbox.north}
              onChange={(e) => handleBboxChange("north", e.target.value)}
              step="any"
            />
          </label>
          <label className="config-panel__field">
            <span className="config-panel__label">{t("config.map.south")}</span>
            <input
              type="number"
              className="config-panel__input"
              value={bbox.south}
              onChange={(e) => handleBboxChange("south", e.target.value)}
              step="any"
            />
          </label>
          <label className="config-panel__field">
            <span className="config-panel__label">{t("config.map.east")}</span>
            <input
              type="number"
              className="config-panel__input"
              value={bbox.east}
              onChange={(e) => handleBboxChange("east", e.target.value)}
              step="any"
            />
          </label>
          <label className="config-panel__field">
            <span className="config-panel__label">{t("config.map.west")}</span>
            <input
              type="number"
              className="config-panel__input"
              value={bbox.west}
              onChange={(e) => handleBboxChange("west", e.target.value)}
              step="any"
            />
          </label>
        </div>
      </div>

      <label className="config-panel__field">
        <span className="config-panel__label">{t("config.map.zoomLevel")}</span>
        <input
          type="number"
          className="config-panel__input"
          value={config.zoomLevel ?? ""}
          onChange={(e) => handleZoomChange(e.target.value)}
          min={0}
          max={20}
          step={1}
        />
      </label>
    </div>
  );
}
