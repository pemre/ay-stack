import { X } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ContentType, SidebarWidgetConfig } from "../../../shared/types.ts";
import type { WidgetConfigPanelProps } from "./types.ts";
import "./configPanels.css";

const CONTENT_TYPE_OPTIONS: (ContentType | "all")[] = [
  "all",
  "markdown",
  "image",
  "video",
  "audio",
];

export function SidebarConfigPanel({ instance, onUpdate, onClose }: WidgetConfigPanelProps) {
  const { t } = useTranslation();
  const config = instance.config as SidebarWidgetConfig;
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !config.tags.includes(tag)) {
      onUpdate({ type: "sidebar", tags: [...config.tags, tag], contentType: config.contentType });
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tag: string) => {
    onUpdate({
      type: "sidebar",
      tags: config.tags.filter((t) => t !== tag),
      contentType: config.contentType,
    });
  };

  const handleContentTypeChange = (value: string) => {
    const contentType = value === "all" ? null : (value as ContentType);
    onUpdate({ type: "sidebar", tags: config.tags, contentType });
  };

  return (
    <div className="config-panel" role="dialog" aria-label={t("config.sidebar.title")}>
      <div className="config-panel__header">
        <span>{t("config.sidebar.title")}</span>
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
        <span className="config-panel__label">{t("config.sidebar.tags")}</span>
        {config.tags.length > 0 && (
          <div className="config-panel__tags">
            {config.tags.map((tag) => (
              <span key={tag} className="config-panel__chip">
                {tag}
                <button
                  type="button"
                  className="config-panel__chip-remove"
                  aria-label={t("config.sidebar.removeTag", { tag })}
                  onClick={() => handleRemoveTag(tag)}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
        <label>
          <span className="config-panel__label">{t("config.sidebar.addTag")}</span>
          <input
            type="text"
            className="config-panel__input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={handleAddTag}
            placeholder={t("config.sidebar.tagPlaceholder")}
          />
        </label>
      </div>

      <label className="config-panel__field">
        <span className="config-panel__label">{t("config.sidebar.contentType")}</span>
        <select
          className="config-panel__select"
          value={config.contentType ?? "all"}
          onChange={(e) => handleContentTypeChange(e.target.value)}
        >
          {CONTENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {t(`config.sidebar.contentTypeOption.${opt}`)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
