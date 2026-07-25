import { fireEvent, render, screen } from "@testing-library/react";
import type { Layout, ResponsiveLayouts } from "react-grid-layout";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WidgetTypeDefinition } from "../registry/types";
import { DashboardGrid, type DashboardGridInstance } from "./DashboardGrid";

const UPDATED_LAYOUT = [{ i: "alpha-1", x: 1, y: 2, w: 6, h: 4 }] as unknown as Layout;

vi.mock("react-grid-layout", () => ({
  Responsive: ({
    children,
    onLayoutChange,
  }: {
    children: React.ReactNode;
    onLayoutChange?: (currentLayout: Layout, allLayouts: ResponsiveLayouts) => void;
  }) => (
    <div data-testid="responsive-grid">
      <button
        type="button"
        onClick={() => onLayoutChange?.(UPDATED_LAYOUT, { lg: UPDATED_LAYOUT })}
      >
        Trigger layout change
      </button>
      {children}
    </div>
  ),
  useContainerWidth: () => ({ width: 1280, containerRef: { current: null }, mounted: true }),
}));

interface TestContext {
  prefix: string;
}

interface TestWidgetConfig {
  label: string;
}

type TestInstance = DashboardGridInstance<TestWidgetConfig>;

const optionsSchema = [
  {
    key: "label",
    kind: "string",
    label: "Label",
    default: "Default label",
  },
] as const;

function createTypeDefinition(typeId: string, title: string): WidgetTypeDefinition<TestContext> {
  return {
    typeId,
    titleKey: title,
    descriptionKey: `${title} description`,
    component: ({ content }: { content: string }) => <div>{content}</div>,
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 2, h: 2 },
    defaultConfig: { label: title },
    optionsSchema,
    buildProps: (ctx, config) => ({
      content: `${ctx.prefix}:${(config as TestWidgetConfig).label}`,
    }),
  };
}

const typeDefinitions: Record<string, WidgetTypeDefinition<TestContext>> = {
  alpha: createTypeDefinition("alpha", "Alpha Widget"),
  beta: createTypeDefinition("beta", "Beta Widget"),
};

function createInstance(typeId: string, instanceId: string, label: string): TestInstance {
  return {
    instanceId,
    widgetTypeId: typeId,
    position: { x: 0, y: 0, w: 4, h: 5, minW: 2, minH: 2 },
    config: { label },
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("DashboardGrid", () => {
  it("renders one WidgetShell-wrapped instance per grid item", () => {
    const { container } = render(
      <DashboardGrid
        instances={[
          createInstance("alpha", "alpha-1", "First"),
          createInstance("beta", "beta-1", "Second"),
        ]}
        resolveType={(typeId) => typeDefinitions[typeId]}
        renderContext={{ prefix: "ctx" }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Alpha Widget", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Beta Widget", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("ctx:First")).toBeInTheDocument();
    expect(screen.getByText("ctx:Second")).toBeInTheDocument();
    expect(container.querySelectorAll(".widget-item")).toHaveLength(2);
  });

  it("renders an unknown-widget fallback instead of crashing", () => {
    render(
      <DashboardGrid
        instances={[createInstance("missing", "missing-1", "Unknown")]}
        resolveType={() => undefined}
        renderContext={{ prefix: "ctx" }}
        getUnknownWidgetMessage={(instance) => `Unknown widget: ${instance.widgetTypeId}`}
      />,
    );

    expect(screen.getByText("Unknown widget: missing")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "missing", level: 3 })).toBeInTheDocument();
  });

  it("fires onLayoutChange with the updated layout", () => {
    const onLayoutChange = vi.fn();

    render(
      <DashboardGrid
        instances={[createInstance("alpha", "alpha-1", "First")]}
        resolveType={(typeId) => typeDefinitions[typeId]}
        renderContext={{ prefix: "ctx" }}
        onLayoutChange={onLayoutChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Trigger layout change" }));

    expect(onLayoutChange).toHaveBeenCalledWith(UPDATED_LAYOUT, { lg: UPDATED_LAYOUT });
  });

  it("wires each instance action callback through WidgetShell", () => {
    const onConfigClick = vi.fn();
    const onDuplicate = vi.fn();
    const onRemove = vi.fn();
    const onClose = vi.fn();
    const instance = createInstance("alpha", "alpha-1", "First");

    render(
      <DashboardGrid
        instances={[instance]}
        resolveType={(typeId) => typeDefinitions[typeId]}
        renderContext={{ prefix: "ctx" }}
        shellLabels={{
          configAriaLabel: "Configure alpha",
          duplicateAriaLabel: "Duplicate alpha",
          removeAriaLabel: "Remove alpha",
          closeAriaLabel: "Close alpha",
        }}
        onConfigClick={onConfigClick}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Configure alpha" }));
    fireEvent.click(screen.getByRole("button", { name: "Duplicate alpha" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove alpha" }));
    fireEvent.click(screen.getByRole("button", { name: "Close alpha" }));

    expect(onConfigClick).toHaveBeenCalledWith(instance, typeDefinitions.alpha);
    expect(onDuplicate).toHaveBeenCalledWith(instance);
    expect(onRemove).toHaveBeenCalledWith(instance);
    expect(onClose).toHaveBeenCalledWith(instance);
  });
});
