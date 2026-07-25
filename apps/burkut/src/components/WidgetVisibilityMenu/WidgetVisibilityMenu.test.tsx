import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WIDGET_REGISTRY } from "../WidgetGrid/widgetRegistry";
import { WidgetVisibilityMenu } from "./WidgetVisibilityMenu";

// react-i18next is globally mocked in src/tests/setup.ts — t(key) returns key as-is

function allVisible(): Record<string, boolean> {
  return Object.fromEntries(WIDGET_REGISTRY.map((w) => [w.id, true]));
}

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "widget.visibility.label" }));
}

describe("WidgetVisibilityMenu", () => {
  it("toggle button has btn and btn--text classes", () => {
    render(<WidgetVisibilityMenu visibilityState={allVisible()} setWidgetVisible={vi.fn()} />);
    const toggle = screen.getByRole("button", { name: "widget.visibility.label" });
    expect(toggle).toHaveClass("btn", "btn--text");
  });

  it("toggle button forwards aria-expanded when closed", () => {
    render(<WidgetVisibilityMenu visibilityState={allVisible()} setWidgetVisible={vi.fn()} />);
    const toggle = screen.getByRole("button", { name: "widget.visibility.label" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("toggle button forwards aria-expanded when open", () => {
    render(<WidgetVisibilityMenu visibilityState={allVisible()} setWidgetVisible={vi.fn()} />);
    openMenu();
    const toggle = screen.getByRole("button", { name: "widget.visibility.label" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("toggle button has title attribute", () => {
    render(<WidgetVisibilityMenu visibilityState={allVisible()} setWidgetVisible={vi.fn()} />);
    const toggle = screen.getByRole("button", { name: "widget.visibility.label" });
    expect(toggle).toHaveAttribute("title", "widget.visibility.label");
  });

  it("renders a checkbox for each widget in WIDGET_REGISTRY", () => {
    render(<WidgetVisibilityMenu visibilityState={allVisible()} setWidgetVisible={vi.fn()} />);
    openMenu();

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(WIDGET_REGISTRY.length);
  });

  it("checked state matches visibility state", () => {
    const visibilityState = Object.fromEntries(WIDGET_REGISTRY.map((w, i) => [w.id, i % 2 === 0]));
    render(<WidgetVisibilityMenu visibilityState={visibilityState} setWidgetVisible={vi.fn()} />);
    openMenu();

    WIDGET_REGISTRY.forEach((widget, i) => {
      const checkbox = screen.getByRole("checkbox", { name: widget.titleKey });
      if (i % 2 === 0) {
        expect(checkbox).toBeChecked();
      } else {
        expect(checkbox).not.toBeChecked();
      }
    });
  });

  it("toggling a checkbox calls setWidgetVisible with correct args", () => {
    const setWidgetVisible = vi.fn();
    render(
      <WidgetVisibilityMenu visibilityState={allVisible()} setWidgetVisible={setWidgetVisible} />,
    );
    openMenu();

    const firstWidget = WIDGET_REGISTRY[0];
    const checkbox = screen.getByRole("checkbox", { name: firstWidget.titleKey });
    fireEvent.click(checkbox);

    expect(setWidgetVisible).toHaveBeenCalledWith(firstWidget.id, false);
  });

  it("labels use i18n translation keys (titleKey returned as-is by mock)", () => {
    render(<WidgetVisibilityMenu visibilityState={allVisible()} setWidgetVisible={vi.fn()} />);
    openMenu();

    WIDGET_REGISTRY.forEach((widget) => {
      expect(screen.getByRole("checkbox", { name: widget.titleKey })).toBeInTheDocument();
    });
  });

  it("toggle button uses widget.visibility.label i18n key", () => {
    render(<WidgetVisibilityMenu visibilityState={allVisible()} setWidgetVisible={vi.fn()} />);
    expect(screen.getByRole("button", { name: "widget.visibility.label" })).toBeInTheDocument();
  });

  it("dropdown is not visible before toggle button is clicked", () => {
    render(<WidgetVisibilityMenu visibilityState={allVisible()} setWidgetVisible={vi.fn()} />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("dropdown closes when clicking outside", () => {
    render(
      <div>
        <div data-testid="outside">outside</div>
        <WidgetVisibilityMenu visibilityState={allVisible()} setWidgetVisible={vi.fn()} />
      </div>,
    );
    openMenu();
    expect(screen.getAllByRole("checkbox")).toHaveLength(WIDGET_REGISTRY.length);

    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
