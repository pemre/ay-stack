/**
 * Presentational control for stringArray field kind.
 * Renders a tag/chip editor with an add-tag input.
 */

import type { KeyboardEvent, ReactNode } from "react";
import { useState } from "react";
import { XIcon } from "../../../icons/index.ts";
import type { StringArrayField } from "../../schema/types.ts";

export interface StringArrayFieldControlLabels {
  addTagPlaceholder?: string;
  removeTagAriaLabel?: (tag: string) => string;
}

export interface StringArrayFieldControlProps {
  field: StringArrayField;
  value: unknown;
  onChange: (newValue: unknown) => void;
  labels?: StringArrayFieldControlLabels;
  removeIcon?: (tag: string) => ReactNode;
}

export function StringArrayFieldControl({
  field,
  value,
  onChange,
  labels,
  removeIcon,
}: StringArrayFieldControlProps) {
  const items = Array.isArray(value) ? value : [];
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !items.includes(tag)) {
      onChange([...items, tag]);
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tag: string) => {
    onChange(items.filter((t) => t !== tag));
  };

  const getRemoveAriaLabel = (tag: string): string => {
    return labels?.removeTagAriaLabel ? labels.removeTagAriaLabel(tag) : `Remove tag ${tag}`;
  };

  return (
    <div className="config-panel__field">
      <span className="config-panel__label">{field.label}</span>
      {field.description && <span className="config-panel__description">{field.description}</span>}
      {items.length > 0 && (
        <div className="config-panel__tags">
          {items.map((tag) => (
            <span key={tag} className="config-panel__chip">
              {tag}
              <button
                type="button"
                className="config-panel__chip-remove"
                aria-label={getRemoveAriaLabel(tag)}
                onClick={() => handleRemoveTag(tag)}
              >
                {removeIcon?.(tag) ?? <XIcon size={10} />}
              </button>
            </span>
          ))}
        </div>
      )}
      <label>
        <span className="config-panel__label config-panel__label--sr">{`Add ${field.label}`}</span>
        <input
          type="text"
          className="config-panel__input"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onBlur={handleAddTag}
          placeholder={labels?.addTagPlaceholder ?? field.itemPlaceholder}
        />
      </label>
    </div>
  );
}
