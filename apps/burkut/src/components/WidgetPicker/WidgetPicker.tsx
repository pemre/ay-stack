import { Modal } from "@ay/ui-library";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "../../stores/dashboardStore.ts";
import { getAllWidgetTypes } from "../WidgetGrid/widgetTypeRegistry.ts";
import "./WidgetPicker.css";

interface WidgetPickerProps {
  dashboardId: string;
  onClose: () => void;
}

export function WidgetPicker({ dashboardId, onClose }: WidgetPickerProps) {
  const { t } = useTranslation();
  const addWidgetInstance = useDashboardStore((s) => s.addWidgetInstance);
  const widgetTypes = getAllWidgetTypes();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const handleSelect = useCallback(
    (typeId: string) => {
      addWidgetInstance(dashboardId, typeId);
      onClose();
    },
    [addWidgetInstance, dashboardId, onClose],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % widgetTypes.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + widgetTypes.length) % widgetTypes.length);
          break;
        case "Enter": {
          e.preventDefault();
          const focused = widgetTypes[focusedIndex];
          if (focused) handleSelect(focused.typeId);
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [widgetTypes, focusedIndex, handleSelect]);

  useEffect(() => {
    const item = listRef.current?.children[focusedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex]);

  return (
    <Modal isOpen onClose={onClose} title={t("widgetPicker.title")}>
      <div className="widget-picker" role="menu" aria-label={t("widgetPicker.title")}>
        <ul className="widget-picker__list" ref={listRef} role="none">
          {widgetTypes.map((type, index) => (
            <li key={type.typeId} role="none">
              <button
                type="button"
                role="menuitem"
                className={`widget-picker__item${index === focusedIndex ? " widget-picker__item--focused" : ""}`}
                tabIndex={index === focusedIndex ? 0 : -1}
                onClick={() => handleSelect(type.typeId)}
              >
                <span className="widget-picker__item-name">{t(type.titleKey)}</span>
                <span className="widget-picker__item-desc">{t(type.descriptionKey)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
