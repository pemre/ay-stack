/**
 * Bug Condition Exploration Tests
 *
 * These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bugs exist. DO NOT fix the code to make them pass.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.5
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// ── Shared mocks (module-level, apply to all tests) ───────────────────────────

vi.mock("virtual:burkut-content", () => ({
  default: {
    nodes: {},
    days: [],
    undated: [],
    dateRange: null,
    stats: {
      totalFiles: 0,
      byType: { markdown: 0, image: 0, video: 0, audio: 0 },
      datedFiles: 0,
      undatedFiles: 0,
    },
  },
}));

// Mock useContentGraph to avoid virtual module resolution in dynamic App import
vi.mock("../../hooks/useContentGraph", () => ({
  useContentGraph: () => ({
    graph: {
      nodes: {},
      days: [],
      undated: [],
      dateRange: null,
      stats: {
        totalFiles: 0,
        byType: { markdown: 0, image: 0, video: 0, audio: 0 },
        datedFiles: 0,
        undatedFiles: 0,
      },
    },
    legacyIndex: {},
    getContent: () => null,
  }),
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => null,
  Marker: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Polygon: () => null,
  useMap: () => ({ flyTo: vi.fn(), invalidateSize: vi.fn() }),
}));

vi.mock("vis-timeline/standalone", () => ({
  Timeline: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    destroy: vi.fn(),
    setSelection: vi.fn(),
    focus: vi.fn(),
    getWindow: vi.fn(() => ({ start: 0, end: 1000 })),
    moveTo: vi.fn(),
    redraw: vi.fn(),
  })),
  DataSet: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    clear: vi.fn(),
    get: vi.fn(),
  })),
}));

vi.mock("react-grid-layout", () => ({
  Responsive: ({
    children,
    dragConfig,
    cols,
  }: {
    children: React.ReactNode;
    dragConfig?: { handle?: string; enabled?: boolean };
    cols?: Record<string, number>;
  }) => (
    <div
      data-testid="responsive-grid"
      data-drag-handle={dragConfig?.handle}
      data-drag-enabled={String(dragConfig?.enabled ?? true)}
      data-cols-lg={String(cols?.lg ?? "")}
    >
      {children}
    </div>
  ),
  useContainerWidth: () => ({ width: 1280, containerRef: { current: null }, mounted: true }),
  verticalCompactor: { type: "vertical", allowOverlap: false, compact: (l: unknown) => l },
}));

// Config mock used by App.tsx and WidgetGrid.tsx (resolved relative to each importer)
const mockConfig = {
  app: {
    name: "Bürküt",
    logo: "🦅",
    defaultLocale: "tr",
    supportedLocales: [{ code: "tr", label: "Türkçe" }],
  },
  features: {
    search: false,
    darkLightToggle: false,
    draggableLayout: true,
    progressTracker: false,
  },
};

// Mock config at the path used by App.tsx (../../config relative to WidgetGrid)
// and also at the path used by App.tsx itself (./config)
vi.mock("../../config", () => ({ default: mockConfig }));

// ── Test 1: Overflow CSS ──────────────────────────────────────────────────────

describe("Bug Condition Exploration — Test 1: Overflow CSS", () => {
  /**
   * Bug condition: input.type = CSSState AND input.selector = ".widget-item__body"
   *                AND input.property = "overflow" AND input.value = "hidden"
   *
   * Expected counterexample: overflow value is "hidden" not "auto"
   *
   * Validates: Requirements 2.1, 2.4
   */
  it("should have overflow: auto on .widget-item__body (currently hidden — BUG)", async () => {
    // Import the CSS file to register it in jsdom's stylesheet
    await import("./WidgetGrid.css");

    // Search all stylesheets for the .widget-item__body overflow rule
    const sheets = Array.from(document.styleSheets);
    let overflowValue: string | null = null;

    for (const sheet of sheets) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule && rule.selectorText === ".widget-item__body") {
          overflowValue = rule.style.overflow;
        }
      }
    }

    // This assertion WILL FAIL on unfixed code because overflow is "hidden"
    // Counterexample: overflowValue === "hidden"
    expect(overflowValue).toBe("auto");
  });
});

// ── Test 4: Text Selection CSS ────────────────────────────────────────────────

describe("Bug Condition Exploration — Test 4: Text Selection CSS", () => {
  /**
   * Bug condition: input.type = UserInteraction AND input.action IN ["drag","resize"]
   *                AND CSS rule for user-select: none is ABSENT
   *
   * Expected counterexample: user-select: none rule is absent from the stylesheet
   *
   * Validates: Requirement 2.5
   */
  it("should have user-select: none for drag/resize selectors (currently absent — BUG)", async () => {
    await import("./WidgetGrid.css");

    const sheets = Array.from(document.styleSheets);
    let foundDraggingRule = false;
    let foundResizingRule = false;

    const DRAGGING_SELECTOR = ".react-grid-item.react-draggable-dragging";
    const RESIZING_SELECTOR = ".react-grid-item.resizing";

    for (const sheet of sheets) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule) {
          const sel = rule.selectorText;
          const hasUserSelectNone =
            rule.style.userSelect === "none" ||
            rule.style.getPropertyValue("user-select") === "none";

          if (sel?.includes(DRAGGING_SELECTOR) && hasUserSelectNone) {
            foundDraggingRule = true;
          }
          if (sel?.includes(RESIZING_SELECTOR) && hasUserSelectNone) {
            foundResizingRule = true;
          }
        }
      }
    }

    // These assertions WILL FAIL on unfixed code because the rules are absent
    // Counterexample: both foundDraggingRule and foundResizingRule are false
    expect(foundDraggingRule).toBe(true);
    expect(foundResizingRule).toBe(true);
  });
});

// ── Tests 2 & 3: Duplicate Hook (App-level) ───────────────────────────────────
//
// These tests render the REAL App with the REAL useLayoutPersistence hook
// (not mocked) to expose the duplicate-instance bug.
// App.tsx calls useLayoutPersistence() → instance A (owns resetLayout, setWidgetVisible)
// WidgetGrid.tsx calls useLayoutPersistence() → instance B (owns layouts, visibilityState)
// They share localStorage but NOT React state — so changes to A don't re-render via B.

describe("Bug Condition Exploration — Test 2: Reset Layout", () => {
  /**
   * Bug condition: useLayoutPersistence called in BOTH App.tsx AND WidgetGrid.tsx
   *
   * Expected counterexample: grid does not re-render after resetLayout() is called
   * from App.tsx because WidgetGrid reads from its own separate hook instance.
   *
   * Validates: Requirement 2.2
   */
  it("clicking Reset button should immediately show all widgets (BUG: two hook instances)", async () => {
    const user = userEvent.setup();

    // Persist a non-default visibility state: sidebar hidden
    localStorage.setItem(
      "burkut-widget-visibility",
      JSON.stringify({ sidebar: false, content: true, map: true, timeline: true }),
    );

    // Import the REAL App — useLayoutPersistence is NOT mocked here
    // Both App.tsx and WidgetGrid.tsx will each call the real hook independently
    const { default: App } = await import("../../App");

    render(<App />);

    // Before reset: sidebar should be hidden (WidgetGrid's hook loaded persisted state)
    expect(screen.queryByText("panels.sidebar")).not.toBeInTheDocument();

    // Click Reset Layout — calls resetLayout() on App's hook instance (instance A)
    // Instance A resets its own state AND clears localStorage
    const resetBtn = screen.getByRole("button", { name: "layout.reset" });
    await user.click(resetBtn);

    // After reset: sidebar should be visible again
    // WILL FAIL on unfixed code: WidgetGrid's instance B still has sidebar: false
    // in its own useState — it was not notified of the reset
    expect(screen.getByText("panels.sidebar")).toBeInTheDocument();

    localStorage.removeItem("burkut-widget-visibility");
  });
});

describe("Bug Condition Exploration — Test 3: Widget Removal via Dashboard Store", () => {
  /**
   * Original bug condition: useLayoutPersistence called in BOTH App.tsx AND WidgetGrid.tsx
   *
   * This bug is now FIXED by the dashboard store architecture — App.tsx and WidgetGrid.tsx
   * share a single Zustand store instead of separate hook instances.
   *
   * This test verifies the fix: removing a widget instance via the store immediately
   * removes it from the DOM because both App and WidgetGrid read from the same store.
   *
   * Validates: Requirement 2.3
   */
  it("removing a widget instance via the store immediately removes it from the DOM (FIXED)", async () => {
    const { act } = await import("react");
    const { default: App } = await import("../../App");
    const { useDashboardStore } = await import("../../stores/dashboardStore.ts");

    render(<App />);

    // All widgets visible initially
    expect(screen.getByText("panels.sidebar")).toBeInTheDocument();

    // Get the active dashboard and find the sidebar instance
    const state = useDashboardStore.getState();
    const activeDash =
      state.dashboards.find((d) => d.id === state.activeDashboardId) ?? state.dashboards[0];
    const sidebarInstance = activeDash.instances.find((i) => i.widgetTypeId === "sidebar");

    // Remove the sidebar widget instance via the store (wrapped in act for re-render)
    await act(async () => {
      if (sidebarInstance) {
        state.removeWidgetInstance(activeDash.id, sidebarInstance.instanceId);
      }
    });

    // After removal: sidebar widget header should disappear from DOM
    // This now works because App and WidgetGrid share the same Zustand store
    const sidebarTitles = screen
      .queryAllByText("panels.sidebar")
      .filter((el) => el.classList.contains("widget-header__title"));
    expect(sidebarTitles).toHaveLength(0);
  });
});
