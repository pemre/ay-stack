import { useTranslation } from "react-i18next";
import type { ContentIndex } from "../../shared/types.ts";
import ProgressPie from "../ProgressPie/ProgressPie";
import "./NewContentModal.css";

interface NewContentModalProps {
  newContentIds: string[] | null;
  index: ContentIndex;
  percentage: number;
  onDismiss: () => void;
}

/**
 * NewContentModal — overlay shown when new .md content is detected.
 *
 * Displays a list of newly added items and the updated progress percentage.
 */
export default function NewContentModal({
  newContentIds,
  index,
  percentage,
  onDismiss,
}: NewContentModalProps) {
  const { t } = useTranslation();

  if (!newContentIds || newContentIds.length === 0) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h2 className="modal-title">{t("progress.newContentTitle")}</h2>
        <p className="modal-message">{t("progress.newContentMessage")}</p>

        <ul className="modal-list">
          {newContentIds.map((id) => {
            const entry = index[id];
            return (
              <li key={id} className="modal-list-item">
                {entry?.title || id}
              </li>
            );
          })}
        </ul>

        <div className="modal-progress">
          <ProgressPie percentage={percentage} size={48} />
        </div>

        <button type="button" className="modal-dismiss-btn" onClick={onDismiss}>
          {t("progress.dismiss")}
        </button>
      </div>
    </div>
  );
}
