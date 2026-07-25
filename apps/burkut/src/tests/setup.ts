import "@testing-library/jest-dom";
import { vi } from "vitest";

// Polyfill ResizeObserver for jsdom test environment
globalThis.ResizeObserver = class ResizeObserver {
  _cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this._cb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// Global react-i18next mock — returns translation keys as-is
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "tr",
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
