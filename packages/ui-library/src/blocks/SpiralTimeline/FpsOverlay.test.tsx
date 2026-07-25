import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FpsOverlay } from "./FpsOverlay.tsx";

afterEach(cleanup);

describe("FpsOverlay", () => {
  it("renders and displays an FPS value element", () => {
    render(<FpsOverlay />);
    const overlay = screen.getByTestId("fps-overlay");
    expect(overlay).toBeInTheDocument();
    expect(overlay.textContent).toContain("FPS");
  });

  it("cancels requestAnimationFrame on unmount", () => {
    const cancelSpy = vi.spyOn(globalThis, "cancelAnimationFrame");
    const { unmount } = render(<FpsOverlay />);
    unmount();
    expect(cancelSpy).toHaveBeenCalled();
    cancelSpy.mockRestore();
  });
});
