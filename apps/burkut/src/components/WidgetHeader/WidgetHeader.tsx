import { Copy, Settings, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import config from "../../config";
import "./WidgetHeader.css";

interface WidgetHeaderProps {
  titleKey: string;
  onClose?: () => void;
  children?: React.ReactNode;
  // Dashboard mode props
  onConfigClick?: () => void;
  onDuplicateClick?: () => void;
  onRemoveClick?: () => void;
}

export function WidgetHeader({
  titleKey,
  onClose,
  children,
  onConfigClick,
  onDuplicateClick,
  onRemoveClick,
}: WidgetHeaderProps) {
  const { t } = useTranslation();
  const draggable = config.features.draggableLayout;

  const hasDashboardActions = onConfigClick || onDuplicateClick || onRemoveClick;

  return (
    <div className={`widget-header${draggable ? " widget-header--draggable" : ""}`}>
      <span className="widget-header__title">{t(titleKey)}</span>
      {children && <div className="widget-header__actions">{children}</div>}
      {hasDashboardActions && (
        <div className="widget-header__actions">
          {onConfigClick && (
            <button
              type="button"
              className="widget-header__action"
              aria-label={t("widget.config")}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onConfigClick}
            >
              <Settings size={14} />
            </button>
          )}
          {onDuplicateClick && (
            <button
              type="button"
              className="widget-header__action"
              aria-label={t("widget.duplicate")}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onDuplicateClick}
            >
              <Copy size={14} />
            </button>
          )}
          {onRemoveClick && (
            <button
              type="button"
              className="widget-header__action"
              aria-label={t("widget.remove")}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onRemoveClick}
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
      {draggable && onClose && (
        <button
          type="button"
          className="widget-header__close"
          aria-label={t("widget.close")}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClose}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
