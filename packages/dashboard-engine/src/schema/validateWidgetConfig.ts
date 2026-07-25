/**
 * Validates a widget instance's persisted `config` against its widget type's
 * `optionsSchema`, falling back field-by-field to the type's `defaultConfig`
 * on failure rather than discarding the whole instance (Requirement 4.1, 4.2).
 */

import { validatorForField } from "./fieldKinds.ts";
import type { FieldDescriptor, OptionsSchema } from "./types.ts";

interface WidgetTypeLike {
  optionsSchema?: OptionsSchema;
  defaultConfig: unknown;
}

/**
 * Replaces only the fields that fail their own validator with the matching
 * value from `defaultConfig` (or the field's own `default` if `defaultConfig`
 * doesn't carry that key), preserving every valid field verbatim. Fields in
 * `config` that aren't described by the schema pass through untouched -- the
 * schema describes a *subset* of a widget's config that's user-configurable,
 * not necessarily its entire shape.
 */
function mergeWithDefaults(
  schema: OptionsSchema,
  config: unknown,
  defaultConfig: unknown,
): Record<string, unknown> {
  const source = (config ?? {}) as Record<string, unknown>;
  const defaults = (defaultConfig ?? {}) as Record<string, unknown>;
  const result: Record<string, unknown> = { ...source };

  for (const field of schema as readonly FieldDescriptor[]) {
    const validator = validatorForField(field as Parameters<typeof validatorForField>[0]);
    const outcome = validator["~standard"].validate(source[field.key]) as
      | { value: unknown }
      | { issues: readonly unknown[] };
    if ("issues" in outcome && outcome.issues !== undefined) {
      result[field.key] = field.key in defaults ? defaults[field.key] : field.default;
    }
  }

  return result;
}

/**
 * Validates `config` against `typeDef.optionsSchema`. Widget types with no
 * schema are treated as unconfigurable and `config` passes through unchanged
 * (Requirement 2.4). Never throws and never discards the instance: an invalid
 * field is replaced by its default, valid fields are preserved.
 */
export function validateWidgetConfig(typeDef: WidgetTypeLike, config: unknown): unknown {
  if (!typeDef.optionsSchema) return config;
  return mergeWithDefaults(typeDef.optionsSchema, config, typeDef.defaultConfig);
}
