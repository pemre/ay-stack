import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useResizeObserver } from "./useResizeObserver";

/**
 * SPEC: useResizeObserver hook
 * ----------------------------
 * 1. Creates a ResizeObserver on the given ref element
 * 2. Calls the callback (debounced) when the element resizes
 * 3. Disconnects the observer on unmount
 * 4. Clears pending timers on unmount
 */

interface MockObserverInstance {
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  _cb: (entries: ResizeObserverEntry[]) => void;
}

let mockObserverInstances: MockObserverInstance[] = [];

beforeEach(() => {
  mockObserverInstances = [];
  const MockResizeObserver = vi.fn((cb: (entries: ResizeObserverEntry[]) => void) => {
    const instance: MockObserverInstance = {
      observe: vi.fn(),
      disconnect: vi.fn(),
      _cb: cb,
    };
    mockObserverInstances.push(instance);
    return instance;
  });
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useResizeObserver", () => {
  it("observes the ref element", () => {
    const el = document.createElement("div");
    const ref = { current: el };
    const callback = vi.fn();

    renderHook(() => useResizeObserver(ref, callback));

    expect(mockObserverInstances).toHaveLength(1);
    expect(mockObserverInstances[0].observe).toHaveBeenCalledWith(el);
  });

  it("calls callback after debounce delay", async () => {
    vi.useFakeTimers();
    const el = document.createElement("div");
    const ref = { current: el };
    const callback = vi.fn();

    renderHook(() => useResizeObserver(ref, callback, 50));

    const entry = { contentRect: { width: 100, height: 200 } } as ResizeObserverEntry;
    mockObserverInstances[0]._cb([entry]);

    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalledWith(entry);

    vi.useRealTimers();
  });

  it("disconnects observer on unmount", () => {
    const el = document.createElement("div");
    const ref = { current: el };
    const callback = vi.fn();

    const { unmount } = renderHook(() => useResizeObserver(ref, callback));
    unmount();

    expect(mockObserverInstances[0].disconnect).toHaveBeenCalled();
  });

  it("does nothing when ref.current is null", () => {
    const ref = { current: null };
    const callback = vi.fn();

    renderHook(() => useResizeObserver(ref, callback));

    expect(mockObserverInstances).toHaveLength(0);
  });
});
