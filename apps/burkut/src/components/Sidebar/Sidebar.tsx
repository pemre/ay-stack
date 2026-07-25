import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ContentEntry, ContentIndex } from "../../shared/types.ts";
import "./Sidebar.css";

interface SidebarProps {
  index: ContentIndex;
  selectedId: string | null;
  activeGroup: string;
  onSelectItem: (id: string) => void;
  onSelectGroup: (group: string) => void;
  completedSet?: Set<string>;
}

/**
 * Parse a front-matter `start` string (e.g. "-002070-01-01", "0581-01-01")
 * into a comparable numeric value. Handles negative (BCE) years correctly.
 * Returns NaN for missing/invalid values so they sort to the end.
 */
function parseStartValue(start?: string): number {
  if (!start) return NaN;
  const match = start.match(/^(-?\d+)-(\d{2})-(\d{2})$/);
  if (!match) return NaN;
  return parseInt(match[1], 10);
}

export default function Sidebar({
  index,
  selectedId,
  activeGroup,
  onSelectItem,
  onSelectGroup,
  completedSet,
}: SidebarProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [activeGroup]: true });

  // Derive unique groups from the content index
  const groups = useMemo(() => {
    const seen = new Set<string>();
    for (const item of Object.values(index)) {
      if (item.group) seen.add(item.group);
    }
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [index]);

  // Auto-expand the active group
  useEffect(() => {
    if (activeGroup) {
      setExpanded((prev) => ({ ...prev, [activeGroup]: true }));
    }
  }, [activeGroup]);

  const toggleGroup = (groupId: string) => {
    setExpanded((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
    onSelectGroup(groupId);
  };

  // Find the group header entry to read sidebarSort config
  const getGroupHeader = (groupId: string): ContentEntry | undefined =>
    Object.values(index).find((item) => item.group === groupId && item._isHeader);

  // Filter items in a group (exclude headers)
  const itemsInGroup = (groupId: string): ContentEntry[] => {
    const header = getGroupHeader(groupId);
    const sortMode = header?.sidebarSort;

    const items = Object.values(index).filter((item) => item.group === groupId && !item._isHeader);

    if (sortMode === "start") {
      items.sort((a, b) => {
        const aVal = parseStartValue(a.start);
        const bVal = parseStartValue(b.start);
        if (Number.isNaN(aVal) && Number.isNaN(bVal)) return 0;
        if (Number.isNaN(aVal)) return 1;
        if (Number.isNaN(bVal)) return -1;
        if (aVal !== bVal) return aVal - bVal;
        const aBg = a.type === "background" ? 0 : 1;
        const bBg = b.type === "background" ? 0 : 1;
        return aBg - bBg;
      });
    } else {
      items.sort((a, b) => (a.title || a.id).localeCompare(b.title || b.id));
    }

    return items;
  };

  return (
    <nav className="sidebar" aria-label={t("aria.sidebar")}>
      {groups.map((groupId) => (
        <div key={groupId} className="sidebar-group">
          <button
            type="button"
            className={`sidebar-group-btn ${activeGroup === groupId ? "active" : ""}`}
            onClick={() => toggleGroup(groupId)}
            aria-expanded={!!expanded[groupId]}
          >
            <span className="sidebar-arrow">
              {expanded[groupId] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            {groupId}
            {completedSet?.has(groupId) && (
              <span className="sidebar-item-done" role="img" aria-label="read">
                <Check size={12} />
              </span>
            )}
          </button>

          {expanded[groupId] && (
            <ul className="sidebar-items">
              {itemsInGroup(groupId).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={[
                      "sidebar-item-btn",
                      selectedId === item.id ? "selected" : "",
                      item.type === "background" ? "sidebar-item-subheader" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => onSelectItem(item.id)}
                    title={item.subtitle || ""}
                  >
                    {item.title || item.id}
                    {completedSet?.has(item.id) && (
                      <span className="sidebar-item-done" role="img" aria-label="read">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  );
}
