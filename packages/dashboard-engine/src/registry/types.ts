import type { ComponentType } from "react";
import type { OptionsSchema } from "../schema/types.ts";

export interface WidgetSize {
  w: number;
  h: number;
}

/**
 * Opaque render context supplied by the host app.
 * The engine treats this as a generic bag of app-specific dependencies.
 */
export type WidgetRenderContext<TCtx = unknown> = TCtx;

export interface WidgetTypeDefinition<TCtx = unknown> {
  typeId: string;
  titleKey: string;
  descriptionKey: string;
  // biome-ignore lint/suspicious/noExplicitAny: Widget components are intentionally opaque to the engine.
  component: ComponentType<any>;
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  defaultConfig: unknown;
  optionsSchema?: OptionsSchema;
  buildProps: (ctx: WidgetRenderContext<TCtx>, config: unknown) => Record<string, unknown>;
}
