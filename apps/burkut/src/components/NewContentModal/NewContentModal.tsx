import { Button, Modal, ProgressPie } from "@ay/ui-library";
import { useTranslation } from "react-i18next";
import type { ContentIndex } from "../../shared/types.ts";
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
    <Modal isOpen onClose={onDismiss} title={t("progress.newContentTitle")}>
      <p className="new-content-modal__message">{t("progress.newContentMessage")}</p>

      <ul className="new-content-modal__list">
        {newContentIds.map((id) => {
          const entry = index[id];
          return (
            <li key={id} className="new-content-modal__list-item">
              {entry?.title || id}
            </li>
          );
        })}
      </ul>

      <div className="new-content-modal__progress">
        <ProgressPie percentage={percentage} size={48} label={t("progress.title")} />
      </div>

      <Button className="new-content-modal__dismiss" onClick={onDismiss} variant="text">
        {t("progress.dismiss")}
      </Button>
    </Modal>
  );
}
