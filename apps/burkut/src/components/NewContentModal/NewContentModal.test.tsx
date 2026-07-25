import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ContentIndex } from "../../shared/types.ts";
import NewContentModal from "./NewContentModal";

/**
 * SPEC: NewContentModal component
 * --------------------------------
 * 1. Renders nothing when newContentIds is empty
 * 2. Shows modal with title when newContentIds has items
 * 3. Lists all new content items with their titles
 * 4. Falls back to id when title is not available
 * 5. Shows ProgressPie with correct percentage
 * 6. Dismiss button calls onDismiss callback
 * 7. Has dialog role and aria-modal
 */

const mockIndex: ContentIndex = {
  newMovie: { id: "newMovie", title: "New Movie Title", _path: "", _isHeader: false },
  newDynasty: { id: "newDynasty", title: "New Dynasty", _path: "", _isHeader: false },
};

describe("NewContentModal", () => {
  it("renders nothing when newContentIds is empty", () => {
    const { container } = render(
      <NewContentModal newContentIds={[]} index={mockIndex} percentage={80} onDismiss={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when newContentIds is null", () => {
    const { container } = render(
      <NewContentModal
        newContentIds={null}
        index={mockIndex}
        percentage={80}
        onDismiss={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows modal when newContentIds has items", () => {
    render(
      <NewContentModal
        newContentIds={["newMovie"]}
        index={mockIndex}
        percentage={75}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("progress.newContentTitle")).toBeInTheDocument();
  });

  it("lists new content items with their titles", () => {
    render(
      <NewContentModal
        newContentIds={["newMovie", "newDynasty"]}
        index={mockIndex}
        percentage={60}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText("New Movie Title")).toBeInTheDocument();
    expect(screen.getByText("New Dynasty")).toBeInTheDocument();
  });

  it("falls back to id when title is not available", () => {
    render(
      <NewContentModal
        newContentIds={["unknownId"]}
        index={mockIndex}
        percentage={50}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText("unknownId")).toBeInTheDocument();
  });

  it("shows ProgressPie with correct percentage", () => {
    render(
      <NewContentModal
        newContentIds={["newMovie"]}
        index={mockIndex}
        percentage={42}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("dismiss button calls onDismiss callback", () => {
    const onDismiss = vi.fn();
    render(
      <NewContentModal
        newContentIds={["newMovie"]}
        index={mockIndex}
        percentage={75}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(screen.getByText("progress.dismiss"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("has dialog role and aria-modal", () => {
    render(
      <NewContentModal
        newContentIds={["newMovie"]}
        index={mockIndex}
        percentage={75}
        onDismiss={vi.fn()}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });
});
