import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "../../hooks/useTheme.tsx";
import ThemeToggle from "./ThemeToggle.tsx";

function renderWithTheme(theme: "light" | "dark" = "light") {
  // Seed localStorage so ThemeProvider picks the desired theme
  localStorage.setItem("theme", theme);
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Req 5.1 — renders using Button primitive with btn and btn--icon classes
  it("renders with btn and btn--icon classes", () => {
    renderWithTheme();
    const el = screen.getByRole("button", { name: "theme.toggle" });
    expect(el.className).toContain("btn");
    expect(el.className).toContain("btn--icon");
  });

  // Req 5.2 — passes aria-label and title through to Button
  it("has correct aria-label and title", () => {
    renderWithTheme();
    const el = screen.getByRole("button", { name: "theme.toggle" });
    expect(el).toHaveAttribute("aria-label", "theme.toggle");
    expect(el).toHaveAttribute("title", "theme.toggle");
  });

  // Req 5.3 — shows Sun icon in dark mode, Moon icon in light mode
  it("shows Moon icon in light mode", () => {
    renderWithTheme("light");
    const btn = screen.getByRole("button", { name: "theme.toggle" });
    // Moon icon is rendered in light mode
    const svg = btn.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("shows Sun icon in dark mode", () => {
    renderWithTheme("dark");
    const btn = screen.getByRole("button", { name: "theme.toggle" });
    const svg = btn.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  // Req 5.3 — icon switches on toggle
  it("switches icon when clicked", () => {
    renderWithTheme("light");
    const btn = screen.getByRole("button", { name: "theme.toggle" });
    const svgBefore = btn.querySelector("svg")?.innerHTML;

    fireEvent.click(btn);

    const svgAfter = btn.querySelector("svg")?.innerHTML;
    expect(svgAfter).not.toBe(svgBefore);
  });

  // Req 5.1 — renders as a <button> element (not an anchor)
  it("renders a <button> element", () => {
    renderWithTheme();
    const el = screen.getByRole("button", { name: "theme.toggle" });
    expect(el.tagName).toBe("BUTTON");
    expect(el).toHaveAttribute("type", "button");
  });
});
