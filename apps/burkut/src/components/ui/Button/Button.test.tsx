import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button.tsx";

describe("Button", () => {
  // Req 12.1
  it("renders a <button type='button'> by default", () => {
    render(<Button aria-label="test">Click</Button>);
    const el = screen.getByRole("button", { name: "test" });
    expect(el.tagName).toBe("BUTTON");
    expect(el).toHaveAttribute("type", "button");
  });

  // Req 12.2
  it("applies btn--icon class for icon variant (default)", () => {
    render(<Button aria-label="icon">Icon</Button>);
    const el = screen.getByRole("button", { name: "icon" });
    expect(el.className).toContain("btn");
    expect(el.className).toContain("btn--icon");
  });

  // Req 12.3
  it("applies btn--text class for text variant", () => {
    render(
      <Button variant="text" aria-label="text">
        Text
      </Button>,
    );
    const el = screen.getByRole("button", { name: "text" });
    expect(el.className).toContain("btn");
    expect(el.className).toContain("btn--text");
  });

  // Req 12.4
  it("forwards aria-label, title, aria-expanded, aria-pressed, and disabled", () => {
    render(
      <Button
        aria-label="my-label"
        title="my-title"
        aria-expanded={true}
        aria-pressed={true}
        disabled
      >
        Props
      </Button>,
    );
    const el = screen.getByRole("button", { name: "my-label" });
    expect(el).toHaveAttribute("aria-label", "my-label");
    expect(el).toHaveAttribute("title", "my-title");
    expect(el).toHaveAttribute("aria-expanded", "true");
    expect(el).toHaveAttribute("aria-pressed", "true");
    expect(el).toBeDisabled();
  });

  // Req 12.5
  it("renders an <a> element when href is provided", () => {
    render(
      <Button href="https://example.com" aria-label="link">
        Link
      </Button>,
    );
    const el = screen.getByRole("link", { name: "link" });
    expect(el.tagName).toBe("A");
    expect(el).toHaveAttribute("href", "https://example.com");
  });

  // Req 12.6
  it("fires onClick when clicked", () => {
    const handler = vi.fn();
    render(
      <Button onClick={handler} aria-label="click-me">
        Click
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "click-me" }));
    expect(handler).toHaveBeenCalledOnce();
  });

  // Req 12.7
  it("does not fire onClick when disabled (button)", () => {
    const handler = vi.fn();
    render(
      <Button onClick={handler} disabled aria-label="disabled-btn">
        Disabled
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "disabled-btn" }));
    expect(handler).not.toHaveBeenCalled();
  });

  // Req 12.7 (anchor variant)
  it("does not fire onClick when disabled (anchor)", () => {
    const handler = vi.fn();
    render(
      <Button href="https://example.com" disabled onClick={handler} aria-label="disabled-link">
        Disabled Link
      </Button>,
    );
    const el = screen.getByRole("link", { name: "disabled-link" });
    expect(el).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(el);
    expect(handler).not.toHaveBeenCalled();
  });

  it("merges className with internal classes", () => {
    render(
      <Button className="custom-class" aria-label="merge">
        Merge
      </Button>,
    );
    const el = screen.getByRole("button", { name: "merge" });
    expect(el.className).toContain("btn");
    expect(el.className).toContain("btn--icon");
    expect(el.className).toContain("custom-class");
  });

  it("renders children", () => {
    render(<Button aria-label="children-test">Hello World</Button>);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });
});
