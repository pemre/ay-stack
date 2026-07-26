import { afterEach, describe, expect, it } from "vitest";
import { createWidgetRegistry } from "./createWidgetRegistry";
import type { WidgetTypeDefinition } from "./types";

type ImportMetaWithEnv = ImportMeta & {
  env?: {
    DEV?: boolean;
  };
};

interface TestContext {
  locale: string;
}

const baseDefinition: WidgetTypeDefinition<TestContext> = {
  typeId: "alpha",
  titleKey: "Alpha widget",
  descriptionKey: "Alpha widget description",
  component: () => null,
  defaultSize: { w: 4, h: 5 },
  minSize: { w: 2, h: 2 },
  defaultConfig: { title: "Alpha" },
  buildProps: (ctx, config) => ({ ctx, config }),
};

const importMetaWithEnv = import.meta as ImportMetaWithEnv;
const originalDev = importMetaWithEnv.env?.DEV;

function setDevMode(value: boolean): void {
  if (!importMetaWithEnv.env) {
    importMetaWithEnv.env = {} as NonNullable<ImportMetaWithEnv["env"]>;
  }

  const env = importMetaWithEnv.env;
  Object.assign(env, { DEV: value });
}

afterEach(() => {
  setDevMode(originalDev);
});

describe("createWidgetRegistry", () => {
  it("returns the same definition from get after register", () => {
    const registry = createWidgetRegistry<TestContext>();

    registry.register(baseDefinition);

    expect(registry.get(baseDefinition.typeId)).toBe(baseDefinition);
  });

  it("returns every registered definition from getAll", () => {
    const registry = createWidgetRegistry<TestContext>();
    const secondDefinition: WidgetTypeDefinition<TestContext> = {
      ...baseDefinition,
      typeId: "beta",
      titleKey: "Beta widget",
      descriptionKey: "Beta widget description",
    };

    registry.register(baseDefinition);
    registry.register(secondDefinition);

    expect(registry.getAll()).toEqual([baseDefinition, secondDefinition]);
  });

  it("throws in dev mode when a field default fails its own validator", () => {
    setDevMode(true);

    const registry = createWidgetRegistry<TestContext>();
    const invalidDefinition: WidgetTypeDefinition<TestContext> = {
      ...baseDefinition,
      typeId: "broken",
      defaultConfig: { status: "invalid" },
      optionsSchema: [
        {
          key: "status",
          kind: "enum",
          label: "Status",
          default: "invalid",
          options: ["ready", "loading"] as const,
        },
      ],
    };

    expect(() => registry.register(invalidDefinition)).toThrow(
      'Invalid optionsSchema default for widget type "broken" field "status"',
    );
  });
});
