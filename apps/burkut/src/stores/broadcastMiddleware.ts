import type { StateCreator, StoreMutatorIdentifier } from "zustand";
import type { Dashboard } from "../shared/types.ts";

const CHANNEL_NAME = "burkut-dashboard-sync";

interface BroadcastMessage {
  senderId: string;
  dashboards: Dashboard[];
}

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

const broadcastMiddlewareImpl: BroadcastMiddleware = (f) => (set, get, api) => {
  let channel: BroadcastChannel | null = null;
  const senderId = crypto.randomUUID();
  let prevDashboards: Dashboard[] | null = null;

  // Attempt to create BroadcastChannel — graceful fallback if unavailable
  try {
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(CHANNEL_NAME);

      channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
        const message = event.data;
        if (message.senderId === senderId) return;
        const state = get();
        state._mergeSharedState({ dashboards: message.dashboards });
      };
    }
  } catch {
    // BroadcastChannel unavailable — single-tab mode
    channel = null;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Zustand v5 set() overloads require cast for middleware wrapping
  const wrappedSet: typeof set = ((partial: any, replace: any) => {
    // biome-ignore lint/suspicious/noExplicitAny: forwarding args to original set
    (set as any)(partial, replace);

    if (!channel) return;

    const state = get();
    const currentDashboards = state.dashboards;

    // Only broadcast when the dashboards reference actually changed
    if (currentDashboards === prevDashboards) return;

    prevDashboards = currentDashboards;
    channel.postMessage({ senderId, dashboards: currentDashboards } satisfies BroadcastMessage);
  }) as typeof set;

  // Initialize prevDashboards after the inner creator runs
  const initialState = f(wrappedSet, get, api);
  prevDashboards = initialState.dashboards ?? null;

  return initialState;
};

export const broadcastMiddleware = broadcastMiddlewareImpl as BroadcastMiddleware;
