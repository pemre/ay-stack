import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { LinearTimeline } from "./LinearTimeline.tsx";
import type { LinearTimelineProps } from "./types.ts";

const items: LinearTimelineProps["items"] = [
  {
    id: "westphalia",
    content: "Peace of Westphalia",
    start: "1648-01-01",
    end: "1648-12-31",
    group: "History",
    className: "",
    type: "range",
  },
  {
    id: "moon-landing",
    content: "Moon landing",
    start: "1969-07-20",
    end: "1969-07-21",
    group: "Science",
    className: "",
    type: "range",
  },
  {
    id: "streaming",
    content: "Streaming revolution",
    start: "2020-01-01",
    end: "2022-12-31",
    group: "Cinema",
    className: "",
    type: "range",
  },
];

const meta: Meta<LinearTimelineProps> = {
  title: "Blocks/LinearTimeline",
  component: LinearTimeline,
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "420px" }}>
        <Story />
      </div>
    ),
  ],
  args: {
    items,
    selectedId: null,
    hiddenGroups: new Set(),
    onSelect: fn(),
  },
};

export default meta;
type Story = StoryObj<LinearTimelineProps>;

export const Default: Story = {};

export const SelectedItem: Story = {
  args: {
    selectedId: "moon-landing",
  },
};

export const HiddenGroup: Story = {
  args: {
    hiddenGroups: new Set(["Cinema"]),
  },
};

export const CustomDateBounds: Story = {
  args: {
    config: {
      minDate: "1600-01-01",
      maxDate: "2050-01-01",
      labels: { ariaLabel: "Historical events timeline" },
    },
  },
};
