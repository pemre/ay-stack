import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownViewer } from "./MarkdownViewer.tsx";
import type { ContentViewModel } from "./types.ts";

describe("MarkdownViewer", () => {
  it("renders content as markdown", () => {
    const content: ContentViewModel = {
      id: "xia",
      markdown: "## Test Heading\n\nTest content.",
    };
    render(<MarkdownViewer content={content} />);
    expect(screen.getByText("Test content.")).toBeInTheDocument();
  });

  it("shows meta subtitle and tags", () => {
    const content: ContentViewModel = {
      id: "xia",
      markdown: "Content.",
      subtitle: "2070–1600 BCE",
      tags: ["legendary", "pre-bronze-age"],
    };
    render(<MarkdownViewer content={content} />);
    expect(screen.getByText("2070–1600 BCE")).toBeInTheDocument();
    expect(screen.getByText("#legendary")).toBeInTheDocument();
  });

  it("shows the fallback label when markdown is null", () => {
    render(<MarkdownViewer content={{ id: "xia", markdown: null }} />);
    expect(screen.getByText(/Content not found/)).toBeInTheDocument();
  });

  it("supports custom labels", () => {
    render(
      <MarkdownViewer
        content={{ id: "xia", markdown: null }}
        config={{ labels: { notFound: "Nothing here." } }}
      />,
    );
    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
  });

  it("calls the completion callback with the content id", () => {
    const onToggleComplete = vi.fn();
    render(
      <MarkdownViewer
        content={{ id: "xia", markdown: "Content." }}
        isComplete={() => false}
        onToggleComplete={onToggleComplete}
      />,
    );
    fireEvent.click(screen.getByLabelText("Mark as read"));
    expect(onToggleComplete).toHaveBeenCalledWith("xia");
  });

  it("shows the done state when the item is complete", () => {
    render(
      <MarkdownViewer
        content={{ id: "xia", markdown: "Content." }}
        isComplete={() => true}
        onToggleComplete={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Mark as unread")).toHaveClass("read-toggle--done");
  });
});
