import { afterEach, describe, expect, it, vi } from "vitest";
import { createStore } from "zustand/vanilla";
import { createBroadcastMiddleware } from "./createBroadcastMiddleware.ts";

interface TestState {
  value: number;
  setValue: (value: number) => void;
}

class FakeBroadcastChannel {
  static channels: FakeBroadcastChannel[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  readonly postMessage = vi.fn((message: unknown) => {
    for (const channel of FakeBroadcastChannel.channels) {
      if (channel !== this) channel.onmessage?.({ data: message } as MessageEvent);
    }
  });

  constructor(public readonly name: string) {
    FakeBroadcastChannel.channels.push(this);
  }

  close(): void {
    FakeBroadcastChannel.channels = FakeBroadcastChannel.channels.filter(
      (channel) => channel !== this,
    );
  }
}

function makeStore(channelName = "test-channel") {
  return createStore<TestState>()(
    createBroadcastMiddleware(
      channelName,
      (state: TestState) => state.value,
      (set, incoming) => set({ value: incoming }),
    )((set) => ({
      value: 0,
      setValue: (value) => set({ value }),
    })),
  );
}

afterEach(() => {
  FakeBroadcastChannel.channels = [];
  vi.unstubAllGlobals();
});

describe("createBroadcastMiddleware", () => {
  it("posts changed slices on the named channel", () => {
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
    const store = makeStore("named-channel");
    store.getState().setValue(3);

    const channel = FakeBroadcastChannel.channels[0];
    expect(channel.name).toBe("named-channel");
    expect(channel.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ state: 3, senderId: expect.any(String) }),
    );
  });

  it("merges messages from another sender and ignores its own sender", () => {
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
    const first = makeStore();
    const second = makeStore();
    const firstChannel = FakeBroadcastChannel.channels[0];
    const secondChannel = FakeBroadcastChannel.channels[1];

    second.getState().setValue(7);
    expect(first.getState().value).toBe(7);

    const ownMessage = secondChannel.postMessage.mock.calls[0]?.[0];
    secondChannel.onmessage?.({ data: ownMessage } as MessageEvent);
    expect(second.getState().value).toBe(7);
    expect(firstChannel.postMessage).not.toHaveBeenCalled();
  });

  it("gracefully no-ops when BroadcastChannel is unavailable", () => {
    const store = makeStore();
    expect(() => store.getState().setValue(5)).not.toThrow();
    expect(store.getState().value).toBe(5);
  });
});
