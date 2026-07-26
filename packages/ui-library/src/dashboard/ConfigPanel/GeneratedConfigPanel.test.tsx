/**
 * Unit tests for GeneratedConfigPanel
 *
 * Tests each field kind with one scenario per field:
 * - string: renders text input, typing calls onUpdate
 * - number: renders number input with min/max, typing calls onUpdate with numeric value
 * - boolean: renders checkbox, toggling calls onUpdate
 * - stringArray: renders chips + add-tag input, adding/removing calls onUpdate
 * - enum: renders select with options, changing calls onUpdate
 * - dateString: renders date input, changing calls onUpdate
 * - multi-field: combined schema renders one control per field in declaration order
 *
 * Validates: Requirements 3.2, 3.5
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  BooleanField,
  DateStringField,
  EnumField,
  NumberField,
  OptionsSchema,
  StringArrayField,
  StringField,
} from "../schema/types.ts";
import { GeneratedConfigPanel } from "./GeneratedConfigPanel.tsx";

describe("GeneratedConfigPanel", () => {
  // ============================================================================
  // Test 1: String field renders text input; typing calls onUpdate
  // ============================================================================

  it("renders string field with text input and calls onUpdate with updated value", () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();

    const schema: OptionsSchema = [
      {
        key: "name",
        kind: "string",
        label: "Name",
        description: "Widget name",
        default: "",
      } as StringField,
    ];

    const config = { name: "Initial" };

    render(
      <GeneratedConfigPanel
        schema={schema}
        config={config}
        labels={{
          title: "Configure Widget",
          closeAriaLabel: "Close config",
        }}
        onUpdate={onUpdate}
        onClose={onClose}
      />,
    );

    // Verify title renders
    expect(screen.getByText("Configure Widget")).toBeInTheDocument();

    // Find the text input
    const input = screen.getByDisplayValue("Initial") as HTMLInputElement;
    expect(input).toHaveAttribute("type", "text");

    // Change the input value
    fireEvent.change(input, { target: { value: "Updated" } });

    // Verify onUpdate was called with the new value
    expect(onUpdate).toHaveBeenCalledWith({ name: "Updated" });
  });

  // ============================================================================
  // Test 2: Number field renders number input with min/max; typing calls onUpdate
  // ============================================================================

  it("renders number field with min/max constraints and calls onUpdate with numeric value", () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();

    const schema: OptionsSchema = [
      {
        key: "count",
        kind: "number",
        label: "Count",
        description: "Item count",
        default: 0,
        min: 0,
        max: 100,
        step: 1,
      } as NumberField,
    ];

    const config = { count: 5 };

    render(
      <GeneratedConfigPanel
        schema={schema}
        config={config}
        labels={{
          title: "Configure Widget",
          closeAriaLabel: "Close config",
        }}
        onUpdate={onUpdate}
        onClose={onClose}
      />,
    );

    // Find the number input
    const input = screen.getByDisplayValue("5") as HTMLInputElement;
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "100");

    // Change the number value
    fireEvent.change(input, { target: { value: "42" } });

    // Verify onUpdate was called with a numeric value
    expect(onUpdate).toHaveBeenCalledWith({ count: 42 });
  });

  // ============================================================================
  // Test 3: Boolean field renders checkbox; toggling calls onUpdate
  // ============================================================================

  it("renders boolean field with checkbox and calls onUpdate on toggle", () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();

    const schema: OptionsSchema = [
      {
        key: "enabled",
        kind: "boolean",
        label: "Enabled",
        description: "Enable feature",
        default: false,
      } as BooleanField,
    ];

    const config = { enabled: false };

    render(
      <GeneratedConfigPanel
        schema={schema}
        config={config}
        labels={{
          title: "Configure Widget",
          closeAriaLabel: "Close config",
        }}
        onUpdate={onUpdate}
        onClose={onClose}
      />,
    );

    // Find the checkbox
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox).not.toBeChecked();

    // Toggle the checkbox
    fireEvent.click(checkbox);

    // Verify onUpdate was called with true
    expect(onUpdate).toHaveBeenCalledWith({ enabled: true });
  });

  // ============================================================================
  // Test 4: StringArray field renders chips + add-tag input
  // ============================================================================

  it("renders stringArray field with chips and add-tag input, calls onUpdate when adding tag", () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();

    const schema: OptionsSchema = [
      {
        key: "tags",
        kind: "stringArray",
        label: "Tags",
        description: "Add tags",
        default: [],
      } as StringArrayField,
    ];

    const config = { tags: ["existing-tag"] };

    render(
      <GeneratedConfigPanel
        schema={schema}
        config={config}
        labels={{
          title: "Configure Widget",
          closeAriaLabel: "Close config",
          addTagPlaceholder: "Add a tag",
          removeTagAriaLabel: (tag) => `Remove tag ${tag}`,
        }}
        onUpdate={onUpdate}
        onClose={onClose}
      />,
    );

    // Verify existing tag is rendered as a chip
    expect(screen.getByText("existing-tag")).toBeInTheDocument();

    // Find the add-tag input
    const input = screen.getByPlaceholderText("Add a tag") as HTMLInputElement;

    // Type a new tag
    fireEvent.change(input, { target: { value: "new-tag" } });

    // Submit via Enter key
    fireEvent.keyDown(input, { key: "Enter" });

    // Verify onUpdate was called with the new tag added
    expect(onUpdate).toHaveBeenCalledWith({ tags: ["existing-tag", "new-tag"] });
  });

  it("renders stringArray field and calls onUpdate when removing a tag", () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();

    const schema: OptionsSchema = [
      {
        key: "tags",
        kind: "stringArray",
        label: "Tags",
        default: [],
      } as StringArrayField,
    ];

    const config = { tags: ["tag1", "tag2"] };

    render(
      <GeneratedConfigPanel
        schema={schema}
        config={config}
        labels={{
          title: "Configure Widget",
          closeAriaLabel: "Close config",
          removeTagAriaLabel: (tag) => `Remove tag ${tag}`,
        }}
        onUpdate={onUpdate}
        onClose={onClose}
      />,
    );

    // Find the remove buttons for tags
    const removeButtons = screen.getAllByRole("button", {
      name: /Remove tag/,
    });
    expect(removeButtons.length).toBe(2);

    // Click the remove button for the first tag
    fireEvent.click(removeButtons[0]);

    // Verify onUpdate was called with tag1 removed
    expect(onUpdate).toHaveBeenCalledWith({ tags: ["tag2"] });
  });

  // ============================================================================
  // Test 5: Enum field renders select with all options
  // ============================================================================

  it("renders enum field with select containing all options, calls onUpdate on change", () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();

    const schema: OptionsSchema = [
      {
        key: "type",
        kind: "enum",
        label: "Type",
        description: "Choose a type",
        default: "a",
        options: ["a", "b", "c"] as const,
      } as EnumField,
    ];

    const config = { type: "a" };

    render(
      <GeneratedConfigPanel
        schema={schema}
        config={config}
        labels={{
          title: "Configure Widget",
          closeAriaLabel: "Close config",
        }}
        onUpdate={onUpdate}
        onClose={onClose}
      />,
    );

    // Find the select
    const select = screen.getByDisplayValue("a") as HTMLSelectElement;

    // Verify all options are present
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue("a");
    expect(options[1]).toHaveValue("b");
    expect(options[2]).toHaveValue("c");

    // Change the select to "b"
    fireEvent.change(select, { target: { value: "b" } });

    // Verify onUpdate was called with "b"
    expect(onUpdate).toHaveBeenCalledWith({ type: "b" });
  });

  // ============================================================================
  // Test 6: DateString field renders date input
  // ============================================================================

  it("renders dateString field with date input and calls onUpdate on change", () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();

    const schema: OptionsSchema = [
      {
        key: "date",
        kind: "dateString",
        label: "Date",
        description: "Select a date",
        default: null,
      } as DateStringField,
    ];

    const config = { date: "2024-01-15" };

    render(
      <GeneratedConfigPanel
        schema={schema}
        config={config}
        labels={{
          title: "Configure Widget",
          closeAriaLabel: "Close config",
        }}
        onUpdate={onUpdate}
        onClose={onClose}
      />,
    );

    // Find the date input
    const input = screen.getByDisplayValue("2024-01-15") as HTMLInputElement;
    expect(input).toHaveAttribute("type", "date");

    // Change the date
    fireEvent.change(input, { target: { value: "2024-12-25" } });

    // Verify onUpdate was called with the new date
    expect(onUpdate).toHaveBeenCalledWith({ date: "2024-12-25" });
  });

  // ============================================================================
  // Test 7: Multi-field schema renders one control per field in declaration order
  // ============================================================================

  it("renders multi-field schema with one control per field in declaration order", () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();

    const schema: OptionsSchema = [
      {
        key: "name",
        kind: "string",
        label: "Widget Name",
        default: "",
      } as StringField,
      {
        key: "count",
        kind: "number",
        label: "Count",
        default: 0,
        min: 0,
        max: 100,
      } as NumberField,
      {
        key: "enabled",
        kind: "boolean",
        label: "Enabled",
        default: false,
      } as BooleanField,
      {
        key: "type",
        kind: "enum",
        label: "Type",
        default: "option1",
        options: ["option1", "option2"] as const,
      } as EnumField,
    ];

    const config = {
      name: "My Widget",
      count: 5,
      enabled: true,
      type: "option1",
    };

    render(
      <GeneratedConfigPanel
        schema={schema}
        config={config}
        labels={{
          title: "Multi-Field Config",
          closeAriaLabel: "Close config",
        }}
        onUpdate={onUpdate}
        onClose={onClose}
      />,
    );

    // Verify title is rendered
    expect(screen.getByText("Multi-Field Config")).toBeInTheDocument();

    // Verify all field labels are rendered in order
    const labels = screen.getAllByText(/Widget Name|Count|Enabled|Type/);
    expect(labels[0]).toHaveTextContent("Widget Name");
    expect(labels[1]).toHaveTextContent("Count");
    expect(labels[2]).toHaveTextContent("Enabled");
    expect(labels[3]).toHaveTextContent("Type");

    // Verify controls are rendered with correct initial values
    const textInput = screen.getByDisplayValue("My Widget") as HTMLInputElement;
    const numberInput = screen.getByDisplayValue("5") as HTMLInputElement;
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    const select = screen.getByDisplayValue("option1") as HTMLSelectElement;

    expect(textInput).toHaveAttribute("type", "text");
    expect(numberInput).toHaveAttribute("type", "number");
    expect(checkbox).toBeChecked();
    expect(select).toBeInTheDocument();

    // Verify typing in the text field calls onUpdate
    fireEvent.change(textInput, { target: { value: "Updated Name" } });
    expect(onUpdate).toHaveBeenCalledWith({ name: "Updated Name" });

    // Verify changing the number field calls onUpdate
    onUpdate.mockClear();
    fireEvent.change(numberInput, { target: { value: "42" } });
    expect(onUpdate).toHaveBeenCalledWith({ count: 42 });

    // Verify toggling the checkbox calls onUpdate
    onUpdate.mockClear();
    fireEvent.click(checkbox);
    expect(onUpdate).toHaveBeenCalledWith({ enabled: false });

    // Verify changing the select calls onUpdate
    onUpdate.mockClear();
    fireEvent.change(select, { target: { value: "option2" } });
    expect(onUpdate).toHaveBeenCalledWith({ type: "option2" });
  });

  // ============================================================================
  // Test 8: Panel title and close button render correctly
  // ============================================================================

  it("renders panel title and close button with correct aria labels", () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();

    const schema: OptionsSchema = [
      {
        key: "name",
        kind: "string",
        label: "Name",
        default: "",
      } as StringField,
    ];

    render(
      <GeneratedConfigPanel
        schema={schema}
        config={{}}
        labels={{
          title: "Widget Settings",
          closeAriaLabel: "Close widget settings",
        }}
        onUpdate={onUpdate}
        onClose={onClose}
      />,
    );

    // Verify title is rendered
    const title = screen.getByText("Widget Settings");
    expect(title).toBeInTheDocument();

    // Verify close button is rendered with correct aria-label
    const closeButton = screen.getByRole("button", {
      name: "Close widget settings",
    });
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveTextContent("✕");

    // Verify clicking the close button calls onClose
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  // ============================================================================
  // Test 9: StringArray field does not add duplicate tags
  // ============================================================================

  it("does not add duplicate tags to stringArray field", () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();

    const schema: OptionsSchema = [
      {
        key: "tags",
        kind: "stringArray",
        label: "Tags",
        default: [],
      } as StringArrayField,
    ];

    const config = { tags: ["existing"] };

    render(
      <GeneratedConfigPanel
        schema={schema}
        config={config}
        labels={{
          title: "Configure Widget",
          closeAriaLabel: "Close config",
          addTagPlaceholder: "Add a tag",
        }}
        onUpdate={onUpdate}
        onClose={onClose}
      />,
    );

    const input = screen.getByPlaceholderText("Add a tag") as HTMLInputElement;

    // Try to add the same tag that already exists
    fireEvent.change(input, { target: { value: "existing" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // Verify onUpdate was NOT called (duplicate prevention)
    expect(onUpdate).not.toHaveBeenCalled();
  });

  // ============================================================================
  // Test 10: StringArray field trims whitespace from tags
  // ============================================================================

  it("trims whitespace from stringArray tags before adding", () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();

    const schema: OptionsSchema = [
      {
        key: "tags",
        kind: "stringArray",
        label: "Tags",
        default: [],
      } as StringArrayField,
    ];

    const config = { tags: [] };

    render(
      <GeneratedConfigPanel
        schema={schema}
        config={config}
        labels={{
          title: "Configure Widget",
          closeAriaLabel: "Close config",
          addTagPlaceholder: "Add a tag",
        }}
        onUpdate={onUpdate}
        onClose={onClose}
      />,
    );

    const input = screen.getByPlaceholderText("Add a tag") as HTMLInputElement;

    // Type a tag with leading/trailing whitespace
    fireEvent.change(input, { target: { value: "   new-tag   " } });
    fireEvent.keyDown(input, { key: "Enter" });

    // Verify onUpdate was called with trimmed tag
    expect(onUpdate).toHaveBeenCalledWith({ tags: ["new-tag"] });
  });

  // ============================================================================
  // Test 11: Field descriptions are rendered
  // ============================================================================

  it("renders field descriptions when provided", () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();

    const schema: OptionsSchema = [
      {
        key: "name",
        kind: "string",
        label: "Name",
        description: "The name of the widget",
        default: "",
      } as StringField,
    ];

    render(
      <GeneratedConfigPanel
        schema={schema}
        config={{}}
        labels={{
          title: "Configure Widget",
          closeAriaLabel: "Close config",
        }}
        onUpdate={onUpdate}
        onClose={onClose}
      />,
    );

    // Verify description is rendered
    expect(screen.getByText("The name of the widget")).toBeInTheDocument();
  });

  // ============================================================================
  // Test 12: Empty string config values are handled correctly
  // ============================================================================

  it("handles empty config values for optional fields", () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();

    const schema: OptionsSchema = [
      {
        key: "name",
        kind: "string",
        label: "Name",
        default: "",
      } as StringField,
    ];

    const config = {}; // name field is missing

    render(
      <GeneratedConfigPanel
        schema={schema}
        config={config}
        labels={{
          title: "Configure Widget",
          closeAriaLabel: "Close config",
        }}
        onUpdate={onUpdate}
        onClose={onClose}
      />,
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).toHaveValue("");

    // Type a value
    fireEvent.change(input, { target: { value: "test" } });
    expect(onUpdate).toHaveBeenCalledWith({ name: "test" });
  });

  // ============================================================================
  // Test 13: DateString field clears properly
  // ============================================================================

  it("can clear dateString field by removing the date", () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();

    const schema: OptionsSchema = [
      {
        key: "date",
        kind: "dateString",
        label: "Date",
        default: null,
      } as DateStringField,
    ];

    const config = { date: "2024-01-15" };

    render(
      <GeneratedConfigPanel
        schema={schema}
        config={config}
        labels={{
          title: "Configure Widget",
          closeAriaLabel: "Close config",
        }}
        onUpdate={onUpdate}
        onClose={onClose}
      />,
    );

    const input = screen.getByDisplayValue("2024-01-15") as HTMLInputElement;

    // Clear the date input
    fireEvent.change(input, { target: { value: "" } });

    // Verify onUpdate was called with null
    expect(onUpdate).toHaveBeenCalledWith({ date: null });
  });
});
