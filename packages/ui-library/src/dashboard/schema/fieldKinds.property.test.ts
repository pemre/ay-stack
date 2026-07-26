// Feature: dashboard-engine-extraction, Property 1: Field-kind validator round trip
//
// For each of the six field kinds, an arbitrary value matching that kind's
// shape (respecting enum options and number min/max where declared) always
// validates successfully; an arbitrary value of the wrong JS type always
// produces a non-empty issues array.
//
// Validates: Requirements 5.1, 5.2

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  booleanField,
  dateStringField,
  enumField,
  numberField,
  stringArrayField,
  stringField,
} from "./fieldKinds.ts";

const ENUM_OPTIONS = ["all", "markdown", "image", "video", "audio"] as const;

/** Arbitrary values that must always be rejected, regardless of field kind. */
const wrongTypeValues = fc.oneof(
  fc.constant(undefined),
  fc.constant(Symbol("x")),
  fc.constant({}),
  fc.array(fc.anything()),
  fc.constant(new Date()),
);

function isSuccess(result: unknown): boolean {
  const r = result as { issues?: readonly unknown[] };
  return !("issues" in r) || r.issues === undefined;
}

describe("Property 1: Field-kind validator round trip", () => {
  it("string: accepts arbitrary strings, rejects non-strings", () => {
    const validator = stringField();
    fc.assert(
      fc.property(fc.string(), (value) => {
        const result = validator["~standard"].validate(value);
        expect(isSuccess(result)).toBe(true);
      }),
      { numRuns: 200 },
    );
    fc.assert(
      fc.property(
        wrongTypeValues.filter((v) => typeof v !== "string"),
        (value) => {
          const result = validator["~standard"].validate(value);
          expect(isSuccess(result)).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("number: accepts finite numbers within min/max (or null), rejects everything else", () => {
    const validator = numberField({ min: 0, max: 20 });
    fc.assert(
      fc.property(fc.oneof(fc.integer({ min: 0, max: 20 }), fc.constant(null)), (value) => {
        const result = validator["~standard"].validate(value);
        expect(isSuccess(result)).toBe(true);
      }),
      { numRuns: 200 },
    );
    fc.assert(
      fc.property(
        fc.oneof(fc.integer({ min: 21, max: 1000 }), fc.integer({ min: -1000, max: -1 })),
        (value) => {
          const result = validator["~standard"].validate(value);
          expect(isSuccess(result)).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
    fc.assert(
      fc.property(
        wrongTypeValues.filter((v) => typeof v !== "number"),
        (value) => {
          const result = validator["~standard"].validate(value);
          expect(isSuccess(result)).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("boolean: accepts booleans, rejects everything else", () => {
    const validator = booleanField();
    fc.assert(
      fc.property(fc.boolean(), (value) => {
        expect(isSuccess(validator["~standard"].validate(value))).toBe(true);
      }),
      { numRuns: 50 },
    );
    fc.assert(
      fc.property(
        wrongTypeValues.filter((v) => typeof v !== "boolean"),
        (value) => {
          expect(isSuccess(validator["~standard"].validate(value))).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("stringArray: accepts arrays of strings, rejects everything else", () => {
    const validator = stringArrayField();
    fc.assert(
      fc.property(fc.array(fc.string()), (value) => {
        expect(isSuccess(validator["~standard"].validate(value))).toBe(true);
      }),
      { numRuns: 200 },
    );
    fc.assert(
      fc.property(fc.array(fc.oneof(fc.string(), fc.integer())), (value) => {
        const hasNonString = value.some((v) => typeof v !== "string");
        const result = validator["~standard"].validate(value);
        expect(isSuccess(result)).toBe(!hasNonString);
      }),
      { numRuns: 200 },
    );
    fc.assert(
      fc.property(
        wrongTypeValues.filter((v) => !Array.isArray(v)),
        (value) => {
          expect(isSuccess(validator["~standard"].validate(value))).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("enum: accepts declared options, rejects any other string or type", () => {
    const validator = enumField(ENUM_OPTIONS);
    fc.assert(
      fc.property(fc.constantFrom(...ENUM_OPTIONS), (value) => {
        expect(isSuccess(validator["~standard"].validate(value))).toBe(true);
      }),
      { numRuns: 50 },
    );
    fc.assert(
      fc.property(
        fc.string().filter((s) => !(ENUM_OPTIONS as readonly string[]).includes(s)),
        (value) => {
          expect(isSuccess(validator["~standard"].validate(value))).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("dateString: accepts ISO YYYY-MM-DD strings or null, rejects malformed strings", () => {
    const validator = dateStringField();
    const isoDate = fc
      .tuple(
        fc.integer({ min: 1900, max: 2100 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 }),
      )
      .map(
        ([y, m, d]) =>
          `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      );
    fc.assert(
      fc.property(fc.oneof(isoDate, fc.constant(null)), (value) => {
        expect(isSuccess(validator["~standard"].validate(value))).toBe(true);
      }),
      { numRuns: 200 },
    );
    fc.assert(
      fc.property(
        fc.string().filter((s) => !/^\d{4}-\d{2}-\d{2}$/.test(s)),
        (value) => {
          expect(isSuccess(validator["~standard"].validate(value))).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
  });
});
