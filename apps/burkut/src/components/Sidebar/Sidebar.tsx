import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { TreeNode } from "../../adapters/viewModels.ts";
import "./Sidebar.css";

// ── Labels ────────────────────────────────────────────────────────────────

export interface SidebarLabels {
  /** aria-label for the root nav element (default: "Content menu"). */
  ariaLabel?: string;
}

export const DEFAULT_SIDEBAR_LABELS: Required<SidebarLabels> = {
  ariaLabel: "Content menu",
};

// ── Config ────────────────────────────────────────────────────────────────

export interface SidebarConfig {
  labels?: SidebarLabels;
}

function mergeLabels(user?: SidebarLabels): Required<SidebarLabels> {
  return { ...DEFAULT_SIDEBAR_LABELS, ...user };
}

// ── Props ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  tree: TreeNode[];
  selectedId: string | null;
  activeGroup: string;
  onSelectItem: (id: string) => void;
  onSelectGroup: (group: string) => void;
  config?: SidebarConfig;
}

export default function Sidebar({
  tree,
  selectedId,
  activeGroup,
  onSelectItem,
  onSelectGroup,
  config,
}: SidebarProps) {
  const labels = useMemo(() => mergeLabels(config?.labels), [config?.labels]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [activeGroup]: true });

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

  return (
    <nav className="sidebar" aria-label={labels.ariaLabel}>
      {tree.map((group) => (
        <div key={group.id} className="sidebar-group">
          <button
            type="button"
            className={`sidebar-group-btn ${activeGroup === group.id ? "active" : ""}`}
            onClick={() => toggleGroup(group.id)}
            aria-expanded={!!expanded[group.id]}
          >
            <span className="sidebar-arrow">
              {expanded[group.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            {group.label}
            {group.completed && (
              <span className="sidebar-item-done" role="img" aria-label="read">
                <Check size={12} />
              </span>
            )}
          </button>

          {expanded[group.id] && (
            <ul className="sidebar-items">
              {(group.children ?? []).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={[
                      "sidebar-item-btn",
                      selectedId === item.id ? "selected" : "",
                      item.isSubheading ? "sidebar-item-subheader" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => onSelectItem(item.id)}
                    title={item.tooltip || ""}
                  >
                    {item.label}
                    {item.completed && (
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
