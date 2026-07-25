import { type ReactNode, Suspense } from "react";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";
import "./WidgetShell.css";

/**
 * Labels for the WidgetShell component.
 * All text strings are passed in from the app, not fetched via useTranslation.
 */
export interface WidgetShellLabels {
  configAriaLabel?: string;
  duplicateAriaLabel?: string;
  removeAriaLabel?: string;
  closeAriaLabel?: string;
  retryLabel?: string;
  /** Shown in the error state; app supplies the message, shell supplies the layout. */
  errorFallbackMessage?: string;
}

/**
 * Props for the WidgetShell component.
 */
export interface WidgetShellProps {
  /** Title displayed in the widget header */
  title: string;
  /** Labels for buttons and error messages */
  labels?: WidgetShellLabels;
  /** Whether the widget is draggable (affects CSS class) */
  draggable: boolean;
  /** Callback when config button is clicked */
  onConfigClick?: () => void;
  /** Callback when duplicate button is clicked */
  onDuplicateClick?: () => void;
  /** Callback when remove button is clicked */
  onRemoveClick?: () => void;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /** Whether to show empty state instead of children */
  isEmpty?: boolean;
  /** Content to show when isEmpty is true */
  emptyState?: ReactNode;
  /** Main widget content */
  children: ReactNode;
  /** Loading state to show in Suspense boundary */
  loadingState?: ReactNode;
}

/**
 * Default labels for WidgetShell when not provided by app
 */
const DEFAULT_LABELS: WidgetShellLabels = {
  configAriaLabel: "Configure widget",
  duplicateAriaLabel: "Duplicate widget",
  removeAriaLabel: "Remove widget",
  closeAriaLabel: "Close widget",
  retryLabel: "Retry",
  errorFallbackMessage: "An error occurred. Please try again.",
};

/**
 * WidgetShell wraps a widget instance with header, error boundary, and loading/empty states.
 *
 * Satisfies Requirements 1.1, 1.4, 1.5, 1.6:
 * - Owns widget header with title and action buttons (1.1)
 * - Uses CSS class for react-grid-layout drag support (1.1)
 * - All text comes from labels prop, no useTranslation/useTheme (1.4)
 * - Wraps children in Suspense when loadingState supplied (1.5)
 * - Shows emptyState when isEmpty is true (1.6)
 * - Wraps children in WidgetErrorBoundary with default error UI (1.2, 1.3)
 *
 * **Validates: Requirements 1.1, 1.4, 1.5, 1.6**
 */
export function WidgetShell(props: WidgetShellProps): JSX.Element {
  const {
    title,
    labels: userLabels,
    draggable,
    onConfigClick,
    onDuplicateClick,
    onRemoveClick,
    onClose,
    isEmpty,
    emptyState,
    children,
    loadingState,
  } = props;

  // Merge user labels with defaults
  const labels = { ...DEFAULT_LABELS, ...userLabels };

  // Header CSS classes: always "widget-header" plus drag-handle if draggable
  const headerClassName = draggable ? "widget-header drag-handle" : "widget-header";

  // Error fallback UI
  const renderError = (retry: () => void) => (
    <div className="widget-error-state">
      <p>{labels.errorFallbackMessage}</p>
      <button type="button" onClick={retry} aria-label={labels.retryLabel}>
        {labels.retryLabel}
      </button>
    </div>
  );

  // Content to render: empty state or children
  const bodyContent = isEmpty ? emptyState : children;

  // Wrap in Suspense if loadingState is provided, otherwise just render directly
  const withSuspense = loadingState ? (
    <Suspense fallback={loadingState}>
      <WidgetErrorBoundary renderError={renderError}>{bodyContent}</WidgetErrorBoundary>
    </Suspense>
  ) : (
    <WidgetErrorBoundary renderError={renderError}>{bodyContent}</WidgetErrorBoundary>
  );

  return (
    <div className="widget-item">
      <header className={headerClassName}>
        <h3>{title}</h3>
        <div className="widget-actions">
          {onConfigClick && (
            <button
              type="button"
              onClick={onConfigClick}
              aria-label={labels.configAriaLabel}
              className="widget-action-config"
            >
              ⚙️
            </button>
          )}
          {onDuplicateClick && (
            <button
              type="button"
              onClick={onDuplicateClick}
              aria-label={labels.duplicateAriaLabel}
              className="widget-action-duplicate"
            >
              📋
            </button>
          )}
          {onRemoveClick && (
            <button
              type="button"
              onClick={onRemoveClick}
              aria-label={labels.removeAriaLabel}
              className="widget-action-remove"
            >
              🗑️
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={labels.closeAriaLabel}
              className="widget-action-close"
            >
              ✕
            </button>
          )}
        </div>
      </header>
      <div className="widget-item__body">{withSuspense}</div>
    </div>
  );
}
