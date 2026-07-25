import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui";
import { WIDGET_REGISTRY } from "../WidgetGrid/widgetRegistry";
import "./WidgetVisibilityMenu.css";

interface WidgetVisibilityMenuProps {
  visibilityState: Record<string, boolean>;
  setWidgetVisible: (widgetId: string, visible: boolean) => void;
}

export function WidgetVisibilityMenu({
  visibilityState,
  setWidgetVisible,
}: WidgetVisibilityMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="widget-visibility-menu" ref={containerRef}>
      <Button
        variant="text"
        className="widget-visibility-menu__toggle"
        aria-label={t("widget.visibility.label")}
        aria-expanded={open}
        title={t("widget.visibility.label")}
        onClick={() => setOpen((prev) => !prev)}
      >
        {t("widget.visibility.label")}
      </Button>
      {open && (
        <div className="widget-visibility-menu__dropdown" role="menu">
          {WIDGET_REGISTRY.map((widget) => (
            <label key={widget.id} className="widget-visibility-menu__item">
              <input
                type="checkbox"
                checked={visibilityState[widget.id] ?? true}
                onChange={(e) => setWidgetVisible(widget.id, e.target.checked)}
              />
              {t(widget.titleKey)}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
