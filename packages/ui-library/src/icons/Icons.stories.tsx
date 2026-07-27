import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentType } from "react";
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

interface IconGalleryArgs extends LucideProps {
  iconSize: number;
}

const icons: Array<{ name: string; Icon: ComponentType<LucideProps> }> = [
  { name: "SettingsIcon", Icon: SettingsIcon },
  { name: "CopyIcon", Icon: CopyIcon },
  { name: "XIcon", Icon: XIcon },
  { name: "PlusIcon", Icon: PlusIcon },
  { name: "MoonIcon", Icon: MoonIcon },
  { name: "SunIcon", Icon: SunIcon },
  { name: "GithubIcon", Icon: GithubIcon },
  { name: "RotateCcwIcon", Icon: RotateCcwIcon },
  { name: "MapPinIcon", Icon: MapPinIcon },
  { name: "CheckIcon", Icon: CheckIcon },
  { name: "ChevronDownIcon", Icon: ChevronDownIcon },
  { name: "ChevronRightIcon", Icon: ChevronRightIcon },
];

const meta: Meta<IconGalleryArgs> = {
  title: "Icons/Curated API",
  tags: ["autodocs"],
  argTypes: {
    iconSize: {
      control: { type: "range", min: 12, max: 48, step: 2 },
      name: "size",
    },
    color: { control: "color" },
    strokeWidth: { control: { type: "range", min: 1, max: 4, step: 0.25 } },
    className: { control: "text" },
    children: { control: false },
  },
  args: {
    iconSize: 24,
    strokeWidth: 2,
    color: "currentColor",
    className: "",
  },
  render: ({ iconSize, ...props }) => (
    <div
      style={{
        display: "grid",
        gap: "1.5rem",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        padding: "1rem",
      }}
    >
      {icons.map(({ name, Icon }) => (
        <div
          key={name}
          style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <Icon {...props} size={iconSize} />
          <code>{name}</code>
        </div>
      ))}
    </div>
  ),
};

export default meta;
type Story = StoryObj<IconGalleryArgs>;

export const Gallery: Story = {};

export const InLabelledButton: Story = {
  render: ({ iconSize, ...props }) => (
    <button type="button" aria-label="Configure widget">
      <SettingsIcon {...props} size={iconSize} />
    </button>
  ),
};
