import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { useState } from "react";
import { DashboardGrid, type DashboardGridInstance } from "./DashboardGrid/DashboardGrid.tsx";
import { createWidgetRegistry } from "./registry/createWidgetRegistry.ts";
import type { WidgetTypeDefinition } from "./registry/types.ts";
import { WidgetShell } from "./WidgetShell/WidgetShell.tsx";

interface DemoContext {
  prefix: string;
  shouldSuspend: boolean;
}

type DemoInstance = DashboardGridInstance<{ label: string }>;

interface PlaygroundArgs {
  draggable: boolean;
  showEmptyState: boolean;
  showLoadingState: boolean;
  onLayoutChange: ReturnType<typeof fn>;
  onConfigClick: ReturnType<typeof fn>;
  onDuplicate: ReturnType<typeof fn>;
  onRemove: ReturnType<typeof fn>;
  onClose: ReturnType<typeof fn>;
  onUpdateInstanceConfig: ReturnType<typeof fn>;
}

const neverResolvingPromise = new Promise<never>(() => undefined);

function DemoWidget({
  label,
  shouldSuspend,
}: {
  label: string;
  shouldSuspend: boolean;
}): JSX.Element {
  if (shouldSuspend) {
    throw neverResolvingPromise;
  }

  return <div style={{ padding: 16 }}>{label}</div>;
}

const schema = [
  { key: "label", kind: "string", label: "Label", default: "Untitled widget" },
] as const;
const definition: WidgetTypeDefinition<DemoContext> = {
  typeId: "demo",
  titleKey: "Demo widget",
  descriptionKey: "A library-owned Storybook fixture",
  component: DemoWidget,
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 2, h: 2 },
  defaultConfig: { label: "Untitled widget" },
  optionsSchema: schema,
  buildProps: (context, config) => ({
    label: `${context.prefix}: ${(config as { label: string }).label}`,
    shouldSuspend: context.shouldSuspend,
  }),
};

const registry = createWidgetRegistry<DemoContext>();
registry.register(definition);

function DashboardPlayground({
  draggable,
  showEmptyState,
  showLoadingState,
  onLayoutChange,
  onConfigClick,
  onDuplicate,
  onRemove,
  onClose,
  onUpdateInstanceConfig,
}: PlaygroundArgs): JSX.Element {
  const [instances, setInstances] = useState<DemoInstance[]>([
    {
      instanceId: "first",
      widgetTypeId: "demo",
      position: { x: 0, y: 0, w: 4, h: 4 },
      config: { label: "First" },
    },
    {
      instanceId: "second",
      widgetTypeId: "demo",
      position: { x: 4, y: 0, w: 4, h: 4 },
      config: { label: "Second" },
    },
  ]);

  return (
    <div style={{ minHeight: 440 }}>
      <DashboardGrid
        instances={instances}
        resolveType={registry.get}
        renderContext={{ prefix: "Storybook", shouldSuspend: showLoadingState }}
        draggable={draggable}
        shellLabels={{
          configAriaLabel: "Configure widget",
          duplicateAriaLabel: "Duplicate widget",
          removeAriaLabel: "Remove widget",
        }}
        onLayoutChange={(layout, allLayouts) => {
          onLayoutChange(layout, allLayouts);
          const positions = new Map(layout.map(({ i, x, y, w, h }) => [i, { x, y, w, h }]));
          setInstances((current) =>
            current.map((instance) => {
              const position = positions.get(instance.instanceId);

              return position
                ? { ...instance, position: { ...instance.position, ...position } }
                : instance;
            }),
          );
        }}
        onConfigClick={onConfigClick}
        onDuplicate={(instance) => {
          onDuplicate(instance);
          setInstances((current) => [
            ...current,
            {
              ...instance,
              instanceId: `${instance.instanceId}-copy`,
              position: { ...instance.position, y: instance.position.y + 4 },
            },
          ]);
        }}
        onRemove={(instance) => {
          onRemove(instance);
          setInstances((current) =>
            current.filter(({ instanceId }) => instanceId !== instance.instanceId),
          );
        }}
        onClose={(instance) => {
          onClose(instance);
          setInstances((current) =>
            current.filter(({ instanceId }) => instanceId !== instance.instanceId),
          );
        }}
        onUpdateInstanceConfig={(instance, partial, typeDef) => {
          onUpdateInstanceConfig(instance, partial, typeDef);
          setInstances((current) =>
            current.map((candidate) =>
              candidate.instanceId === instance.instanceId
                ? {
                    ...candidate,
                    config: { ...candidate.config, ...partial } as { label: string },
                  }
                : candidate,
            ),
          );
        }}
        getConfigPanelLabels={() => ({
          title: "Widget options",
          closeAriaLabel: "Close options",
        })}
        isInstanceEmpty={() => showEmptyState}
        renderEmptyState={() => <div style={{ padding: 16 }}>This widget has no data.</div>}
        getLoadingState={() => <div style={{ padding: 16 }}>Loading widget…</div>}
      />
    </div>
  );
}

const meta: Meta<typeof DashboardPlayground> = {
  title: "Dashboard/Overview",
  component: DashboardPlayground,
  args: {
    draggable: true,
    showEmptyState: false,
    showLoadingState: false,
    onLayoutChange: fn(),
    onConfigClick: fn(),
    onDuplicate: fn(),
    onRemove: fn(),
    onClose: fn(),
    onUpdateInstanceConfig: fn(),
  },
  argTypes: {
    draggable: {
      control: "boolean",
      description: "Enables drag and resize interactions for every widget.",
    },
    showEmptyState: {
      control: "boolean",
      description: "Shows the host-provided empty state instead of widget content.",
    },
    showLoadingState: {
      control: "boolean",
      description: "Supplies the Suspense fallback used by lazy widget content.",
    },
    onLayoutChange: { action: "layout changed" },
    onConfigClick: { action: "config clicked" },
    onDuplicate: { action: "widget duplicated" },
    onRemove: { action: "widget removed" },
    onClose: { action: "widget closed" },
    onUpdateInstanceConfig: { action: "widget configuration updated" },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const WidgetShellStates: Story = {
  render: () => (
    <WidgetShell
      title="Example widget"
      draggable={false}
      labels={{ errorFallbackMessage: "This widget could not render." }}
      onConfigClick={() => undefined}
    >
      <div style={{ padding: 16 }}>Widget content</div>
    </WidgetShell>
  ),
};

export const Playground: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Use the Controls panel to toggle grid and state behavior. Click each header action, edit the generated Label field, or drag/resize a widget; every host callback is recorded in Actions.",
      },
    },
  },
};

export const UnknownWidget: Story = {
  render: (args) => (
    <div style={{ minHeight: 280 }}>
      <DashboardGrid
        instances={[
          {
            instanceId: "missing",
            widgetTypeId: "not-registered",
            position: { x: 0, y: 0, w: 4, h: 4 },
            config: {},
          },
        ]}
        resolveType={registry.get}
        renderContext={{ prefix: "Storybook", shouldSuspend: false }}
        draggable={args.draggable}
        getUnknownWidgetMessage={(instance) =>
          `No widget is registered for “${instance.widgetTypeId}”.`
        }
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A missing registry definition is contained and rendered with the host-provided fallback.",
      },
    },
  },
};
