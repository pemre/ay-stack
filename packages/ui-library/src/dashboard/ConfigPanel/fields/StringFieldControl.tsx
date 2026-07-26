/**
 * Presentational control for string field kind.
 * Renders a text input and calls onChange on value change.
 */

import type { StringField } from "../../schema/types.ts";

export interface StringFieldControlProps {
  field: StringField;
  value: unknown;
  onChange: (newValue: unknown) => void;
}

export function StringFieldControl({ field, value, onChange }: StringFieldControlProps) {
  const stringValue = typeof value === "string" ? value : "";

  return (
    <label className="config-panel__field">
      <span className="config-panel__label">{field.label}</span>
      {field.description && <span className="config-panel__description">{field.description}</span>}
      <input
        type="text"
        className="config-panel__input"
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    </label>
  );
}
