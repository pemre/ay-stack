import { afterEach, describe, expect, it, vi } from "vitest";
import { createStore } from "zustand/vanilla";
import { createPersistenceMiddleware } from "./createPersistenceMiddleware.ts";
import type { PersistenceAdapter } from "./types.ts";

interface TestState {
  value: number;
  setValue: (value: number) => void;
}

function makeStore(adapter: PersistenceAdapter<{ value: number }>, debounceMs = 20) {
  return createStore<TestState>()(
    createPersistenceMiddleware({
      adapter,
      currentVersion: 1,
      migrations: {},
      debounceMs,
      getPersistedSlice: (state: TestState) => ({ value: state.value }),
      mergeHydratedState: (set, hydrated) => set(hydrated),
    })((set) => ({
      value: 0,
      setValue: (value) => set({ value }),
    })),
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe("createPersistenceMiddleware", () => {
  it("debounces rapid changes into one save", async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockResolvedValue(undefined);
    const store = makeStore({ load: vi.fn().mockResolvedValue(null), save });
    await vi.runAllTicks();

    store.getState().setValue(1);
    store.getState().setValue(2);
    await vi.advanceTimersByTimeAsync(19);
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ value: 2 });
  });

  it("retries failed saves three times with backoff", async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockRejectedValue(new Error("offline"));
    const store = makeStore({ load: vi.fn().mockResolvedValue(null), save }, 10);
    await vi.runAllTicks();

    store.getState().setValue(1);
    await vi.advanceTimersByTimeAsync(10);
    expect(save).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2000);
    expect(save).toHaveBeenCalledTimes(3);
  });

  it("does not retry a not-found save", async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockRejectedValue({ status: 404 });
    const store = makeStore({ load: vi.fn().mockResolvedValue(null), save }, 10);
    await vi.runAllTicks();

    store.getState().setValue(1);
    await vi.advanceTimersByTimeAsync(10);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("loads and merges hydrated state on creation", async () => {
    const load = vi.fn().mockResolvedValue({ version: 1, value: 42 });
    const store = makeStore({ load, save: vi.fn() });
    await vi.waitFor(() => expect(store.getState().value).toBe(42));
    expect(load).toHaveBeenCalledTimes(1);
  });
});
