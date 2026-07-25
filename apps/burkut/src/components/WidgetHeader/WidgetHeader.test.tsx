import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WidgetHeader } from "./WidgetHeader";

// Mock config to control draggableLayout flag
vi.mock("../../config", () => ({
  default: {
    features: {
      draggableLayout: true,
    },
  },
}));

// react-i18next is globally mocked in src/tests/setup.ts (returns key as-is)

describe("WidgetHeader", () => {
  it("renders translated title text", () => {
    render(<WidgetHeader titleKey="sidebar.title" />);
    expect(screen.getByText("sidebar.title")).toBeInTheDocument();
  });

  it("has .widget-header CSS class", () => {
    const { container } = render(<WidgetHeader titleKey="sidebar.title" />);
    expect(container.firstChild).toHaveClass("widget-header");
  });

  it("shows grab cursor class when draggableLayout is true", () => {
    const { container } = render(<WidgetHeader titleKey="sidebar.title" />);
    expect(container.firstChild).toHaveClass("widget-header--draggable");
  });

  it("omits grab cursor class when draggableLayout is false", async () => {
    vi.resetModules();
    vi.doMock("../../config", () => ({
      default: { features: { draggableLayout: false } },
    }));
    const { WidgetHeader: WH } = await import("./WidgetHeader");
    const { container } = render(<WH titleKey="sidebar.title" />);
    expect(container.firstChild).not.toHaveClass("widget-header--draggable");
    vi.doUnmock("../../config");
  });

  it("renders close button when onClose provided and flag is true", () => {
    const onClose = vi.fn();
    render(<WidgetHeader titleKey="sidebar.title" onClose={onClose} />);
    const btn = screen.getByRole("button", { name: "widget.close" });
    expect(btn).toBeInTheDocument();
  });

  it("hides close button when onClose is not provided", () => {
    render(<WidgetHeader titleKey="sidebar.title" />);
    expect(screen.queryByRole("button", { name: "widget.close" })).not.toBeInTheDocument();
  });

  it("renders children (action buttons) when provided", () => {
    render(
      <WidgetHeader titleKey="sidebar.title">
        <button type="button">Group A</button>
      </WidgetHeader>,
    );
    expect(screen.getByRole("button", { name: "Group A" })).toBeInTheDocument();
  });
});
