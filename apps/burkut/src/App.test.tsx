import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// Mock virtual:burkut-content (used by useContentGraph)
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

// Mock useContentGraph to avoid virtual module resolution
vi.mock("./hooks/useContentGraph", () => ({
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

// Mock config — default export with draggableLayout: true; overridden per test
vi.mock("./config", () => ({
  default: {
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
  },
}));

// Mock useDashboardStore
const mockResetDashboardLayout = vi.fn();
const mockDashboard = {
  id: "dash-1",
  name: "Dashboard",
  instances: [],
  filter: {},
};

vi.mock("./stores/dashboardStore", () => ({
  useDashboardStore: (selector: (state: any) => any) => {
    const state = {
      dashboards: [mockDashboard],
      activeDashboardId: "dash-1",
      resetDashboardLayout: mockResetDashboardLayout,
    };
    return selector(state);
  },
}));

// Mock WidgetGrid to avoid rendering the full grid
vi.mock("./components/WidgetGrid/WidgetGrid", () => ({
  WidgetGrid: () => <div data-testid="widget-grid" />,
}));

// Mock DashboardBar
vi.mock("./components/DashboardBar/DashboardBar", () => ({
  DashboardBar: () => <div data-testid="dashboard-bar" />,
}));

// Mock other heavy components
vi.mock("./components/ThemeToggle/ThemeToggle", () => ({
  default: () => <div data-testid="theme-toggle" />,
}));
vi.mock("./components/ProgressPie/ProgressPie", () => ({
  default: () => <div data-testid="progress-pie" />,
}));
vi.mock("./components/NewContentModal/NewContentModal", () => ({
  default: () => null,
}));

import App from "./App";
import config from "./config";

describe("App header controls", () => {
  it("renders the DashboardBar in the header", () => {
    render(<App />);
    expect(screen.getByTestId("dashboard-bar")).toBeInTheDocument();
  });

  it("reset button is visible when draggableLayout is true", () => {
    render(<App />);
    const btn = screen.getByRole("button", { name: "layout.reset" });
    expect(btn).toBeInTheDocument();
  });

  it("reset button is hidden when draggableLayout is false", () => {
    const original = config.features.draggableLayout;
    config.features.draggableLayout = false;

    render(<App />);
    expect(screen.queryByRole("button", { name: "layout.reset" })).not.toBeInTheDocument();

    config.features.draggableLayout = original;
  });

  it("reset button uses i18n translation key as aria-label", () => {
    config.features.draggableLayout = true;
    render(<App />);
    const btn = screen.getByRole("button", { name: "layout.reset" });
    expect(btn).toHaveAttribute("aria-label", "layout.reset");
  });

  it("reset button calls resetDashboardLayout with active dashboard id", async () => {
    config.features.draggableLayout = true;
    render(<App />);
    const btn = screen.getByRole("button", { name: "layout.reset" });
    await userEvent.click(btn);
    expect(mockResetDashboardLayout).toHaveBeenCalledWith("dash-1");
  });

  it("renders WidgetGrid", () => {
    render(<App />);
    expect(screen.getByTestId("widget-grid")).toBeInTheDocument();
  });
});
