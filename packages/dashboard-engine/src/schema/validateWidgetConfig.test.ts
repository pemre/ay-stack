import { describe, expect, it } from "vitest";
import type { OptionsSchema } from "./types.ts";
import { validateWidgetConfig } from "./validateWidgetConfig.ts";

const schema: OptionsSchema = [
  { key: "pinnedItemId", kind: "string", label: "Pinned item", default: "" },
  { key: "zoomLevel", kind: "number", label: "Zoom", default: null, min: 0, max: 20 },
];

describe("validateWidgetConfig", () => {
  it("passes through a fully valid config unchanged", () => {
    const config = { pinnedItemId: "abc", zoomLevel: 5 };
    const result = validateWidgetConfig({ optionsSchema: schema, defaultConfig: {} }, config);
    expect(result).toEqual(config);
  });

  it("replaces only the invalid field with its schema default, preserving valid fields", () => {
    const config = { pinnedItemId: "abc", zoomLevel: "twelve" };
    const result = validateWidgetConfig(
      { optionsSchema: schema, defaultConfig: { zoomLevel: null } },
      config,
    );
    expect(result).toEqual({ pinnedItemId: "abc", zoomLevel: null });
  });

  it("falls back to the field's own default when defaultConfig lacks the key", () => {
    const config = { pinnedItemId: "abc", zoomLevel: "twelve" };
    const result = validateWidgetConfig({ optionsSchema: schema, defaultConfig: {} }, config);
    expect(result).toEqual({ pinnedItemId: "abc", zoomLevel: null });
  });

  it("returns config unchanged when the widget type has no optionsSchema", () => {
    const config = { anything: "goes" };
    const result = validateWidgetConfig({ defaultConfig: {} }, config);
    expect(result).toBe(config);
  });

  it("handles a null/undefined config by filling every field with its default", () => {
    const result = validateWidgetConfig(
      { optionsSchema: schema, defaultConfig: { pinnedItemId: "fallback", zoomLevel: 4 } },
      null,
    );
    expect(result).toEqual({ pinnedItemId: "fallback", zoomLevel: 4 });
  });
});
