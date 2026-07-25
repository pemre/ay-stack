import { Check } from "lucide-react";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ContentViewModel } from "../../adapters/viewModels.ts";
import "./ContentPanel.css";

// ── Labels ────────────────────────────────────────────────────────────────

export interface ContentPanelLabels {
  /** aria-label for the root article element (default: "Content panel"). */
  ariaLabel?: string;
  /** Rendered when the resolved content has no body (default: "*Content not found.*"). */
  notFound?: string;
  /** aria-label/title for the mark-as-read toggle when unread (default: "Mark as read"). */
  markRead?: string;
  /** aria-label/title for the mark-as-read toggle when read (default: "Mark as unread"). */
  markUnread?: string;
}

export const DEFAULT_CONTENT_PANEL_LABELS: Required<ContentPanelLabels> = {
  ariaLabel: "Content panel",
  notFound: "*Content not found.*",
  markRead: "Mark as read",
  markUnread: "Mark as unread",
};

// ── Config ────────────────────────────────────────────────────────────────

export interface ContentPanelConfig {
  labels?: ContentPanelLabels;
}

function mergeLabels(user?: ContentPanelLabels): Required<ContentPanelLabels> {
  return { ...DEFAULT_CONTENT_PANEL_LABELS, ...user };
}

// ── Props ─────────────────────────────────────────────────────────────────

interface ContentPanelProps {
  content: ContentViewModel;
  isComplete?: (id: string) => boolean;
  onToggleComplete?: (id: string) => void;
  config?: ContentPanelConfig;
}

export default function ContentPanel({
  content,
  isComplete,
  onToggleComplete,
  config,
}: ContentPanelProps) {
  const labels = useMemo(() => mergeLabels(config?.labels), [config?.labels]);

  const markdown = content.markdown ?? labels.notFound;
  const completed = isComplete ? isComplete(content.id) : false;

  return (
    <article className="content-panel" aria-label={labels.ariaLabel}>
      {(content.tags || content.subtitle) && (
        <header className="content-meta">
          <div className="content-meta__left">
            {content.tags && (
              <div className="content-tags">
                {content.tags.map((tag) => (
                  <span key={tag} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {content.subtitle && <p className="content-subtitle">{content.subtitle}</p>}
          </div>
        </header>
      )}

      <div className="content-body">
        {onToggleComplete && (
          <button
            type="button"
            className={`read-toggle ${completed ? "read-toggle--done" : ""}`}
            onClick={() => onToggleComplete(content.id)}
            aria-label={completed ? labels.markUnread : labels.markRead}
            title={completed ? labels.markUnread : labels.markRead}
          >
            <Check size={16} />
          </button>
        )}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </article>
  );
}
