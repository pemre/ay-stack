import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WidgetShell } from "./WidgetShell";

describe("WidgetShell", () => {
  describe("unit tests", () => {
    it("renders the widget title in the header", () => {
      render(
        <WidgetShell title="My Widget" draggable={false}>
          <div>Widget content</div>
        </WidgetShell>,
      );

      expect(screen.getByRole("heading", { level: 3, name: "My Widget" })).toBeInTheDocument();
    });

    it("renders widget content in the body", () => {
      render(
        <WidgetShell title="Test Widget" draggable={false}>
          <div>Widget body content</div>
        </WidgetShell>,
      );

      expect(screen.getByText("Widget body content")).toBeInTheDocument();
    });

    it("renders with widget-item and widget-header classes", () => {
      const { container } = render(
        <WidgetShell title="Test" draggable={false}>
          <div>Content</div>
        </WidgetShell>,
      );

      const rootDiv = container.querySelector(".widget-item");
      expect(rootDiv).toBeInTheDocument();

      const header = container.querySelector(".widget-header");
      expect(header).toBeInTheDocument();
    });

    it("renders widget-item__body for content wrapper", () => {
      const { container } = render(
        <WidgetShell title="Test" draggable={false}>
          <div>Content</div>
        </WidgetShell>,
      );

      const body = container.querySelector(".widget-item__body");
      expect(body).toBeInTheDocument();
      expect(body).toHaveTextContent("Content");
    });

    it("adds drag-handle class when draggable is true", () => {
      const { container } = render(
        <WidgetShell title="Test" draggable={true}>
          <div>Content</div>
        </WidgetShell>,
      );

      const header = container.querySelector(".widget-header");
      expect(header).toHaveClass("drag-handle");
    });

    it("does not add drag-handle class when draggable is false", () => {
      const { container } = render(
        <WidgetShell title="Test" draggable={false}>
          <div>Content</div>
        </WidgetShell>,
      );

      const header = container.querySelector(".widget-header");
      expect(header).not.toHaveClass("drag-handle");
    });

    it("renders config button when onConfigClick is provided", () => {
      render(
        <WidgetShell title="Test" draggable={false} onConfigClick={() => {}}>
          <div>Content</div>
        </WidgetShell>,
      );

      const button = screen.getByRole("button", { name: "Configure widget" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("widget-action-config");
    });

    it("does not render config button when onConfigClick is not provided", () => {
      render(
        <WidgetShell title="Test" draggable={false}>
          <div>Content</div>
        </WidgetShell>,
      );

      expect(screen.queryByRole("button", { name: "Configure widget" })).not.toBeInTheDocument();
    });

    it("calls onConfigClick when config button is clicked", () => {
      const onConfigClick = vi.fn();

      render(
        <WidgetShell title="Test" draggable={false} onConfigClick={onConfigClick}>
          <div>Content</div>
        </WidgetShell>,
      );

      const button = screen.getByRole("button", { name: "Configure widget" });
      fireEvent.click(button);

      expect(onConfigClick).toHaveBeenCalledOnce();
    });

    it("renders duplicate button when onDuplicateClick is provided", () => {
      render(
        <WidgetShell title="Test" draggable={false} onDuplicateClick={() => {}}>
          <div>Content</div>
        </WidgetShell>,
      );

      expect(screen.getByRole("button", { name: "Duplicate widget" })).toBeInTheDocument();
    });

    it("does not render duplicate button when onDuplicateClick is not provided", () => {
      render(
        <WidgetShell title="Test" draggable={false}>
          <div>Content</div>
        </WidgetShell>,
      );

      expect(screen.queryByRole("button", { name: "Duplicate widget" })).not.toBeInTheDocument();
    });

    it("calls onDuplicateClick when duplicate button is clicked", () => {
      const onDuplicateClick = vi.fn();

      render(
        <WidgetShell title="Test" draggable={false} onDuplicateClick={onDuplicateClick}>
          <div>Content</div>
        </WidgetShell>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Duplicate widget" }));
      expect(onDuplicateClick).toHaveBeenCalledOnce();
    });

    it("renders remove button when onRemoveClick is provided", () => {
      render(
        <WidgetShell title="Test" draggable={false} onRemoveClick={() => {}}>
          <div>Content</div>
        </WidgetShell>,
      );

      expect(screen.getByRole("button", { name: "Remove widget" })).toBeInTheDocument();
    });

    it("does not render remove button when onRemoveClick is not provided", () => {
      render(
        <WidgetShell title="Test" draggable={false}>
          <div>Content</div>
        </WidgetShell>,
      );

      expect(screen.queryByRole("button", { name: "Remove widget" })).not.toBeInTheDocument();
    });

    it("calls onRemoveClick when remove button is clicked", () => {
      const onRemoveClick = vi.fn();

      render(
        <WidgetShell title="Test" draggable={false} onRemoveClick={onRemoveClick}>
          <div>Content</div>
        </WidgetShell>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Remove widget" }));
      expect(onRemoveClick).toHaveBeenCalledOnce();
    });

    it("renders close button when onClose is provided", () => {
      render(
        <WidgetShell title="Test" draggable={false} onClose={() => {}}>
          <div>Content</div>
        </WidgetShell>,
      );

      expect(screen.getByRole("button", { name: "Close widget" })).toBeInTheDocument();
    });

    it("does not render close button when onClose is not provided", () => {
      render(
        <WidgetShell title="Test" draggable={false}>
          <div>Content</div>
        </WidgetShell>,
      );

      expect(screen.queryByRole("button", { name: "Close widget" })).not.toBeInTheDocument();
    });

    it("calls onClose when close button is clicked", () => {
      const onClose = vi.fn();

      render(
        <WidgetShell title="Test" draggable={false} onClose={onClose}>
          <div>Content</div>
        </WidgetShell>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Close widget" }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("uses custom aria labels from labels prop", () => {
      render(
        <WidgetShell
          title="Test"
          draggable={false}
          onConfigClick={() => {}}
          onDuplicateClick={() => {}}
          onRemoveClick={() => {}}
          onClose={() => {}}
          labels={{
            configAriaLabel: "Custom config label",
            duplicateAriaLabel: "Custom duplicate label",
            removeAriaLabel: "Custom remove label",
            closeAriaLabel: "Custom close label",
          }}
        >
          <div>Content</div>
        </WidgetShell>,
      );

      expect(screen.getByRole("button", { name: "Custom config label" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Custom duplicate label" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Custom remove label" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Custom close label" })).toBeInTheDocument();
    });

    it("shows empty state when isEmpty is true", () => {
      render(
        <WidgetShell title="Test" draggable={false} isEmpty={true} emptyState={<div>Empty</div>}>
          <div>Content should not appear</div>
        </WidgetShell>,
      );

      expect(screen.getByText("Empty")).toBeInTheDocument();
      expect(screen.queryByText("Content should not appear")).not.toBeInTheDocument();
    });

    it("shows children when isEmpty is false", () => {
      render(
        <WidgetShell title="Test" draggable={false} isEmpty={false} emptyState={<div>Empty</div>}>
          <div>Widget content</div>
        </WidgetShell>,
      );

      expect(screen.getByText("Widget content")).toBeInTheDocument();
      expect(screen.queryByText("Empty")).not.toBeInTheDocument();
    });

    it("shows children by default when isEmpty is not specified", () => {
      render(
        <WidgetShell title="Test" draggable={false}>
          <div>Widget content</div>
        </WidgetShell>,
      );

      expect(screen.getByText("Widget content")).toBeInTheDocument();
    });

    it("renders error state when child throws", () => {
      const ThrowingComponent = () => {
        throw new Error("Widget render failed");
      };

      render(
        <WidgetShell title="Test" draggable={false}>
          <ThrowingComponent />
        </WidgetShell>,
      );

      expect(screen.getByText("An error occurred. Please try again.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });

    it("uses custom error message from labels prop", () => {
      const ThrowingComponent = () => {
        throw new Error("Widget render failed");
      };

      render(
        <WidgetShell
          title="Test"
          draggable={false}
          labels={{ errorFallbackMessage: "Custom error message" }}
        >
          <ThrowingComponent />
        </WidgetShell>,
      );

      expect(screen.getByText("Custom error message")).toBeInTheDocument();
    });

    it("uses custom retry label from labels prop", () => {
      const ThrowingComponent = () => {
        throw new Error("Widget render failed");
      };

      render(
        <WidgetShell title="Test" draggable={false} labels={{ retryLabel: "Try Again" }}>
          <ThrowingComponent />
        </WidgetShell>,
      );

      expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
    });

    it("renders all action buttons when all callbacks are provided", () => {
      render(
        <WidgetShell
          title="Test"
          draggable={false}
          onConfigClick={() => {}}
          onDuplicateClick={() => {}}
          onRemoveClick={() => {}}
          onClose={() => {}}
        >
          <div>Content</div>
        </WidgetShell>,
      );

      expect(screen.getByRole("button", { name: "Configure widget" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Duplicate widget" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Remove widget" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Close widget" })).toBeInTheDocument();
    });

    it("renders no action buttons when no callbacks are provided", () => {
      const { container } = render(
        <WidgetShell title="Test" draggable={false}>
          <div>Content</div>
        </WidgetShell>,
      );

      const actionsDiv = container.querySelector(".widget-actions");
      expect(actionsDiv).toBeEmptyDOMElement();
    });

    it("action buttons have correct CSS classes for testing", () => {
      const { container } = render(
        <WidgetShell
          title="Test"
          draggable={false}
          onConfigClick={() => {}}
          onDuplicateClick={() => {}}
          onRemoveClick={() => {}}
          onClose={() => {}}
        >
          <div>Content</div>
        </WidgetShell>,
      );

      expect(container.querySelector(".widget-action-config")).toBeInTheDocument();
      expect(container.querySelector(".widget-action-duplicate")).toBeInTheDocument();
      expect(container.querySelector(".widget-action-remove")).toBeInTheDocument();
      expect(container.querySelector(".widget-action-close")).toBeInTheDocument();
    });

    it("handles multiple action button clicks in sequence", () => {
      const onConfig = vi.fn();
      const onDuplicate = vi.fn();
      const onRemove = vi.fn();
      const onClose = vi.fn();

      render(
        <WidgetShell
          title="Test"
          draggable={false}
          onConfigClick={onConfig}
          onDuplicateClick={onDuplicate}
          onRemoveClick={onRemove}
          onClose={onClose}
        >
          <div>Content</div>
        </WidgetShell>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Configure widget" }));
      fireEvent.click(screen.getByRole("button", { name: "Duplicate widget" }));
      fireEvent.click(screen.getByRole("button", { name: "Remove widget" }));
      fireEvent.click(screen.getByRole("button", { name: "Close widget" }));

      expect(onConfig).toHaveBeenCalledOnce();
      expect(onDuplicate).toHaveBeenCalledOnce();
      expect(onRemove).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("merges provided labels with defaults", () => {
      render(
        <WidgetShell
          title="Test"
          draggable={false}
          onConfigClick={() => {}}
          labels={{ configAriaLabel: "Custom" }}
        >
          <div>Content</div>
        </WidgetShell>,
      );

      // Custom label for config
      expect(screen.getByRole("button", { name: "Custom" })).toBeInTheDocument();
    });

    it("renders correct structure with all features enabled", () => {
      const { container } = render(
        <WidgetShell
          title="Complete Widget"
          draggable={true}
          isEmpty={false}
          emptyState={<div>Empty</div>}
          onConfigClick={() => {}}
          onDuplicateClick={() => {}}
          onRemoveClick={() => {}}
          onClose={() => {}}
          labels={{
            configAriaLabel: "Config",
            duplicateAriaLabel: "Duplicate",
            removeAriaLabel: "Remove",
            closeAriaLabel: "Close",
            retryLabel: "Retry",
            errorFallbackMessage: "Error message",
          }}
          loadingState={<div>Loading</div>}
        >
          <div>Widget Body</div>
        </WidgetShell>,
      );

      // Check structure
      const root = container.querySelector(".widget-item");
      expect(root).toBeInTheDocument();

      const header = container.querySelector(".widget-header.drag-handle");
      expect(header).toBeInTheDocument();

      const body = container.querySelector(".widget-item__body");
      expect(body).toBeInTheDocument();

      // Check title
      expect(
        screen.getByRole("heading", { level: 3, name: "Complete Widget" }),
      ).toBeInTheDocument();

      // Check buttons
      expect(screen.getByRole("button", { name: "Config" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Duplicate" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();

      // Check content
      expect(screen.getByText("Widget Body")).toBeInTheDocument();
    });

    it("sibling WidgetShells are independent - one throwing doesn't affect non-throwing", () => {
      let renderCount2 = 0;

      const Widget1 = () => {
        throw new Error("Widget 1 failed");
      };

      const Widget2 = () => {
        renderCount2++;
        return <div>Widget 2 content</div>;
      };

      render(
        <>
          <WidgetShell title="Widget 1" draggable={false}>
            <Widget1 />
          </WidgetShell>
          <WidgetShell title="Widget 2" draggable={false}>
            <Widget2 />
          </WidgetShell>
        </>,
      );

      // Widget 1 throws, Widget 2 renders normally
      expect(screen.getByText("An error occurred. Please try again.")).toBeInTheDocument();
      expect(screen.getByText("Widget 2 content")).toBeInTheDocument();

      // Widget 2's render count should remain the same (not increased by Widget 1's error)
      // In strict mode, we expect exactly 2 renders (double-render for debugging), not more
      expect(renderCount2).toBe(2);
    });
  });
});
