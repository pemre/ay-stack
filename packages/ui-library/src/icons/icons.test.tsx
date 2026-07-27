import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";
import type { LucideProps } from "lucide-react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  GithubIcon,
  MapPinIcon,
  MoonIcon,
  PlusIcon,
  RotateCcwIcon,
  SettingsIcon,
  SunIcon,
  XIcon,
} from "./index.ts";

const icons: ComponentType<LucideProps>[] = [
  SettingsIcon,
  CopyIcon,
  XIcon,
  PlusIcon,
  MoonIcon,
  SunIcon,
  GithubIcon,
  RotateCcwIcon,
  MapPinIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
];

describe("curated icons", () => {
  it("renders every public wrapper as a decorative SVG by default", () => {
    const { container } = render(
      <>
        {icons.map((Icon, index) => (
          <Icon key={index} />
        ))}
      </>,
    );

    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(icons.length);
    for (const svg of svgs) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
    }
  });

  it("preserves explicit SVG props", () => {
    const { container } = render(
      <SettingsIcon size={24} strokeWidth={3} color="tomato" className="custom-icon" />,
    );
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "24");
    expect(svg).toHaveAttribute("stroke-width", "3");
    expect(svg).toHaveAttribute("color", "tomato");
    expect(svg).toHaveClass("custom-icon");
  });

  it("allows explicit accessible usage when requested", () => {
    const { container } = render(
      <CheckIcon aria-hidden={false} focusable="true" aria-label="Done" />,
    );
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "false");
    expect(svg).toHaveAttribute("focusable", "true");
    expect(svg).toHaveAttribute("aria-label", "Done");
  });
});
