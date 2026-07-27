import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ExternalLink, Plus } from "lucide-react";
import type { ButtonProps } from "./Button.tsx";
import { Button } from "./Button.tsx";

const meta: Meta<ButtonProps> = {
  title: "Primitives/Button",
  component: Button,
  args: {
    "aria-label": "Add item",
    children: "Add item",
    onClick: fn(),
    variant: "text",
  },
  argTypes: {
    variant: {
      control: "radio",
      options: ["icon", "text"],
    },
    children: { control: false },
    href: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<ButtonProps>;

export const Text: Story = {};

export const Icon: Story = {
  args: {
    "aria-label": "Add item",
    children: <Plus aria-hidden="true" size={16} />,
    title: "Add item",
    variant: "icon",
  },
};

export const Link: Story = {
  args: {
    "aria-label": "View documentation",
    children: (
      <>
        View documentation <ExternalLink aria-hidden="true" size={14} />
      </>
    ),
    href: "https://storybook.js.org/docs",
    rel: "noreferrer",
    target: "_blank",
    variant: "text",
  },
};

export const DisabledButton: Story = {
  args: {
    "aria-label": "Add item",
    children: "Add item",
    disabled: true,
    variant: "text",
  },
};

export const DisabledLink: Story = {
  args: {
    "aria-label": "View documentation",
    children: "View documentation",
    disabled: true,
    href: "https://storybook.js.org/docs",
    variant: "text",
  },
};
