import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_TREE_LIST_LABELS, type TreeListLabels, type TreeListProps } from "./types.ts";
import "./TreeList.css";

function mergeLabels(user?: TreeListLabels): Required<TreeListLabels> {
  return { ...DEFAULT_TREE_LIST_LABELS, ...user };
}

export function TreeList({
  tree,
  selectedId,
  activeGroup,
  onSelectItem,
  onSelectGroup,
  config,
}: TreeListProps) {
  const labels = useMemo(() => mergeLabels(config?.labels), [config?.labels]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [activeGroup]: true });

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
