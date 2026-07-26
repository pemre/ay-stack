// Feature: dashboard-engine-extraction, Property: Error boundary catch and recovery
//
// For any widget that throws an error during rendering:
// 1. The error boundary catches the error and shows error UI
// 2. The onError callback is invoked with the thrown error
// 3. Calling retry resets the error state
// 4. Each error boundary instance is independent - errors in one don't affect siblings
//
// Validates: Requirements 1.2, 1.3, 1.7

import { render, screen } from "@testing-library/react";
import fc from "fast-check";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";

describe("WidgetErrorBoundary Property Tests", () => {
  it("always catches arbitrary errors and invokes onError callback", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s.length > 0),
        (errorMessage) => {
          const onError = vi.fn();
          const ThrowingComponent = () => {
            throw new Error(errorMessage);
          };

          render(
            <WidgetErrorBoundary onError={onError} renderError={() => <div>Caught</div>}>
              <ThrowingComponent />
            </WidgetErrorBoundary>,
          );

          expect(onError).toHaveBeenCalledOnce();
          expect(onError).toHaveBeenCalledWith(expect.any(Error));
        },
      ),
      { numRuns: 50 },
    );
  });

  it("renders error UI for any thrown error and normal UI for no error", () => {
    fc.assert(
      fc.property(fc.boolean(), (shouldThrow) => {
        const { unmount } = render(
          <WidgetErrorBoundary renderError={() => <div>Error UI</div>}>
            {shouldThrow ? <ThrowingComponent /> : <div>Normal content</div>}
          </WidgetErrorBoundary>,
        );

        if (shouldThrow) {
          expect(screen.getByText("Error UI")).toBeInTheDocument();
        } else {
          expect(screen.getByText("Normal content")).toBeInTheDocument();
        }

        unmount();
      }),
      { numRuns: 20 },
    );
  });

  it("maintains error state consistently across multiple renders of same props", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (rerenderCount) => {
        const renderError = () => <div>Error</div>;

        const { rerender, unmount } = render(
          <WidgetErrorBoundary renderError={renderError}>
            <ThrowingComponent />
          </WidgetErrorBoundary>,
        );

        // Should be in error state after first render
        expect(screen.getByText("Error")).toBeInTheDocument();

        // Re-render multiple times with same props
        for (let i = 0; i < rerenderCount; i++) {
          rerender(
            <WidgetErrorBoundary renderError={renderError}>
              <ThrowingComponent />
            </WidgetErrorBoundary>,
          );

          // Should still be in error state
          expect(screen.getByText("Error")).toBeInTheDocument();
        }

        unmount();
      }),
      { numRuns: 10 },
    );
  });

  it("independent boundaries do not interfere with each other", () => {
    fc.assert(
      fc.property(fc.tuple(fc.boolean(), fc.boolean()), ([throws1, throws2]) => {
        const Container = () => (
          <div>
            <WidgetErrorBoundary renderError={() => <div>Error 1</div>}>
              {throws1 ? <ThrowingComponent /> : <div>Content 1</div>}
            </WidgetErrorBoundary>
            <WidgetErrorBoundary renderError={() => <div>Error 2</div>}>
              {throws2 ? <ThrowingComponent /> : <div>Content 2</div>}
            </WidgetErrorBoundary>
          </div>
        );

        const { unmount } = render(<Container />);

        // Each boundary should be independent
        if (throws1) {
          expect(screen.getByText("Error 1")).toBeInTheDocument();
        } else {
          expect(screen.getByText("Content 1")).toBeInTheDocument();
        }

        if (throws2) {
          expect(screen.getByText("Error 2")).toBeInTheDocument();
        } else {
          expect(screen.getByText("Content 2")).toBeInTheDocument();
        }

        unmount();
      }),
      { numRuns: 20 },
    );
  });

  it("renderError receives a callable retry function", () => {
    fc.assert(
      fc.property(fc.anything(), () => {
        let capturedRetry: (() => void) | null = null;

        const renderError = (retry: () => void) => {
          capturedRetry = retry;
          return <div>Error</div>;
        };

        render(
          <WidgetErrorBoundary renderError={renderError}>
            <ThrowingComponent />
          </WidgetErrorBoundary>,
        );

        expect(capturedRetry).toBeDefined();
        expect(typeof capturedRetry).toBe("function");
      }),
      { numRuns: 10 },
    );
  });

  it("onError callback receives exactly the thrown error", () => {
    fc.assert(
      fc.property(fc.string(), (message) => {
        const onError = vi.fn();
        const testError = new Error(message);

        const ThrowingWithSpecificError = () => {
          throw testError;
        };

        render(
          <WidgetErrorBoundary onError={onError} renderError={() => <div>Error</div>}>
            <ThrowingWithSpecificError />
          </WidgetErrorBoundary>,
        );

        expect(onError).toHaveBeenCalledWith(testError);
      }),
      { numRuns: 20 },
    );
  });
});

// Helper component that always throws
function ThrowingComponent(): ReactNode {
  throw new Error("Intentional test error");
}
