import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DashboardGrid, type DashboardGridInstance } from "./DashboardGrid/DashboardGrid.tsx";
import { createWidgetRegistry } from "./registry/createWidgetRegistry.ts";
import type { WidgetTypeDefinition } from "./registry/types.ts";
import { WidgetShell } from "./WidgetShell/WidgetShell.tsx";

interface DemoContext {
  prefix: string;
}

type DemoInstance = DashboardGridInstance<{ label: string }>;

function DemoWidget({ label }: { label: string }): JSX.Element {
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
  }),
};

const registry = createWidgetRegistry<DemoContext>();
registry.register(definition);

function DashboardPlayground(): JSX.Element {
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
        renderContext={{ prefix: "Storybook" }}
        shellLabels={{
          configAriaLabel: "Configure widget",
          duplicateAriaLabel: "Duplicate widget",
          removeAriaLabel: "Remove widget",
        }}
        onDuplicate={(instance) =>
          setInstances((current) => [
            ...current,
            {
              ...instance,
              instanceId: `${instance.instanceId}-copy`,
              position: { ...instance.position, y: instance.position.y + 4 },
            },
          ])
        }
        onRemove={(instance) =>
          setInstances((current) =>
            current.filter(({ instanceId }) => instanceId !== instance.instanceId),
          )
        }
        onUpdateInstanceConfig={(instance, partial) =>
          setInstances((current) =>
            current.map((candidate) =>
              candidate.instanceId === instance.instanceId
                ? {
                    ...candidate,
                    config: { ...candidate.config, ...partial } as { label: string },
                  }
                : candidate,
            ),
          )
        }
        getConfigPanelLabels={() => ({
          title: "Widget options",
          closeAriaLabel: "Close options",
        })}
      />
    </div>
  );
}

const meta: Meta = { title: "Dashboard/Overview" };
export default meta;
type Story = StoryObj;

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

export const Playground: Story = { render: () => <DashboardPlayground /> };
