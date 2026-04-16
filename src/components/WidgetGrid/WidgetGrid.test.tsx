import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ContentIndex } from "../../shared/types.ts";
import { DEFAULT_LAYOUTS } from "./defaultLayouts";
import { WIDGET_REGISTRY } from "./widgetRegistry";

const allVisible = () => Object.fromEntries(WIDGET_REGISTRY.map((w) => [w.id, true]));

// ── Mocks ────────────────────────────────────────────────────────────────────

// Mock config — draggableLayout: true by default (overridden per-test where needed)
vi.mock("../../config", () => ({
  default: {
    features: { draggableLayout: true },
  },
}));

// Mock react-grid-layout — Responsive just renders children; useContainerWidth returns fixed width
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

function defaultProps() {
  return {
    layouts: DEFAULT_LAYOUTS,
    visibilityState: allVisible(),
    onLayoutChange: vi.fn(),
    setWidgetVisible: vi.fn(),
    index: emptyIndex,
    selectedId: null,
    activeGroup: "Dynasties and States",
    onSelectItem: vi.fn(),
    onSelectGroup: vi.fn(),
    getContent: vi.fn(() => null),
    onSelect: vi.fn(),
    hiddenGroups: new Set<string>(),
  };
}

// Import after mocks are set up
import { WidgetGrid } from "./WidgetGrid";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("WidgetGrid", () => {
  it("renders all four widget panels when all visible", () => {
    render(<WidgetGrid {...defaultProps()} />);
    // Each widget gets a WidgetHeader whose title key is rendered as-is by the i18n mock
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

  it("disables drag when draggableLayout is false", async () => {
    vi.resetModules();
    vi.doMock("../../config", () => ({
      default: { features: { draggableLayout: false } },
    }));
    const { WidgetGrid: WG } = await import("./WidgetGrid");
    const { DEFAULT_LAYOUTS: DL } = await import("./defaultLayouts");
    const { WIDGET_REGISTRY: WR } = await import("./widgetRegistry");
    render(
      <WG
        layouts={DL}
        visibilityState={Object.fromEntries(WR.map((w) => [w.id, true]))}
        onLayoutChange={vi.fn()}
        setWidgetVisible={vi.fn()}
        index={emptyIndex}
        selectedId={null}
        activeGroup="Dynasties and States"
        onSelectItem={vi.fn()}
        onSelectGroup={vi.fn()}
        getContent={vi.fn(() => null)}
        onSelect={vi.fn()}
        hiddenGroups={new Set<string>()}
      />,
    );
    const grid = screen.getByTestId("responsive-grid");
    expect(grid).toHaveAttribute("data-drag-enabled", "false");
    vi.doUnmock("../../config");
  });

  it("hides widgets when visibilityState marks them hidden", () => {
    const props = {
      ...defaultProps(),
      visibilityState: { sidebar: false, content: true, map: true, timeline: true },
    };
    render(<WidgetGrid {...props} />);
    expect(screen.queryByText("panels.sidebar")).not.toBeInTheDocument();
    expect(screen.getByText("panels.content")).toBeInTheDocument();
  });
});
