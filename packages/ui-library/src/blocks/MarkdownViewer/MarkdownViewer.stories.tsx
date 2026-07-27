import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { MarkdownViewer } from "./MarkdownViewer.tsx";
import type { MarkdownViewerProps } from "./types.ts";

const meta: Meta<MarkdownViewerProps> = {
  title: "Blocks/MarkdownViewer",
  component: MarkdownViewer,
  tags: [],
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "420px" }}>
        <Story />
      </div>
    ),
  ],
  args: {
    content: {
      id: "westphalia",
      markdown:
        "## Peace of Westphalia\n\nA **markdown** viewer with *GitHub-flavoured* formatting.",
      subtitle: "1648",
      tags: ["history", "europe"],
    },
    isComplete: () => false,
    onToggleComplete: fn(),
  },
};

export default meta;
type Story = StoryObj<MarkdownViewerProps>;

export const Default: Story = {};

export const EmptyContent: Story = {
  args: {
    content: { id: "missing", markdown: null },
  },
};

export const Completed: Story = {
  args: {
    isComplete: () => true,
  },
};
