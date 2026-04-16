import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ContentIndex } from "../../shared/types.ts";
import "./ContentPanel.css";

interface ContentPanelProps {
  selectedId: string | null;
  activeGroup: string;
  index: ContentIndex;
  getContent: (id: string) => string | null;
  isComplete?: (id: string) => boolean;
  onToggleComplete?: (id: string) => void;
}

export default function ContentPanel({
  selectedId,
  activeGroup,
  index,
  getContent,
  isComplete,
  onToggleComplete,
}: ContentPanelProps) {
  const { t } = useTranslation();

  const currentId = selectedId || activeGroup;
  const markdown = getContent(currentId) || t("content.notFound");
  const meta = selectedId ? index[selectedId] : null;
  const completed = isComplete ? isComplete(currentId) : false;

  return (
    <article className="content-panel" aria-label={t("aria.contentPanel")}>
      {meta && (
        <header className="content-meta">
          <div className="content-meta__left">
            {meta.tags && (
              <div className="content-tags">
                {meta.tags.map((tag) => (
                  <span key={tag} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {meta.subtitle && <p className="content-subtitle">{meta.subtitle}</p>}
          </div>
        </header>
      )}

      <div className="content-body">
        {onToggleComplete && (
          <button
            type="button"
            className={`read-toggle ${completed ? "read-toggle--done" : ""}`}
            onClick={() => onToggleComplete(currentId)}
            aria-label={completed ? t("progress.markUnread") : t("progress.markRead")}
            title={completed ? t("progress.markUnread") : t("progress.markRead")}
          >
            <Check size={16} />
          </button>
        )}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </article>
  );
}
