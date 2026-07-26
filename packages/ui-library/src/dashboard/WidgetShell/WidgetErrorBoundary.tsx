import { Component, type ReactNode } from "react";

/**
 * Props for the WidgetErrorBoundary component.
 * This component wraps widget content and catches rendering errors.
 */
export interface WidgetErrorBoundaryProps {
  /** Callback invoked when an error is caught. */
  onError?: (error: Error) => void;
  /** Function to render the error state, receives the retry function. */
  renderError: (retry: () => void) => ReactNode;
  /** The content to render normally when there is no error. */
  children: ReactNode;
}

/**
 * State for the WidgetErrorBoundary component.
 */
interface State {
  hasError: boolean;
}

/**
 * WidgetErrorBoundary is a class component that catches errors in widget rendering.
 *
 * It satisfies Requirements 1.2, 1.3, and 1.7:
 * - Catches rendering errors via getDerivedStateFromError
 * - Calls an optional onError callback on error
 * - Provides a retry method to reset the error state
 * - Renders error UI or children depending on error state
 * - Each error boundary instance manages its own error state independently
 *
 * **Validates: Requirements 1.2, 1.3, 1.7**
 */
export class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, State> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Update state so the next render will show the fallback UI.
   * Called when an error is thrown during rendering.
   */
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  /**
   * Log error details and call the optional onError callback.
   * Called after an error has been thrown during rendering.
   */
  componentDidCatch(error: Error): void {
    this.props.onError?.(error);
  }

  /**
   * Reset the error state, causing the error boundary to re-attempt rendering.
   * This allows independent recovery without requiring other widgets to re-render.
   */
  private retry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.renderError(this.retry);
    }
    return this.props.children;
  }
}
