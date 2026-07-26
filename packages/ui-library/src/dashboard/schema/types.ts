/**
 * The options-schema system: a declarative list of field descriptors attached
 * to a widget type, used both to validate a widget's persisted `config` and to
 * generate its config panel UI (Requirements 2, 3).
 */

export type FieldKind = "string" | "number" | "boolean" | "stringArray" | "enum" | "dateString";

interface BaseField<K extends FieldKind, V> {
  key: string;
  kind: K;
  label: string;
  description?: string;
  default: V;
}

export type StringField = BaseField<"string", string> & {
  placeholder?: string;
};

export type NumberField = BaseField<"number", number | null> & {
  min?: number;
  max?: number;
  step?: number;
};

export type BooleanField = BaseField<"boolean", boolean>;

export type StringArrayField = BaseField<"stringArray", string[]> & {
  itemPlaceholder?: string;
};

export type EnumField<T extends string = string> = BaseField<"enum", T> & {
  options: readonly T[];
};

export type DateStringField = BaseField<"dateString", string | null>;

export type FieldDescriptor =
  | StringField
  | NumberField
  | BooleanField
  | StringArrayField
  | EnumField
  | DateStringField;

/** An ordered list of field descriptors describing a widget type's configurable fields. */
export type OptionsSchema = readonly FieldDescriptor[];
