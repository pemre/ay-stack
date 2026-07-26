import { Check } from "lucide-react";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  DEFAULT_MARKDOWN_VIEWER_LABELS,
  type MarkdownViewerLabels,
  type MarkdownViewerProps,
} from "./types.ts";
import "./MarkdownViewer.css";

function mergeLabels(user?: MarkdownViewerLabels): Required<MarkdownViewerLabels> {
  return { ...DEFAULT_MARKDOWN_VIEWER_LABELS, ...user };
}

export default function MarkdownViewerClient({
  content,
  isComplete,
  onToggleComplete,
  config,
}: MarkdownViewerProps) {
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
