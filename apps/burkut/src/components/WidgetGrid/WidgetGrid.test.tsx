import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ContentIndex, Dashboard } from "../../shared/types.ts";

// ── Mocks ────────────────────────────────────────────────────────────────────

// Mock config — draggableLayout: true by default
vi.mock("../../config", () => ({
  default: {
    features: { draggableLayout: true },
  },
}));

// Mock dashboardStore
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

// Mock react-grid-layout
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
}));

// Mock react-leaflet (MapPanel uses it)
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

// Mock vis-timeline (TimelinePanel uses it)
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

function createTestDashboard(): Dashboard {
  return {
    id: "test-dashboard-1",
    name: "Test Dashboard",
    instances: [
      {
        instanceId: "inst-sidebar-1",
        widgetTypeId: "sidebar",
        position: { x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 2 },
        config: { type: "sidebar", tags: [], contentType: null },
      },
      {
        instanceId: "inst-content-1",
        widgetTypeId: "content",
        position: { x: 3, y: 0, w: 5, h: 8, minW: 2, minH: 2 },
        config: { type: "content", pinnedItemId: null },
      },
      {
        instanceId: "inst-map-1",
        widgetTypeId: "map",
        position: { x: 8, y: 0, w: 4, h: 8, minW: 2, minH: 2 },
        config: { type: "map", boundingBox: null, zoomLevel: null },
      },
      {
        instanceId: "inst-timeline-1",
        widgetTypeId: "timeline",
        position: { x: 0, y: 8, w: 12, h: 4, minW: 2, minH: 2 },
        config: { type: "timeline", startDate: null, endDate: null },
      },
    ],
    filter: {},
  };
}

function defaultProps() {
  return {
    dashboard: createTestDashboard(),
    index: emptyIndex,
    getContent: vi.fn(() => null),
    selectedId: null,
    onSelectItem: vi.fn(),
  };
}

// Import after mocks are set up
import { WidgetGrid } from "./WidgetGrid";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("WidgetGrid", () => {
  it("renders all four widget panels from dashboard instances", () => {
    render(<WidgetGrid {...defaultProps()} />);
    expect(screen.getByText("panels.sidebar")).toBeInTheDocument();
    expect(screen.getByText("panels.content")).toBeInTheDocument();
    expect(screen.getByText("panels.map")).toBeInTheDocument();
    expect(screen.getByText("panels.timeline")).toBeInTheDocument();
  });

  it("passes correct lg column count (12) to Responsive", () => {
    render(<WidgetGrid {...defaultProps()} />);
    const grid = screen.getByTestId("responsive-grid");
    expect(grid).toHaveAttribute("data-cols-lg", "12");
  });

  it("sets dragConfig.handle to .widget-header when draggableLayout is true", () => {
    render(<WidgetGrid {...defaultProps()} />);
    const grid = screen.getByTestId("responsive-grid");
    expect(grid).toHaveAttribute("data-drag-handle", ".widget-header");
  });

  it("renders unknown widget placeholder for unregistered widget type", () => {
    const dashboard = createTestDashboard();
    dashboard.instances = [
      {
        instanceId: "inst-unknown-1",
        widgetTypeId: "nonexistent-widget",
        position: { x: 0, y: 0, w: 4, h: 4 },
        config: { type: "sidebar", tags: [], contentType: null },
      },
    ];
    render(<WidgetGrid {...defaultProps()} dashboard={dashboard} />);
    expect(screen.getAllByText("widget.unknown").length).toBeGreaterThan(0);
  });

  it("renders Add Widget button when draggable layout is enabled", () => {
    render(<WidgetGrid {...defaultProps()} />);
    expect(screen.getByText("+ widgetPicker.add")).toBeInTheDocument();
  });

  it("renders correct number of widget items matching dashboard instances", () => {
    render(<WidgetGrid {...defaultProps()} />);
    const items = document.querySelectorAll(".widget-item");
    expect(items.length).toBe(4);
  });
});
