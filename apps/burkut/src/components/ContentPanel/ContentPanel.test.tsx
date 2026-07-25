import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ContentViewModel } from "../../adapters/viewModels.ts";
import ContentPanel from "./ContentPanel";

/**
 * SPEC: ContentPanel component
 * ---------------------------
 * ContentPanel is a pure view-model renderer: resolving `getContent`/meta
 * from a ContentIndex is the adapter's job (buildContentViewModel), covered
 * by contentAdapters.test.ts. This file only tests rendering the resolved
 * ContentViewModel.
 *
 * 1. Markdown content is rendered
 * 2. Meta info (title, tags) is displayed when present
 * 3. Fallback label shown when markdown is null
 * 4. Mark-as-read toggle renders and works
 * 5. Mark-as-read toggle shows done state when complete
 */

describe("ContentPanel", () => {
  it("renders content as markdown", () => {
    const content: ContentViewModel = {
      id: "xia",
      markdown: "## Test Heading\n\nTest content.",
    };
    render(<ContentPanel content={content} />);
    expect(screen.getByText("Test content.")).toBeInTheDocument();
  });

  it("shows meta subtitle and tags", () => {
    const content: ContentViewModel = {
      id: "xia",
      markdown: "Content.",
      subtitle: "2070–1600 BCE",
      tags: ["legendary", "pre-bronze-age"],
    };
    render(<ContentPanel content={content} />);
    expect(screen.getByText("2070–1600 BCE")).toBeInTheDocument();
    expect(screen.getByText("#legendary")).toBeInTheDocument();
  });

  it("shows fallback label when markdown is null", () => {
    const content: ContentViewModel = { id: "xia", markdown: null };
    render(<ContentPanel content={content} />);
    expect(screen.getByText(/Content not found/)).toBeInTheDocument();
  });

  it("shows a custom fallback label from config", () => {
    const content: ContentViewModel = { id: "xia", markdown: null };
    render(<ContentPanel content={content} config={{ labels: { notFound: "Nothing here." } }} />);
    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
  });

  it("renders mark-as-read toggle button when onToggleComplete is provided", () => {
    const content: ContentViewModel = { id: "xia", markdown: "Content." };
    const onToggle = vi.fn();
    render(<ContentPanel content={content} isComplete={() => false} onToggleComplete={onToggle} />);
    const btn = screen.getByLabelText("Mark as read");
    expect(btn).toBeInTheDocument();
    expect(btn.querySelector("svg")).toBeInTheDocument();
  });

  it("mark-as-read toggle calls onToggleComplete with content id", () => {
    const content: ContentViewModel = { id: "xia", markdown: "Content." };
    const onToggle = vi.fn();
    render(<ContentPanel content={content} isComplete={() => false} onToggleComplete={onToggle} />);
    fireEvent.click(screen.getByLabelText("Mark as read"));
    expect(onToggle).toHaveBeenCalledWith("xia");
  });

  it("toggle shows done state when item is complete", () => {
    const content: ContentViewModel = { id: "xia", markdown: "Content." };
    render(<ContentPanel content={content} isComplete={() => true} onToggleComplete={vi.fn()} />);
    const btn = screen.getByLabelText("Mark as unread");
    expect(btn).toHaveClass("read-toggle--done");
  });
});
