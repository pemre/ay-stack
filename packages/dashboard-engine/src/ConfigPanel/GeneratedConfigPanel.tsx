/**
 * Generated config panel: maps an OptionsSchema to field controls,
 * renders one control per field descriptor, calls onUpdate() with a partial config
 * on each change.
 *
 * All strings come from the `labels` prop and field descriptors — no useTranslation()
 * inside this component or its field controls.
 *
 * Requirement 3: Config panels generated from the options schema
 */

import type { FieldDescriptor, OptionsSchema } from "../schema/types.ts";
import {
  BooleanFieldControl,
  DateStringFieldControl,
  EnumFieldControl,
  NumberFieldControl,
  StringArrayFieldControl,
  StringFieldControl,
} from "./fields/index.ts";
import "./configPanels.css";

export interface GeneratedConfigPanelLabels {
  title: string;
  closeAriaLabel: string;
  addTagPlaceholder?: string; // stringArray control
  removeTagAriaLabel?: (tag: string) => string;
}

export interface GeneratedConfigPanelProps {
  schema: OptionsSchema;
  config: Record<string, unknown>;
  labels: GeneratedConfigPanelLabels;
  onUpdate: (partial: Record<string, unknown>) => void;
  onClose: () => void;
}

/**
 * Renders a config panel from a schema.
 * Maps each field descriptor to its corresponding control component.
 * Calls onUpdate() with { [field.key]: newValue } on each change.
 */
export function GeneratedConfigPanel({
  schema,
  config,
  labels,
  onUpdate,
  onClose,
}: GeneratedConfigPanelProps): JSX.Element {
  const renderField = (field: FieldDescriptor): JSX.Element => {
    const value = config[field.key];

    const handleChange = (newValue: unknown) => {
      onUpdate({ [field.key]: newValue });
    };

    switch (field.kind) {
      case "string":
        return (
          <StringFieldControl key={field.key} field={field} value={value} onChange={handleChange} />
        );

      case "number":
        return (
          <NumberFieldControl key={field.key} field={field} value={value} onChange={handleChange} />
        );

      case "boolean":
        return (
          <BooleanFieldControl
            key={field.key}
            field={field}
            value={value}
            onChange={handleChange}
          />
        );

      case "stringArray":
        return (
          <StringArrayFieldControl
            key={field.key}
            field={field}
            value={value}
            onChange={handleChange}
            labels={{
              addTagPlaceholder: labels.addTagPlaceholder,
              removeTagAriaLabel: labels.removeTagAriaLabel,
            }}
          />
        );

      case "enum":
        return (
          <EnumFieldControl key={field.key} field={field} value={value} onChange={handleChange} />
        );

      case "dateString":
        return (
          <DateStringFieldControl
            key={field.key}
            field={field}
            value={value}
            onChange={handleChange}
          />
        );

      // Exhaustiveness check: if a new kind is added, TypeScript will error here
      default: {
        const _exhaustive: never = field;
        return _exhaustive;
      }
    }
  };

  return (
    <div className="generated-config-panel">
      <header className="generated-config-panel__header">
        <h2 className="generated-config-panel__title">{labels.title}</h2>
        <button
          className="generated-config-panel__close-button"
          onClick={onClose}
          aria-label={labels.closeAriaLabel}
          type="button"
        >
          ✕
        </button>
      </header>
      <div className="generated-config-panel__fields">{schema.map(renderField)}</div>
    </div>
  );
}
