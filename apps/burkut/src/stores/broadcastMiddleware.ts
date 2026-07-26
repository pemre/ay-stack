import { createBroadcastMiddleware } from "@ay/dashboard-engine";
import type { StateCreator, StoreMutatorIdentifier } from "zustand";
import type { Dashboard } from "../shared/types.ts";

const CHANNEL_NAME = "burkut-dashboard-sync";

interface StoreWithMerge {
  dashboards: Dashboard[];
  _mergeSharedState: (incoming: { dashboards: Dashboard[] }) => void;
}

type BroadcastMiddleware = <
  T extends StoreWithMerge,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
) => StateCreator<T, Mps, Mcs>;

const broadcastMiddlewareImpl = (f: StateCreator<StoreWithMerge>) =>
  createBroadcastMiddleware<Dashboard[], StoreWithMerge>(
    CHANNEL_NAME,
    (state) => state.dashboards,
    (set, dashboards) => set({ dashboards }),
  )(f) as unknown as StateCreator<StoreWithMerge>;

export const broadcastMiddleware = broadcastMiddlewareImpl as unknown as BroadcastMiddleware;
