import type { StateCreator, StoreMutatorIdentifier } from "zustand";

export interface PersistenceAdapter<T> {
  load(): Promise<T | null>;
  save(state: T): Promise<void>;
}

export type MiddlewareStateCreator<S> = <
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<S, Mps, Mcs>,
) => StateCreator<S, Mps, Mcs>;

export type StoreSetState<S> = (
  partial: S | Partial<S> | ((state: S) => S | Partial<S>),
  replace?: boolean,
) => void;

export interface CreatePersistenceMiddlewareOptions<T, S = unknown> {
  adapter: PersistenceAdapter<T>;
  currentVersion: number;
  migrations: Record<number, (state: T) => T>;
  debounceMs?: number;
  getPersistedSlice: (state: S) => T;
  mergeHydratedState: (set: StoreSetState<S>, hydrated: T) => void;
}
