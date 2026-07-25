import type { StateCreator } from "zustand";
import { createMigrationRunner } from "./createMigrationRunner.ts";
import type {
  CreatePersistenceMiddlewareOptions,
  MiddlewareStateCreator,
  StoreSetState,
} from "./types.ts";

const RETRY_DELAYS = [1000, 2000, 4000] as const;

function isNotFoundError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  return "status" in error && (error as { status?: unknown }).status === 404;
}

function createDebouncedSave<T>(
  adapter: CreatePersistenceMiddlewareOptions<T>["adapter"],
  delayMs: number,
): (state: T) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const saveWithRetry = async (state: T, attempt = 0): Promise<void> => {
    try {
      await adapter.save(state);
    } catch (error) {
      if (isNotFoundError(error)) return;
      if (attempt >= RETRY_DELAYS.length - 1) {
        console.warn("Failed to persist state after retries:", error);
        return;
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, RETRY_DELAYS[attempt]);
      });
      await saveWithRetry(state, attempt + 1);
    }
  };

  return (state) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void saveWithRetry(state);
    }, delayMs);
  };
}

export function createPersistenceMiddleware<T, S>(
  options: CreatePersistenceMiddlewareOptions<T, S>,
): MiddlewareStateCreator<S> {
  return (<S2>(f: StateCreator<S2>) =>
    (
      set: Parameters<StateCreator<S2>>[0],
      get: Parameters<StateCreator<S2>>[1],
      api: Parameters<StateCreator<S2>>[2],
    ) => {
      let previousSlice: T | undefined;
      const saveDebounced = createDebouncedSave(options.adapter, options.debounceMs ?? 500);

      const wrappedSet = ((partial: Parameters<typeof set>[0], replace?: boolean) => {
        (set as (partial: unknown, replace?: boolean) => void)(partial, replace);
        const state = get() as unknown as S;
        const currentSlice = options.getPersistedSlice(state);
        if (currentSlice !== previousSlice) {
          previousSlice = currentSlice;
          saveDebounced(currentSlice);
        }
      }) as typeof set;

      const initialState = f(wrappedSet, get, api);
      previousSlice = options.getPersistedSlice(initialState as unknown as S);

      const runner = createMigrationRunner(options.currentVersion, options.migrations);
      queueMicrotask(async () => {
        let loaded: T | null = null;
        try {
          loaded = await options.adapter.load();
        } catch {
          loaded = null;
        }

        if (loaded === null) return;

        const fallback = options.getPersistedSlice(get() as unknown as S);
        const { state: hydrated } = runner(loaded, fallback);
        options.mergeHydratedState(set as StoreSetState<S>, hydrated);
        previousSlice = hydrated;
      });

      return initialState;
    }) as unknown as MiddlewareStateCreator<S>;
}
