/**
 * Presentational control for boolean field kind.
 * Renders a checkbox and calls onChange on toggle.
 */

import type { BooleanField } from "../../schema/types.ts";

export interface BooleanFieldControlProps {
  field: BooleanField;
  value: unknown;
  onChange: (newValue: unknown) => void;
}

export function BooleanFieldControl({ field, value, onChange }: BooleanFieldControlProps) {
  const boolValue = typeof value === "boolean" ? value : false;

  return (
    <label className="config-panel__field config-panel__field--checkbox">
      <input
        type="checkbox"
        className="config-panel__checkbox"
        checked={boolValue}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="config-panel__label">{field.label}</span>
      {field.description && <span className="config-panel__description">{field.description}</span>}
    </label>
  );
}
