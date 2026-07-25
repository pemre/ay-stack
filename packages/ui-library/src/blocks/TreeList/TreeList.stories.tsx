import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { TreeList } from "./TreeList.tsx";
import type { TreeListProps, TreeNode } from "./types.ts";

const sampleTree: TreeNode[] = [
  {
    id: "History",
    label: "History",
    children: [
      { id: "ancient", label: "Ancient period", isSubheading: true },
      { id: "xia", label: "Xia Dynasty", completed: true },
      { id: "shang", label: "Shang Dynasty" },
    ],
  },
  {
    id: "Literature",
    label: "Literature",
    children: [{ id: "writing", label: "Origins of Writing" }],
  },
  { id: "Cinema", label: "Cinema", children: [] },
];

const meta: Meta<TreeListProps> = {
  title: "Blocks/TreeList",
  component: TreeList,
  tags: [],
  decorators: [
    (Story) => (
      <div style={{ width: "320px", height: "420px" }}>
        <Story />
      </div>
    ),
  ],
  args: {
    tree: sampleTree,
    selectedId: "xia",
    activeGroup: "History",
    onSelectItem: fn(),
    onSelectGroup: fn(),
  },
  argTypes: {
    tree: { control: false },
    selectedId: { control: "text" },
    activeGroup: { control: "text" },
    config: { control: false },
  },
};

export default meta;
type Story = StoryObj<TreeListProps>;

export const Default: Story = {};

export const EmptyGroups: Story = {
  args: {
    tree: [
      { id: "History", label: "History", children: [] },
      { id: "Literature", label: "Literature", children: [] },
    ],
    selectedId: null,
    activeGroup: "History",
  },
};

export const CustomAriaLabel: Story = {
  args: {
    config: { labels: { ariaLabel: "Content library" } },
  },
};
