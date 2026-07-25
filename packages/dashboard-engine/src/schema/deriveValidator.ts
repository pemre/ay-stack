/**
 * Derives a single object-shaped Standard Schema validator from an
 * `OptionsSchema` (Requirement 2.3), so the same field list backs both
 * validation and UI generation without being declared twice.
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";
import { validatorForField } from "./fieldKinds.ts";
import type { OptionsSchema } from "./types.ts";

const VENDOR = "@ay/dashboard-engine";

/**
 * Runs each field's own validator against `config[field.key]` and merges the
 * results. Issues carry `path: [field.key]`, so a caller can tell which field
 * failed without re-deriving the schema.
 */
export function deriveValidator(schema: OptionsSchema): StandardSchemaV1<Record<string, unknown>> {
  return {
    "~standard": {
      version: 1,
      vendor: VENDOR,
      validate(config: unknown) {
        const source = (config ?? {}) as Record<string, unknown>;
        const value: Record<string, unknown> = {};
        const issues: StandardSchemaV1.Issue[] = [];

        for (const field of schema) {
          const validator = validatorForField(field as Parameters<typeof validatorForField>[0]);
          const result = validator["~standard"].validate(source[field.key]);
          if ("issues" in result && result.issues) {
            for (const fieldIssue of result.issues) {
              issues.push({ ...fieldIssue, path: [field.key] });
            }
            continue;
          }
          value[field.key] = (result as { value: unknown }).value;
        }

        if (issues.length > 0) return { issues };
        return { value };
      },
    },
  };
}
