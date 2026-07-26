export interface ContentViewModel {
  id: string;
  /** Null when no content body was found for `id` -- the viewer renders its fallback label. */
  markdown: string | null;
  title?: string;
  subtitle?: string;
  tags?: string[];
}

export interface MarkdownViewerLabels {
  /** aria-label for the root article element (default: "Content panel"). */
  ariaLabel?: string;
  /** Rendered when the resolved content has no body (default: "*Content not found.*"). */
  notFound?: string;
  /** aria-label/title for the mark-as-read toggle when unread (default: "Mark as read"). */
  markRead?: string;
  /** aria-label/title for the mark-as-read toggle when read (default: "Mark as unread"). */
  markUnread?: string;
}

export const DEFAULT_MARKDOWN_VIEWER_LABELS: Required<MarkdownViewerLabels> = {
  ariaLabel: "Content panel",
  notFound: "*Content not found.*",
  markRead: "Mark as read",
  markUnread: "Mark as unread",
};

export interface MarkdownViewerConfig {
  labels?: MarkdownViewerLabels;
}

export interface MarkdownViewerProps {
  content: ContentViewModel;
  isComplete?: (id: string) => boolean;
  onToggleComplete?: (id: string) => void;
  config?: MarkdownViewerConfig;
}
