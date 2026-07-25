/**
 * Presentational control for enum field kind.
 * Renders a select dropdown with enum options.
 */

import type { EnumField } from "../../schema/types.ts";

export interface EnumFieldControlProps {
  field: EnumField;
  value: unknown;
  onChange: (newValue: unknown) => void;
}

export function EnumFieldControl({ field, value, onChange }: EnumFieldControlProps) {
  const stringValue = typeof value === "string" ? value : String(field.default ?? "");

  return (
    <label className="config-panel__field">
      <span className="config-panel__label">{field.label}</span>
      {field.description && <span className="config-panel__description">{field.description}</span>}
      <select
        className="config-panel__select"
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
      >
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
