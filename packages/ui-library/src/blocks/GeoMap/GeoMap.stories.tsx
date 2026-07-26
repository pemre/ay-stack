import type { Meta, StoryObj } from "@storybook/react";
import { GeoMap } from "./GeoMap.tsx";
import type { GeoFeature, GeoMapProps } from "./types.ts";

const features: GeoFeature[] = [
  {
    id: "anyang",
    label: "Yinxu (Anyang)",
    title: "Shang Dynasty",
    lat: 36.1,
    lng: 114.3,
  },
  {
    id: "beijing",
    label: "Beijing",
    title: "Beijing",
    lat: 39.9042,
    lng: 116.4074,
  },
];

const meta: Meta<GeoMapProps> = {
  title: "Blocks/GeoMap",
  component: GeoMap,
  decorators: [
    (Story) => (
      <div style={{ width: "720px", height: "480px" }}>
        <Story />
      </div>
    ),
  ],
  args: {
    selectedId: "anyang",
    features,
  },
};

export default meta;
type Story = StoryObj<GeoMapProps>;

export const Default: Story = {};

export const NoSelection: Story = {
  args: {
    selectedId: null,
  },
};
