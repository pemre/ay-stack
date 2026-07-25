import { validatorForField } from "../schema/fieldKinds.ts";
import type { WidgetTypeDefinition } from "./types.ts";

type ImportMetaWithEnv = ImportMeta & {
  env?: {
    DEV?: boolean;
  };
};

function assertOptionsSchemaConsistency<TCtx>(definition: WidgetTypeDefinition<TCtx>): void {
  if (!definition.optionsSchema) {
    return;
  }

  for (const field of definition.optionsSchema) {
    const result = validatorForField(field)["~standard"].validate(field.default);

    if ("issues" in result && result.issues?.length) {
      const messages = result.issues.map((issue) => issue.message).join(", ");
      throw new Error(
        `Invalid optionsSchema default for widget type "${definition.typeId}" field "${field.key}": ${messages}`,
      );
    }
  }
}

export function createWidgetRegistry<TCtx = unknown>() {
  const widgetTypes = new Map<string, WidgetTypeDefinition<TCtx>>();

  return {
    register(definition: WidgetTypeDefinition<TCtx>): void {
      if ((import.meta as ImportMetaWithEnv).env?.DEV) {
        assertOptionsSchemaConsistency(definition);
      }

      widgetTypes.set(definition.typeId, definition);
    },

    get(typeId: string): WidgetTypeDefinition<TCtx> | undefined {
      return widgetTypes.get(typeId);
    },

    getAll(): WidgetTypeDefinition<TCtx>[] {
      return [...widgetTypes.values()];
    },
  };
}
