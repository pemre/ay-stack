/**
 * Presentational control for dateString field kind.
 * Renders a date input.
 */

import type { DateStringField } from "../../schema/types.ts";

export interface DateStringFieldControlProps {
  field: DateStringField;
  value: unknown;
  onChange: (newValue: unknown) => void;
}

export function DateStringFieldControl({ field, value, onChange }: DateStringFieldControlProps) {
  const dateValue = typeof value === "string" ? value : "";

  return (
    <label className="config-panel__field">
      <span className="config-panel__label">{field.label}</span>
      {field.description && <span className="config-panel__description">{field.description}</span>}
      <input
        type="date"
        className="config-panel__input"
        value={dateValue}
        onChange={(e) => onChange(e.target.value || null)}
      />
    </label>
  );
}
