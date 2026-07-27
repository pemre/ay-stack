import { PlusIcon, XIcon } from "@ay/ui-library";
import {
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "../../stores/dashboardStore.ts";
import { getAllTemplates } from "../../stores/templateRegistry.ts";
import "./DashboardBar.css";

export function DashboardBar() {
  const { t } = useTranslation();
  const dashboards = useDashboardStore((s) => s.dashboards);
  const activeDashboardId = useDashboardStore((s) => s.activeDashboardId);
  const setActiveDashboard = useDashboardStore((s) => s.setActiveDashboard);
  const renameDashboard = useDashboardStore((s) => s.renameDashboard);
  const deleteDashboard = useDashboardStore((s) => s.deleteDashboard);
  const createDashboard = useDashboardStore((s) => s.createDashboard);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // ── Focus rename input when entering rename mode ──
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: globalThis.MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  // ── Rename handlers ──

  const startRename = useCallback((id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  }, []);

  const confirmRename = useCallback(
    (id: string) => {
      const trimmed = renameValue.trim();
      if (trimmed.length > 0) {
        renameDashboard(id, trimmed);
      }
      setRenamingId(null);
    },
    [renameValue, renameDashboard],
  );

  const cancelRename = useCallback(() => {
    setRenamingId(null);
  }, []);

  const handleRenameKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, id: string) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmRename(id);
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelRename();
      }
    },
    [confirmRename, cancelRename],
  );

  // ── Tab keyboard navigation ──

  const handleTabKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const count = dashboards.length;

      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const next = e.key === "ArrowRight" ? (index + 1) % count : (index - 1 + count) % count;
        tabsRef.current[next]?.focus();
      } else if (e.key === "Enter") {
        e.preventDefault();
        setActiveDashboard(dashboards[index].id);
      } else if (e.key === "Delete") {
        e.preventDefault();
        if (count > 1) {
          deleteDashboard(dashboards[index].id);
        }
      }
    },
    [dashboards, setActiveDashboard, deleteDashboard],
  );

  // ── Add dashboard handlers ──

  const handleAddClick = useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  const handleTemplateSelect = useCallback(
    (templateId: string) => {
      createDashboard(templateId);
      setDropdownOpen(false);
    },
    [createDashboard],
  );

  const handleBlankSelect = useCallback(() => {
    createDashboard("blank");
    setDropdownOpen(false);
  }, [createDashboard]);

  const templates = getAllTemplates();
  const canDelete = dashboards.length > 1;

  return (
    <div className="dashboard-bar" role="tablist" aria-label={t("dashboard.bar.label")}>
      {dashboards.map((dashboard, index) => {
        const isActive = dashboard.id === activeDashboardId;
        const isRenaming = dashboard.id === renamingId;

        return (
          <button
            key={dashboard.id}
            ref={(el) => {
              tabsRef.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "true" : undefined}
            className={`dashboard-bar__tab${isActive ? " dashboard-bar__tab--active" : ""}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => setActiveDashboard(dashboard.id)}
            onDoubleClick={() => startRename(dashboard.id, dashboard.name)}
            onKeyDown={(e) => handleTabKeyDown(e, index)}
          >
            {isRenaming ? (
              <input
                ref={renameInputRef as RefObject<HTMLInputElement>}
                className="dashboard-bar__rename-input"
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => handleRenameKeyDown(e, dashboard.id)}
                onBlur={() => confirmRename(dashboard.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={t("dashboard.rename.label")}
              />
            ) : (
              <span>{dashboard.name}</span>
            )}

            {canDelete && !isRenaming && (
              <button
                type="button"
                tabIndex={-1}
                className="dashboard-bar__close"
                aria-label={t("dashboard.close")}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDashboard(dashboard.id);
                }}
              >
                <XIcon size={12} />
              </button>
            )}
          </button>
        );
      })}

      {/* Add dashboard button with template dropdown */}
      <div className="dashboard-bar__add-wrapper" ref={dropdownRef}>
        <button
          type="button"
          className="dashboard-bar__add"
          aria-label={t("dashboard.add")}
          title={t("dashboard.add")}
          aria-expanded={dropdownOpen}
          onClick={handleAddClick}
        >
          <PlusIcon size={14} />
        </button>

        {dropdownOpen && (
          <div className="dashboard-bar__dropdown" role="menu">
            <button
              type="button"
              className="dashboard-bar__dropdown-item"
              role="menuitem"
              onClick={handleBlankSelect}
            >
              {t("dashboard.template.blank")}
            </button>
            {templates.map((tmpl) => (
              <button
                key={tmpl.templateId}
                type="button"
                className="dashboard-bar__dropdown-item"
                role="menuitem"
                onClick={() => handleTemplateSelect(tmpl.templateId)}
              >
                {t(tmpl.nameKey)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
