import type { StateCreator } from "zustand";
import type { MiddlewareStateCreator, StoreSetState } from "./types.ts";

interface BroadcastMessage<T> {
  senderId: string;
  state: T;
}

function createSenderId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function createBroadcastMiddleware<T, S>(
  channelName: string,
  getSlice: (state: S) => T,
  mergeIncoming: (set: StoreSetState<S>, incoming: T) => void,
): MiddlewareStateCreator<S> {
  return (<S2>(f: StateCreator<S2>) =>
    (
      set: Parameters<StateCreator<S2>>[0],
      get: Parameters<StateCreator<S2>>[1],
      api: Parameters<StateCreator<S2>>[2],
    ) => {
      let channel: BroadcastChannel | null = null;
      const senderId = createSenderId();
      let previousSlice: T | undefined;

      try {
        if (typeof BroadcastChannel !== "undefined") {
          channel = new BroadcastChannel(channelName);
          channel.onmessage = (event: MessageEvent<BroadcastMessage<T>>) => {
            const message = event.data;
            if (!message || message.senderId === senderId) return;
            mergeIncoming(set as StoreSetState<S>, message.state);
          };
        }
      } catch {
        channel = null;
      }

      const wrappedSet = ((partial: Parameters<typeof set>[0], replace?: boolean) => {
        (set as (partial: unknown, replace?: boolean) => void)(partial, replace);
        if (!channel) return;

        const currentSlice = getSlice(get() as unknown as S);
        if (currentSlice === previousSlice) return;
        previousSlice = currentSlice;
        channel.postMessage({ senderId, state: currentSlice } satisfies BroadcastMessage<T>);
      }) as typeof set;

      const initialState = f(wrappedSet, get, api);
      previousSlice = getSlice(initialState as unknown as S);
      return initialState;
    }) as unknown as MiddlewareStateCreator<S>;
}
