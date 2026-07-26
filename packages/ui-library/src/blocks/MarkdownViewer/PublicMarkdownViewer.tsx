import { lazy, Suspense } from "react";
import type { MarkdownViewerProps } from "./types.ts";

const MarkdownViewerClient = lazy(() => import("./MarkdownViewerClient.tsx"));

export function PublicMarkdownViewer(props: MarkdownViewerProps) {
  return (
    <Suspense
      fallback={<article className="content-panel" aria-label={props.config?.labels?.ariaLabel} />}
    >
      <MarkdownViewerClient {...props} />
    </Suspense>
  );
}
