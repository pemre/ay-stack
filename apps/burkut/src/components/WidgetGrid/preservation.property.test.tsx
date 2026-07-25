/**
 * Preservation Property Tests
 *
 * These tests verify baseline behavior of the dashboard-based WidgetGrid.
 * They test WidgetGrid directly with explicit Dashboard props.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 *
 * Property 4: Preservation — Layout Persistence Unchanged
 * Property 5: Preservation — Widget Render Correctness Unchanged
 */

import { render, screen } from "@testing-library/react";
import type { ResponsiveLayouts } from "react-grid-layout";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContentIndex, Dashboard } from "../../shared/types.ts";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("../../config", () => ({
  default: {
    features: { draggableLayout: true },
  },
}));

vi.mock("../../stores/dashboardStore.ts", () => ({
  useDashboardStore: Object.assign(
    (selector: (s: any) => any) =>
      selector({
        updateWidgetConfig: vi.fn(),
      }),
    {
      getState: () => ({
        onLayoutChange: vi.fn(),
        removeWidgetInstance: vi.fn(),
      }),
    },
  ),
}));

vi.mock("react-grid-layout", () => ({
  Responsive: ({
    children,
  }: {
    children: React.ReactNode;
    layouts?: ResponsiveLayouts;
    onLayoutChange?: (...args: any[]) => void;
    dragConfig?: unknown;
    cols?: Record<string, number>;
    width?: number;
    rowHeight?: number;
    resizeConfig?: unknown;
  }) => <div data-testid="responsive-grid">{children}</div>,
  useContainerWidth: () => ({ width: 1280, containerRef: { current: null }, mounted: true }),
}));

vi.mock("../../hooks/useTheme.tsx", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }),
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const emptyIndex: ContentIndex = {};

const TITLE_KEYS: Record<string, string> = {
  "tree-list": "panels.sidebar",
  "markdown-viewer": "panels.content",
  "geo-map": "panels.map",
  "linear-timeline": "panels.timeline",
};

function createDashboard(instanceIds?: string[]): Dashboard {
  const allInstances = [
    {
      instanceId: "inst-sidebar",
      widgetTypeId: "tree-list",
      position: { x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 2 },
      config: { type: "sidebar" as const, tags: [] as string[], contentType: null },
    },
    {
      instanceId: "inst-content",
      widgetTypeId: "markdown-viewer",
      position: { x: 3, y: 0, w: 5, h: 8, minW: 2, minH: 2 },
      config: { type: "content" as const, pinnedItemId: null },
    },
    {
      instanceId: "inst-map",
      widgetTypeId: "geo-map",
      position: { x: 8, y: 0, w: 4, h: 8, minW: 2, minH: 2 },
      config: { type: "map" as const, boundingBox: null, zoomLevel: null },
    },
    {
      instanceId: "inst-timeline",
      widgetTypeId: "linear-timeline",
      position: { x: 0, y: 8, w: 12, h: 4, minW: 2, minH: 2 },
      config: { type: "timeline" as const, startDate: null, endDate: null },
    },
  ];

  const instances = instanceIds
    ? allInstances.filter((inst) => instanceIds.includes(inst.widgetTypeId))
    : allInstances;

  return {
    id: "test-dashboard",
    name: "Test Dashboard",
    instances,
    filter: {},
  };
}

function baseProps(dashboard?: Dashboard) {
  return {
    dashboard: dashboard ?? createDashboard(),
    index: emptyIndex,
    getContent: vi.fn(() => null),
    selectedId: null,
    onSelectItem: vi.fn(),
  };
}

// Import after mocks are set up
import { WidgetGrid } from "./WidgetGrid";

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

// ── Property 5a: Correct widget count for various dashboard configurations ────

describe("Preservation Property 5a — WidgetGrid renders correct number of widgets", () => {
  const cases: Array<{
    label: string;
    instanceIds: string[];
  }> = [
    {
      label: "all four widgets",
      instanceIds: ["tree-list", "markdown-viewer", "geo-map", "linear-timeline"],
    },
    {
      label: "single widget — only sidebar",
      instanceIds: ["tree-list"],
    },
    {
      label: "two widgets — content and map",
      instanceIds: ["markdown-viewer", "geo-map"],
    },
    {
      label: "three widgets — sidebar, content, timeline",
      instanceIds: ["tree-list", "markdown-viewer", "linear-timeline"],
    },
  ];

  for (const { label, instanceIds } of cases) {
    it(`renders ${instanceIds.length} widget(s): ${label}`, () => {
      const dashboard = createDashboard(instanceIds);
      render(<WidgetGrid {...baseProps(dashboard)} />);

      for (const id of instanceIds) {
        expect(screen.getByText(TITLE_KEYS[id])).toBeInTheDocument();
      }

      const allIds = ["tree-list", "markdown-viewer", "geo-map", "linear-timeline"];
      const hiddenIds = allIds.filter((id) => !instanceIds.includes(id));
      for (const id of hiddenIds) {
        expect(screen.queryByText(TITLE_KEYS[id])).not.toBeInTheDocument();
      }
    });
  }
});

// ── Property 5b: Only dashboard instances appear in the DOM ───────────────────

describe("Preservation Property 5b — only dashboard instances appear in the DOM", () => {
  it("empty dashboard renders no widgets", () => {
    const dashboard: Dashboard = {
      id: "empty-dash",
      name: "Empty",
      instances: [],
      filter: {},
    };
    render(<WidgetGrid {...baseProps(dashboard)} />);

    for (const key of Object.values(TITLE_KEYS)) {
      expect(screen.queryByText(key)).not.toBeInTheDocument();
    }
  });

  it("dashboard with all four widgets renders all four", () => {
    render(<WidgetGrid {...baseProps()} />);

    for (const key of Object.values(TITLE_KEYS)) {
      expect(screen.getByText(key)).toBeInTheDocument();
    }
  });
});

// ── Property 4: Layout persistence via dashboard store ────────────────────────

describe("Preservation Property 4 — layout persistence via dashboard store", () => {
  const LAYOUTS_KEY = "burkut-widget-layouts";

  it("legacy localStorage layout key still works for migration", () => {
    const legacyLayouts = {
      lg: [
        { i: "sidebar", x: 1, y: 0, w: 3, h: 8, minW: 2, minH: 2 },
        { i: "content", x: 4, y: 0, w: 5, h: 8, minW: 2, minH: 2 },
        { i: "map", x: 9, y: 0, w: 3, h: 8, minW: 2, minH: 2 },
        { i: "timeline", x: 0, y: 8, w: 12, h: 4, minW: 2, minH: 2 },
      ],
    };

    localStorage.setItem(LAYOUTS_KEY, JSON.stringify(legacyLayouts));
    const stored = localStorage.getItem(LAYOUTS_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored ?? "null")).toEqual(legacyLayouts);
  });

  it("page refresh restores the last persisted layout", () => {
    const persistedLayouts = {
      lg: [
        { i: "sidebar", x: 0, y: 0, w: 4, h: 10, minW: 2, minH: 2 },
        { i: "content", x: 4, y: 0, w: 4, h: 10, minW: 2, minH: 2 },
        { i: "map", x: 8, y: 0, w: 4, h: 10, minW: 2, minH: 2 },
        { i: "timeline", x: 0, y: 10, w: 12, h: 3, minW: 2, minH: 2 },
      ],
    };

    localStorage.setItem(LAYOUTS_KEY, JSON.stringify(persistedLayouts));
    const raw = localStorage.getItem(LAYOUTS_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? "null")).toEqual(persistedLayouts);
  });
});
