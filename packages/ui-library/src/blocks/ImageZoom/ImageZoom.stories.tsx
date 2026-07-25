import type { Meta, StoryObj } from "@storybook/react";
import { ImageZoom } from "./ImageZoom.tsx";
import type { ImageZoomProps } from "./types.ts";

/* ── Helpers ──────────────────────────────────────────────── */

const SAMPLE_IMAGE = "https://picsum.photos/id/678/2000/1400";
const SAMPLE_ALT = "Aerial view of turquoise coastline";

function argsToProps(args: Record<string, unknown>): ImageZoomProps {
  return {
    src: args.src as string,
    alt: args.alt as string,
    className: args.className as string | undefined,
    imageClassName: args.imageClassName as string | undefined,
    config: {
      zoomLevel: args.zoomLevel as number,
      transitionDuration: args.transitionDuration as number,
    },
  };
}

/* ── Meta ─────────────────────────────────────────────────── */

const meta: Meta = {
  title: "Blocks/ImageZoom",
  component: ImageZoom,
  tags: [],
  decorators: [
    (Story) => (
      <div style={{ width: "600px", height: "420px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    /* ── Top-level props ── */
    src: { control: "text", description: "Image source URL." },
    alt: { control: "text", description: "Alt text for the image." },
    className: { control: "text", description: "Additional CSS class for the root container." },
    imageClassName: { control: "text", description: "Additional CSS class for the <img> element." },

    /* ── Config fields (flattened) ── */
    zoomLevel: {
      control: { type: "select" },
      options: [1.5, 2, 2.5, 3],
      description: "Zoom magnification level. Clamped to nearest supported value.",
      table: { category: "Config" },
    },
    transitionDuration: {
      control: { type: "range", min: 0, max: 2000, step: 50 },
      description: "Transition duration in milliseconds.",
      table: { category: "Config" },
    },

    /* ── Hide nested config from controls ── */
    config: { table: { disable: true } },
  },
  args: {
    src: SAMPLE_IMAGE,
    alt: SAMPLE_ALT,
    zoomLevel: 3,
    transitionDuration: 300,
  },
  render: (args) => {
    const props = argsToProps(args);
    return <ImageZoom {...props} />;
  },
};

export default meta;
type Story = StoryObj;

/* ── Stories ──────────────────────────────────────────────── */

/** Default story with sample image and all controls exposed. */
export const Default: Story = {};

/** Empty src — shows placeholder state. */
export const EmptySrc: Story = {
  args: {
    src: "",
    alt: "No image provided",
  },
};
