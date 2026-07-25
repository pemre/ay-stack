/**
 * Presentational control for number field kind.
 * Renders a number input with optional min/max constraints.
 */

import type { NumberField } from "../../schema/types.ts";

export interface NumberFieldControlProps {
  field: NumberField;
  value: unknown;
  onChange: (newValue: unknown) => void;
}

export function NumberFieldControl({ field, value, onChange }: NumberFieldControlProps) {
  const numValue = typeof value === "number" ? value : (field.default ?? "");

  return (
    <label className="config-panel__field">
      <span className="config-panel__label">{field.label}</span>
      {field.description && <span className="config-panel__description">{field.description}</span>}
      <input
        type="number"
        className="config-panel__input"
        value={numValue}
        onChange={(e) => {
          const val = e.target.value === "" ? null : Number(e.target.value);
          onChange(val);
        }}
        min={field.min}
        max={field.max}
        step={field.step ?? "any"}
      />
    </label>
  );
}
