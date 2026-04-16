import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ContentIndex } from "../../shared/types.ts";
import ContentPanel from "./ContentPanel";

/**
 * SPEC: ContentPanel component
 * ---------------------------
 * 1. getContent is called for selectedId
 * 2. Markdown content is rendered synchronously
 * 3. Meta info (title, tags) is displayed
 * 4. Fallback message shown when getContent returns null
 * 5. When selectedId is null, activeGroup header content is loaded
 * 6. Mark-as-read toggle renders and works
 * 7. Mark-as-read toggle shows done state when complete
 */

const mockIndex: ContentIndex = {
  xia: {
    id: "xia",
    group: "Dynasties and States",
    title: "Xia Dynasty",
    subtitle: "2070–1600 BCE",
    tags: ["legendary", "pre-bronze-age"],
    _path: "",
    _isHeader: false,
  },
  "Dynasties and States": {
    id: "Dynasties and States",
    group: "Dynasties and States",
    title: "Dynasties and States",
    _path: "",
    _isHeader: true,
  },
};

describe("ContentPanel", () => {
  it("renders content as markdown", () => {
    const getContent = vi.fn().mockReturnValue("## Test Heading\n\nTest content.");
    render(
      <ContentPanel
        selectedId="xia"
        activeGroup="Dynasties and States"
        index={mockIndex}
        getContent={getContent}
      />,
    );
    expect(screen.getByText("Test content.")).toBeInTheDocument();
  });

  it("shows meta title and tags", () => {
    const getContent = vi.fn().mockReturnValue("Content.");
    render(
      <ContentPanel
        selectedId="xia"
        activeGroup="Dynasties and States"
        index={mockIndex}
        getContent={getContent}
      />,
    );
    expect(screen.getByText("2070–1600 BCE")).toBeInTheDocument();
    expect(screen.getByText("#legendary")).toBeInTheDocument();
  });

  it("shows fallback when getContent returns null", () => {
    const getContent = vi.fn().mockReturnValue(null);
    render(
      <ContentPanel
        selectedId="xia"
        activeGroup="Dynasties and States"
        index={mockIndex}
        getContent={getContent}
      />,
    );
    expect(screen.getByText(/content\.notFound/)).toBeInTheDocument();
  });

  it("loads activeGroup header content when selectedId is null", () => {
    const getContent = vi.fn().mockReturnValue("# Dynasties and States\n\nGroup description.");
    render(
      <ContentPanel
        selectedId={null}
        activeGroup="Dynasties and States"
        index={mockIndex}
        getContent={getContent}
      />,
    );
    expect(getContent).toHaveBeenCalledWith("Dynasties and States");
    expect(screen.getByText("Group description.")).toBeInTheDocument();
  });

  it("renders mark-as-read toggle button when onToggleComplete is provided", () => {
    const getContent = vi.fn().mockReturnValue("Content.");
    const onToggle = vi.fn();
    render(
      <ContentPanel
        selectedId="xia"
        activeGroup="Dynasties and States"
        index={mockIndex}
        getContent={getContent}
        isComplete={() => false}
        onToggleComplete={onToggle}
      />,
    );
    expect(screen.getByLabelText("progress.markRead")).toBeInTheDocument();
    const btn = screen.getByLabelText("progress.markRead");
    expect(btn.querySelector("svg")).toBeInTheDocument();
  });

  it("mark-as-read toggle calls onToggleComplete with current id", () => {
    const getContent = vi.fn().mockReturnValue("Content.");
    const onToggle = vi.fn();
    render(
      <ContentPanel
        selectedId="xia"
        activeGroup="Dynasties and States"
        index={mockIndex}
        getContent={getContent}
        isComplete={() => false}
        onToggleComplete={onToggle}
      />,
    );
    expect(screen.getByLabelText("progress.markRead")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("progress.markRead"));
    expect(onToggle).toHaveBeenCalledWith("xia");
  });

  it("toggle shows done state when item is complete", () => {
    const getContent = vi.fn().mockReturnValue("Content.");
    render(
      <ContentPanel
        selectedId="xia"
        activeGroup="Dynasties and States"
        index={mockIndex}
        getContent={getContent}
        isComplete={() => true}
        onToggleComplete={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("progress.markUnread")).toBeInTheDocument();
    const btn = screen.getByLabelText("progress.markUnread");
    expect(btn).toHaveClass("read-toggle--done");
  });

  it("shows mark-as-read toggle for group header pages (no selectedId)", () => {
    const getContent = vi.fn().mockReturnValue("# Header\n\nContent.");
    render(
      <ContentPanel
        selectedId={null}
        activeGroup="Dynasties and States"
        index={mockIndex}
        getContent={getContent}
        isComplete={() => false}
        onToggleComplete={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("progress.markRead")).toBeInTheDocument();
  });
});
