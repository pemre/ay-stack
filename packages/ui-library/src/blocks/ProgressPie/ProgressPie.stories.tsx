import type { Meta, StoryObj } from "@storybook/react";
import ProgressPie from "./ProgressPie.tsx";
import type { ProgressPieProps } from "./ProgressPie.tsx";

const meta: Meta<ProgressPieProps> = {
  title: "Blocks/ProgressPie",
  component: ProgressPie,
  tags: ["autodocs"],
  argTypes: {
    percentage: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
    size: {
      control: { type: "range", min: 20, max: 96, step: 4 },
    },
    label: { control: "text" },
  },
  args: {
    percentage: 68,
    size: 48,
    label: "Reading progress",
  },
};

export default meta;
type Story = StoryObj<ProgressPieProps>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    percentage: 0,
  },
};

export const Complete: Story = {
  args: {
    percentage: 100,
  },
};

export const Large: Story = {
  args: {
    percentage: 42,
    size: 80,
  },
};
