// Feature: dashboard-engine-extraction, Property 2: Derived-validator composability
//
// For an arbitrary OptionsSchema and an arbitrary config object, the derived
// validator's issue count equals the number of fields whose value fails that
// field's own individual validator.
//
// Validates: Requirements 2.3

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { deriveValidator } from "./deriveValidator.ts";
import { validatorForField } from "./fieldKinds.ts";
import type { FieldDescriptor, OptionsSchema } from "./types.ts";

/** Arbitrary field descriptor of a random kind, with a unique key. */
function arbitraryField(key: string): fc.Arbitrary<FieldDescriptor> {
  return fc.oneof(
    fc.record({
      key: fc.constant(key),
      kind: fc.constant("string" as const),
      label: fc.constant(key),
      default: fc.constant(""),
    }),
    fc.record({
      key: fc.constant(key),
      kind: fc.constant("number" as const),
      label: fc.constant(key),
      default: fc.constant(0),
    }),
    fc.record({
      key: fc.constant(key),
      kind: fc.constant("boolean" as const),
      label: fc.constant(key),
      default: fc.constant(false),
    }),
    fc.record({
      key: fc.constant(key),
      kind: fc.constant("stringArray" as const),
      label: fc.constant(key),
      default: fc.constant([] as string[]),
    }),
    fc.record({
      key: fc.constant(key),
      kind: fc.constant("dateString" as const),
      label: fc.constant(key),
      default: fc.constant(null as string | null),
    }),
  );
}

/** Arbitrary schema with 1-4 uniquely-keyed fields. */
const arbitrarySchema: fc.Arbitrary<OptionsSchema> = fc
  .integer({ min: 1, max: 4 })
  .chain((count) =>
    fc.tuple(...Array.from({ length: count }, (_, i) => arbitraryField(`field${i}`))),
  );

/** Arbitrary raw value for one field slot -- mixes correctly- and wrongly-typed values. */
const arbitraryFieldValue = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.boolean(),
  fc.array(fc.string()),
  fc.constant(null),
  fc.constant(undefined),
);

describe("Property 2: Derived-validator composability", () => {
  it("issue count equals the number of individually-failing fields", () => {
    fc.assert(
      fc.property(arbitrarySchema, (schema) => {
        // Build one arbitrary config object shaped by this schema's keys.
        const config: Record<string, unknown> = {};
        for (const field of schema) {
          config[field.key] = fc.sample(arbitraryFieldValue, 1)[0];
        }

        const expectedFailures = schema.filter((field) => {
          const validator = validatorForField(field as Parameters<typeof validatorForField>[0]);
          const result = validator["~standard"].validate(config[field.key]) as
            | { value: unknown }
            | { issues: readonly unknown[] };
          return "issues" in result && result.issues !== undefined;
        }).length;

        const derived = deriveValidator(schema);
        const result = derived["~standard"].validate(config) as
          | { value: unknown }
          | { issues: readonly unknown[] };

        if (expectedFailures === 0) {
          expect("issues" in result && result.issues !== undefined).toBe(false);
        } else {
          expect("issues" in result ? result.issues?.length : 0).toBe(expectedFailures);
        }
      }),
      { numRuns: 200 },
    );
  });
});
