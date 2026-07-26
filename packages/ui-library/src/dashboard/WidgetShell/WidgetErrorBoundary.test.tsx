import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";

describe("WidgetErrorBoundary", () => {
  describe("unit tests", () => {
    it("renders children when there is no error", () => {
      render(
        <WidgetErrorBoundary renderError={() => <div>Error</div>}>
          <div>Widget content</div>
        </WidgetErrorBoundary>,
      );

      expect(screen.getByText("Widget content")).toBeInTheDocument();
      expect(screen.queryByText("Error")).not.toBeInTheDocument();
    });

    it("renders error UI when a child throws during render", () => {
      const ThrowingComponent = () => {
        throw new Error("Widget render failed");
      };

      render(
        <WidgetErrorBoundary renderError={() => <div>Error caught</div>}>
          <ThrowingComponent />
        </WidgetErrorBoundary>,
      );

      expect(screen.getByText("Error caught")).toBeInTheDocument();
    });

    it("calls onError callback when an error is caught", () => {
      const onError = vi.fn();
      const ThrowingComponent = () => {
        throw new Error("Test error");
      };

      render(
        <WidgetErrorBoundary onError={onError} renderError={() => <div>Error</div>}>
          <ThrowingComponent />
        </WidgetErrorBoundary>,
      );

      expect(onError).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it("calls onError with the actual error", () => {
      const onError = vi.fn();
      const testError = new Error("Widget crashed");
      const ThrowingComponent = () => {
        throw testError;
      };

      render(
        <WidgetErrorBoundary onError={onError} renderError={() => <div>Error</div>}>
          <ThrowingComponent />
        </WidgetErrorBoundary>,
      );

      expect(onError).toHaveBeenCalledWith(testError);
    });

    it("allows retry to reset error state", () => {
      const renderError = (retry: () => void) => (
        <button type="button" onClick={retry}>
          Retry
        </button>
      );

      const { rerender } = render(
        <WidgetErrorBoundary renderError={renderError}>
          <div>Widget content</div>
        </WidgetErrorBoundary>,
      );

      expect(screen.getByText("Widget content")).toBeInTheDocument();

      // Simulate error by re-rendering with a throwing component
      const ThrowingComponent = () => {
        throw new Error("Error");
      };

      rerender(
        <WidgetErrorBoundary renderError={renderError}>
          <ThrowingComponent />
        </WidgetErrorBoundary>,
      );

      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();

      // Click retry button
      const retryButton = screen.getByRole("button", { name: /retry/i });
      retryButton.click();

      // After retry, error should be cleared
      rerender(
        <WidgetErrorBoundary renderError={renderError}>
          <div>Widget recovered</div>
        </WidgetErrorBoundary>,
      );

      expect(screen.getByText("Widget recovered")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
    });

    it("handles multiple children without crashing", () => {
      render(
        <WidgetErrorBoundary renderError={() => <div>Error</div>}>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </WidgetErrorBoundary>,
      );

      expect(screen.getByText("Child 1")).toBeInTheDocument();
      expect(screen.getByText("Child 2")).toBeInTheDocument();
      expect(screen.getByText("Child 3")).toBeInTheDocument();
    });

    it("passes retry function to renderError", () => {
      let capturedRetry: (() => void) | null = null;
      const renderError = (retry: () => void) => {
        capturedRetry = retry;
        return <div>Error</div>;
      };

      const ThrowingComponent = () => {
        throw new Error("Error");
      };

      render(
        <WidgetErrorBoundary renderError={renderError}>
          <ThrowingComponent />
        </WidgetErrorBoundary>,
      );

      expect(capturedRetry).toBeDefined();
      expect(typeof capturedRetry).toBe("function");
    });

    it("is independently recoverable - errors in one boundary don't affect siblings", () => {
      const ErrorBoundary1 = () => (
        <WidgetErrorBoundary renderError={() => <div>Error in 1</div>}>
          <ThrowingWidget />
        </WidgetErrorBoundary>
      );

      const ErrorBoundary2 = () => (
        <WidgetErrorBoundary renderError={() => <div>Error in 2</div>}>
          <div>Widget 2 content</div>
        </WidgetErrorBoundary>
      );

      const ThrowingWidget = () => {
        throw new Error("Error");
      };

      render(
        <>
          <ErrorBoundary1 />
          <ErrorBoundary2 />
        </>,
      );

      expect(screen.getByText("Error in 1")).toBeInTheDocument();
      expect(screen.getByText("Widget 2 content")).toBeInTheDocument();
    });

    it("handles onError callback being undefined", () => {
      const ThrowingComponent = () => {
        throw new Error("Test error");
      };

      expect(() => {
        render(
          <WidgetErrorBoundary renderError={() => <div>Error</div>}>
            <ThrowingComponent />
          </WidgetErrorBoundary>,
        );
      }).not.toThrow();

      expect(screen.getByText("Error")).toBeInTheDocument();
    });

    it("maintains error state until retry is called", () => {
      const renderError = (retry: () => void) => (
        <div>
          Error occurred
          <button type="button" onClick={retry}>
            Retry
          </button>
        </div>
      );

      const ThrowingComponent = () => {
        throw new Error("Error");
      };

      const { rerender } = render(
        <WidgetErrorBoundary renderError={renderError}>
          <ThrowingComponent />
        </WidgetErrorBoundary>,
      );

      // Error should persist in the first render
      expect(screen.getByText("Error occurred")).toBeInTheDocument();

      // Even if we rerender with the same throwing component, error persists
      rerender(
        <WidgetErrorBoundary renderError={renderError}>
          <ThrowingComponent />
        </WidgetErrorBoundary>,
      );

      expect(screen.getByText("Error occurred")).toBeInTheDocument();
    });
  });
});
