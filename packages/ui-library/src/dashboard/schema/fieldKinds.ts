/**
 * One Standard-Schema-compliant validator per field kind (Requirement 5).
 * Implemented against `@standard-schema/spec`'s types only -- no `zod` or any
 * other validation library dependency (Requirement 5.2).
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { NumberField, StringArrayField, StringField } from "./types.ts";

const VENDOR = "@ay/ui-library";

function issue(message: string): StandardSchemaV1.FailureResult {
  return { issues: [{ message }] };
}

/** Validates a plain string. */
export function stringField(): StandardSchemaV1<string> {
  return {
    "~standard": {
      version: 1,
      vendor: VENDOR,
      validate(value: unknown) {
        if (typeof value === "string") return { value };
        return issue("Expected string");
      },
    },
  };
}

/** Validates a finite number (or `null`, when the field allows "unset"), honoring optional min/max. */
export function numberField(
  opts: Pick<NumberField, "min" | "max"> = {},
): StandardSchemaV1<number | null> {
  return {
    "~standard": {
      version: 1,
      vendor: VENDOR,
      validate(value: unknown) {
        if (value === null) return { value: null };
        if (typeof value !== "number" || !Number.isFinite(value)) {
          return issue("Expected a finite number or null");
        }
        if (opts.min !== undefined && value < opts.min) {
          return issue(`Expected a number >= ${opts.min}`);
        }
        if (opts.max !== undefined && value > opts.max) {
          return issue(`Expected a number <= ${opts.max}`);
        }
        return { value };
      },
    },
  };
}

/** Validates a plain boolean. */
export function booleanField(): StandardSchemaV1<boolean> {
  return {
    "~standard": {
      version: 1,
      vendor: VENDOR,
      validate(value: unknown) {
        if (typeof value === "boolean") return { value };
        return issue("Expected boolean");
      },
    },
  };
}

/** Validates an array of strings. */
export function stringArrayField(
  _opts: Pick<StringArrayField, "itemPlaceholder"> = {},
): StandardSchemaV1<string[]> {
  return {
    "~standard": {
      version: 1,
      vendor: VENDOR,
      validate(value: unknown) {
        if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
          return { value: [...value] };
        }
        return issue("Expected an array of strings");
      },
    },
  };
}

/** Validates that a value is one of a fixed set of string options. */
export function enumField<T extends string>(options: readonly T[]): StandardSchemaV1<T> {
  return {
    "~standard": {
      version: 1,
      vendor: VENDOR,
      validate(value: unknown) {
        if (typeof value === "string" && (options as readonly string[]).includes(value)) {
          return { value: value as T };
        }
        return issue(`Expected one of: ${options.join(", ")}`);
      },
    },
  };
}

/**
 * Validates an ISO date string (`YYYY-MM-DD`) or `null`. Deliberately does not
 * validate calendar correctness (e.g. "2024-02-30") beyond shape -- the widgets
 * that consume this field (LinearTimeline) treat it as an opaque bound string,
 * not a parsed date, matching today's hand-written TimelineConfigPanel.
 */
export function dateStringField(): StandardSchemaV1<string | null> {
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
  return {
    "~standard": {
      version: 1,
      vendor: VENDOR,
      validate(value: unknown) {
        if (value === null) return { value: null };
        if (typeof value === "string" && ISO_DATE.test(value)) return { value };
        return issue("Expected an ISO date string (YYYY-MM-DD) or null");
      },
    },
  };
}

/** Resolves the built-in validator for a field descriptor's `kind`, honoring its declared constraints. */
export function validatorForField(
  field:
    | StringField
    | NumberField
    | { kind: "boolean" }
    | StringArrayField
    | { kind: "enum"; options: readonly string[] }
    | { kind: "dateString" },
): StandardSchemaV1<unknown> {
  switch (field.kind) {
    case "string":
      return stringField();
    case "number":
      return numberField(field);
    case "boolean":
      return booleanField();
    case "stringArray":
      return stringArrayField(field);
    case "enum":
      return enumField(field.options);
    case "dateString":
      return dateStringField();
  }
}
