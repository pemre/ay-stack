import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal.tsx";

describe("Modal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Dialog title">
        Content
      </Modal>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a labelled modal dialog when open", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Dialog title">
        Content
      </Modal>,
    );

    const dialog = screen.getByRole("dialog", { name: "Dialog title" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("focuses the first interactive child and restores focus on unmount", () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();

    const { unmount } = render(
      <Modal isOpen onClose={vi.fn()} title="Dialog title">
        <button type="button">Confirm</button>
      </Modal>,
    );

    expect(screen.getByRole("button", { name: "Confirm" })).toHaveFocus();

    unmount();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it("closes when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Dialog title">
        Content
      </Modal>,
    );

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on an overlay click but not a dialog click", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Dialog title">
        Content
      </Modal>,
    );

    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps keyboard focus within the dialog", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Dialog title">
        <button type="button">First</button>
        <button type="button">Last</button>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });

    last.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(first).toHaveFocus();

    first.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });
});
