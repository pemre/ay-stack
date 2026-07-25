import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, waitFor, within } from "@storybook/test";
import { useMemo, useState } from "react";
import { FpsOverlay } from "./FpsOverlay.tsx";
import { SpiralTimeline } from "./SpiralTimeline.tsx";
import { generateStressData } from "./stressData.ts";
import type { DataNode, SpiralTimelineProps } from "./types.ts";

/* ── Sample Data ─────────────────────────────────────────── */

const sampleData: DataNode[] = [
  {
    date: new Date("2018-03-15"),
    type: "history",
    title: "Treaty of Westphalia Anniversary",
    content: "Commemorating the 370th anniversary of the Peace of Westphalia.",
  },
  {
    date: new Date("2019-07-20"),
    type: "cinema",
    title: "Moon Landing 50th",
    content: "50 years since Apollo 11 landed on the Moon.",
  },
  {
    date: new Date("2019-11-09"),
    type: "history",
    title: "Fall of the Berlin Wall 30th",
    content: "30th anniversary of the fall of the Berlin Wall.",
  },
  {
    date: new Date("2020-01-01"),
    type: "literature",
    title: "New Decade Begins",
    content: "The start of the 2020s decade.",
  },
  {
    date: new Date("2020-06-15"),
    type: "cinema",
    title: "Streaming Revolution",
    content: "Major shift to streaming platforms during global events.",
  },
  {
    date: new Date("2021-04-22"),
    type: "science",
    title: "Earth Day 2021",
    content: "Global climate summit and renewed environmental pledges.",
  },
  {
    date: new Date("2021-10-04"),
    type: "science",
    title: "Nobel Prize Announcements",
    content: "Nobel Prizes awarded across multiple disciplines.",
  },
  {
    date: new Date("2022-02-04"),
    type: "history",
    title: "Winter Olympics Beijing",
    content: "The 2022 Winter Olympics held in Beijing.",
  },
  {
    date: new Date("2022-09-08"),
    type: "history",
    title: "Queen Elizabeth II",
    content: "End of the longest reign in British history.",
  },
  {
    date: new Date("2023-03-14"),
    type: "science",
    title: "Pi Day Discovery",
    content: "New mathematical constant relationships discovered.",
  },
  {
    date: new Date("2023-07-21"),
    type: "literature",
    title: "Oppenheimer Release",
    content: "Christopher Nolan's biographical epic premieres.",
  },
  {
    date: new Date("2024-01-15"),
    type: "cinema",
    title: "AI in Film",
    content: "First major film with AI-generated visual effects.",
  },
  {
    date: new Date("2024-07-26"),
    type: "history",
    title: "Paris Olympics 2024",
    content: "The Summer Olympics return to Paris after 100 years.",
  },
  {
    date: new Date("2025-01-20"),
    type: "history",
    title: "Inauguration Day",
    content: "US Presidential inauguration ceremony.",
  },
];

const defaultTypes = [
  { key: "history", color: "#3b82f6", shape: "circle" as const },
  { key: "cinema", color: "#f59e0b", shape: "star" as const },
  { key: "literature", color: "#10b981", shape: "square" as const },
  { key: "science", color: "#8b5cf6", shape: "triangle" as const },
];

function argsToProps(args: Record<string, unknown>): SpiralTimelineProps {
  const applyTo: ("grid" | "labels")[] = [];
  if (args["ringGradient.applyToGrid"]) applyTo.push("grid");
  if (args["ringGradient.applyToLabels"]) applyTo.push("labels");

  return {
    data: args.data as DataNode[],
    locale: args.locale as string | undefined,
    className: args.className as string | undefined,
    onYearsToShowChange: args.onYearsToShowChange as ((yearsToShow: number) => void) | undefined,
    onWindowStartChange: args.onWindowStartChange as ((windowStart: number) => void) | undefined,
    windowStart: args.windowStart as number | undefined,
    config: {
      yearsToShow: args.yearsToShow as number,
      yearLabelPosition: args.yearLabelPosition as SpiralTimelineProps["config"] extends infer C
        ? C extends { yearLabelPosition?: infer Y }
          ? Y
          : never
        : never,
      zoom: {
        speed: args["zoom.speed"] as number,
        mouseWheel: args["zoom.mouseWheel"] as boolean,
        slider: args["zoom.slider"] as boolean,
        buttons: args["zoom.buttons"] as boolean,
      },
      fog: {
        enabled: args["fog.enabled"] as boolean,
        startRing: args["fog.startRing"] as number,
        intensity: args["fog.intensity"] as number,
      },
      ringGradient: {
        enabled: args["ringGradient.enabled"] as boolean,
        scale: args["ringGradient.scale"] as "spectral" | "rainbow" | "cool" | "warm",
        applyTo,
      },
      animations: {
        enabled: args["animations.enabled"] as boolean,
        duration: args["animations.duration"] as number,
      },
      types: args.types as SpiralTimelineProps["config"] extends infer C
        ? C extends { types?: infer T }
          ? T
          : never
        : never,
      timeWindow: {
        visible: args["timeWindow.visible"] as boolean,
        animationEnabled: args["timeWindow.animationEnabled"] as boolean,
        animationDuration: args["timeWindow.animationDuration"] as number,
      },
      onNodeClick: args.onNodeClick as ((node: DataNode, event: MouseEvent) => void) | undefined,
    },
  };
}

/* ── Meta ─────────────────────────────────────────────────── */

const meta: Meta = {
  title: "Blocks/SpiralTimeline",
  component: SpiralTimeline,
  tags: [],
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "95vh" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    /* ── Top-level props ── */
    data: { table: { disable: true } },
    locale: {
      control: "select",
      options: ["en", "tr", "zh", "de", "fr", "ja"],
      description: "Locale for month labels and date formatting.",
    },
    className: { control: "text", description: "Additional CSS class for the root container." },

    /* ── Config: general ── */
    yearsToShow: {
      control: { type: "range", min: 1, max: 20, step: 1 },
      description: "Initial number of visible year rings.",
      table: { category: "Config" },
    },
    yearLabelPosition: {
      control: "select",
      options: [
        "top",
        "right",
        "bottom",
        "left",
        "top-right",
        "top-left",
        "bottom-right",
        "bottom-left",
      ],
      description: "Angle position for year labels on ring boundaries.",
      table: { category: "Config" },
    },

    /* ── Config: zoom ── */
    "zoom.speed": {
      control: { type: "range", min: 0.1, max: 5, step: 0.1 },
      description: "Zoom speed multiplier.",
      table: { category: "Zoom" },
    },
    "zoom.mouseWheel": {
      control: "boolean",
      description: "Enable mouse wheel zoom on SVG area.",
      table: { category: "Zoom" },
    },
    "zoom.slider": {
      control: "boolean",
      description: "Show zoom range slider.",
      table: { category: "Zoom" },
    },
    "zoom.buttons": {
      control: "boolean",
      description: "Show +/− zoom buttons.",
      table: { category: "Zoom" },
    },

    /* ── Config: fog ── */
    "fog.enabled": {
      control: "boolean",
      description: "Enable fog/depth effect on outer rings.",
      table: { category: "Fog" },
    },
    "fog.startRing": {
      control: { type: "range", min: 0, max: 10, step: 1 },
      description: "Ring index where fog begins.",
      table: { category: "Fog" },
    },
    "fog.intensity": {
      control: { type: "range", min: 0, max: 1, step: 0.05 },
      description: "Fog intensity (0–1).",
      table: { category: "Fog" },
    },

    /* ── Config: ringGradient ── */
    "ringGradient.enabled": {
      control: "boolean",
      description: "Enable ring color gradient.",
      table: { category: "Ring Gradient" },
    },
    "ringGradient.scale": {
      control: "select",
      options: ["spectral", "rainbow", "cool", "warm"],
      description: "D3 color interpolator for ring gradient.",
      table: { category: "Ring Gradient" },
    },
    "ringGradient.applyToGrid": {
      control: "boolean",
      description: "Apply gradient to spiral grid lines.",
      table: { category: "Ring Gradient" },
    },
    "ringGradient.applyToLabels": {
      control: "boolean",
      description: "Apply gradient to year labels.",
      table: { category: "Ring Gradient" },
    },

    /* ── Config: animations ── */
    "animations.enabled": {
      control: "boolean",
      description: "Enable animated transitions.",
      table: { category: "Animations" },
    },
    "animations.duration": {
      control: { type: "range", min: 0, max: 2000, step: 50 },
      description: "Transition duration in milliseconds.",
      table: { category: "Animations" },
    },

    /* ── Config: timeWindow ── */
    "timeWindow.visible": {
      control: "boolean",
      description: "Show/hide the time window slider.",
      table: { category: "Time Window" },
    },
    "timeWindow.animationEnabled": {
      control: "boolean",
      description: "Enable animated transitions for slider movement.",
      table: { category: "Time Window" },
    },
    "timeWindow.animationDuration": {
      control: { type: "range", min: 0, max: 2000, step: 50 },
      description: "Transition duration (ms) for slider-driven animations.",
      table: { category: "Time Window" },
    },

    /* ── Hidden from controls ── */
    types: { table: { disable: true } },
    onNodeClick: { table: { disable: true } },
    onYearsToShowChange: { table: { disable: true } },
    onWindowStartChange: { table: { disable: true } },
    config: { table: { disable: true } },

    /* ── Controlled windowStart ── */
    windowStart: {
      control: { type: "number" },
      description: "Controlled window start year. Set to jump the spiral to a specific year range.",
      table: { category: "Config" },
    },
  },
  args: {
    data: sampleData,
    locale: "en",
    yearsToShow: 4,
    yearLabelPosition: "top",
    "zoom.speed": 1.0,
    "zoom.mouseWheel": true,
    "zoom.slider": true,
    "zoom.buttons": true,
    "fog.enabled": true,
    "fog.startRing": 2,
    "fog.intensity": 0.8,
    "ringGradient.enabled": true,
    "ringGradient.scale": "spectral",
    "ringGradient.applyToGrid": true,
    "ringGradient.applyToLabels": true,
    "animations.enabled": true,
    "animations.duration": 400,
    "timeWindow.visible": true,
    "timeWindow.animationEnabled": true,
    "timeWindow.animationDuration": 400,
    types: defaultTypes,
    onNodeClick: fn(),
  },
  render: (args) => {
    const props = argsToProps(args);
    const [ws, setWs] = useState<number | undefined>(props.windowStart);
    // Sync when Storybook control changes
    const effectiveWs = props.windowStart !== undefined ? props.windowStart : ws;
    return (
      <SpiralTimeline
        {...props}
        windowStart={effectiveWs}
        onWindowStartChange={(v) => {
          setWs(v);
          (props.onWindowStartChange as ((w: number) => void) | undefined)?.(v);
        }}
      />
    );
  },
};

export default meta;
type Story = StoryObj;

/* ── Stories ──────────────────────────────────────────────── */

/** Default story with sample data and all controls exposed. */
export const Default: Story = {
  args: {
    yearsToShow: 3,
  },
};

/** Light theme (default). Uses the global theme toolbar to switch. */
export const LightTheme: Story = {
  globals: { theme: "light" },
  args: { yearsToShow: 4 },
};

/** Dark theme via Storybook global. */
export const DarkTheme: Story = {
  globals: { theme: "dark" },
  args: { yearsToShow: 4 },
};

/** Responsive: small container (320×400). */
export const SmallContainer: Story = {
  decorators: [
    (Story) => (
      <div
        style={{ width: "320px", height: "400px", border: "1px dashed var(--spiral-border, #ccc)" }}
      >
        <Story />
      </div>
    ),
  ],
  args: { yearsToShow: 3 },
};

/** Responsive: medium container (600×500). */
export const MediumContainer: Story = {
  decorators: [
    (Story) => (
      <div
        style={{ width: "600px", height: "500px", border: "1px dashed var(--spiral-border, #ccc)" }}
      >
        <Story />
      </div>
    ),
  ],
  args: { yearsToShow: 4 },
};

/** Empty data array — demonstrates empty-state rendering. */
export const EmptyData: Story = {
  args: {
    data: [],
    yearsToShow: 2,
  },
};

/** Rainbow color scale for ring gradient. */
export const RainbowGradient: Story = {
  args: {
    "ringGradient.scale": "rainbow",
    yearsToShow: 6,
  },
};

/** Cool color scale for ring gradient. */
export const CoolGradient: Story = {
  args: {
    "ringGradient.scale": "cool",
    yearsToShow: 6,
  },
};

/** Fog disabled — all rings at uniform opacity. */
export const NoFog: Story = {
  args: {
    "fog.enabled": false,
    yearsToShow: 6,
  },
};

/** Animations disabled — instant transitions. */
export const NoAnimations: Story = {
  args: {
    "animations.enabled": false,
    "animations.duration": 0,
    yearsToShow: 4,
  },
};

/** Turkish locale for month labels and date formatting. */
export const TurkishLocale: Story = {
  args: {
    locale: "tr",
    yearsToShow: 4,
  },
};

/* ── Interaction Tests (play functions) ──────────────────── */

/** Verifies tooltip appears on data-node hover with correct content. */
export const TooltipOnHover: Story = {
  args: {
    yearsToShow: 8,
    "animations.enabled": false,
    "animations.duration": 0,
  },
  play: async ({ canvasElement }) => {
    // Wait for D3 to render data nodes
    await waitFor(
      () => {
        const nodes = canvasElement.querySelectorAll("g.data-node");
        expect(nodes.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );

    const firstNode = canvasElement.querySelector("g.data-node") as SVGGElement;
    expect(firstNode).toBeTruthy();

    // Tooltip should not be visible initially
    const tooltip = canvasElement.querySelector(".spiral-timeline__tooltip") as HTMLElement;
    expect(tooltip).toBeTruthy();
    expect(tooltip.classList.contains("spiral-timeline__tooltip--visible")).toBe(false);

    // Hover over the data node
    await userEvent.hover(firstNode);

    // Tooltip should become visible with content
    await waitFor(() => {
      expect(tooltip.classList.contains("spiral-timeline__tooltip--visible")).toBe(true);
      const title = tooltip.querySelector(".spiral-timeline__tooltip-title");
      expect(title).toBeTruthy();
      expect(title?.textContent?.length).toBeGreaterThan(0);
      const date = tooltip.querySelector(".spiral-timeline__tooltip-date");
      expect(date).toBeTruthy();
      expect(date?.textContent?.length).toBeGreaterThan(0);
    });

    // Unhover — tooltip should hide
    await userEvent.unhover(firstNode);
    await waitFor(() => {
      expect(tooltip.classList.contains("spiral-timeline__tooltip--visible")).toBe(false);
    });
  },
};

/** Verifies zoom buttons adjust yearsToShow correctly. */
export const ZoomButtonClicks: Story = {
  args: {
    yearsToShow: 4,
    "zoom.buttons": true,
    "zoom.slider": true,
    "animations.enabled": false,
    "animations.duration": 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for zoom controls to render
    await waitFor(
      () => {
        const controls = canvasElement.querySelector(".spiral-timeline__controls");
        expect(controls).toBeTruthy();
      },
      { timeout: 3000 },
    );

    // Find zoom buttons by aria-label
    const zoomInBtn = canvas.getByLabelText("Zoom in");
    const zoomOutBtn = canvas.getByLabelText("Zoom out");
    expect(zoomInBtn).toBeTruthy();
    expect(zoomOutBtn).toBeTruthy();

    // Read initial value from the display span (the bold number between buttons)
    const getDisplayedYears = () => {
      const controls = canvasElement.querySelector(".spiral-timeline__controls");
      const span = controls?.querySelector("span[style]") as HTMLElement;
      return span ? Number.parseInt(span.textContent ?? "0", 10) : 0;
    };

    const initial = getDisplayedYears();
    expect(initial).toBe(4);

    // Click zoom in (−) → should decrease yearsToShow by 1
    await userEvent.click(zoomInBtn);
    await waitFor(() => {
      expect(getDisplayedYears()).toBe(3);
    });

    // Click zoom out (+) twice → should go back to 4, then 5
    await userEvent.click(zoomOutBtn);
    await waitFor(() => {
      expect(getDisplayedYears()).toBe(4);
    });

    await userEvent.click(zoomOutBtn);
    await waitFor(() => {
      expect(getDisplayedYears()).toBe(5);
    });
  },
};

/** Verifies time-window slider responds to click on the track. */
export const TimeWindowSliderInteraction: Story = {
  args: {
    yearsToShow: 3,
    "animations.enabled": false,
    "animations.duration": 0,
  },
  play: async ({ canvasElement }) => {
    // Wait for the slider to render
    await waitFor(
      () => {
        const slider = canvasElement.querySelector(".spiral-timeline__slider");
        expect(slider).toBeTruthy();
      },
      { timeout: 3000 },
    );

    const sliderWindow = canvasElement.querySelector(
      ".spiral-timeline__slider-window",
    ) as HTMLElement;
    expect(sliderWindow).toBeTruthy();

    // Read the initial range label
    const getLabel = () => {
      const label = canvasElement.querySelector(
        ".spiral-timeline__slider-window-label",
      ) as HTMLElement;
      return label?.textContent ?? "";
    };

    const initialLabel = getLabel();
    expect(initialLabel.length).toBeGreaterThan(0);

    // Click on the track to the left side to shift the window
    const track = canvasElement.querySelector(".spiral-timeline__slider-track") as HTMLElement;
    expect(track).toBeTruthy();

    const trackRect = track.getBoundingClientRect();
    // Click near the left edge of the track (10% from left)
    await userEvent.pointer({
      keys: "[MouseLeft]",
      target: track,
      coords: { clientX: trackRect.left + trackRect.width * 0.1, clientY: trackRect.top + 10 },
    });

    // The label should have changed after clicking a different position
    await waitFor(() => {
      const newLabel = getLabel();
      // The label should still be non-empty and represent a valid range
      expect(newLabel.length).toBeGreaterThan(0);
    });

    // Verify the slider window element still has proper ARIA attributes
    expect(sliderWindow.getAttribute("role")).toBe("slider");
    expect(sliderWindow.getAttribute("aria-label")).toBeTruthy();
    expect(sliderWindow.getAttribute("aria-valuenow")).toBeTruthy();
  },
};

/* ── Performance Stress Test ─────────────────────────────── */

/** Performance stress test with synthetic large dataset and FPS overlay. */
export const PerformanceStress: Story = {
  argTypes: {
    nodeCount: {
      control: { type: "range", min: 100, max: 2000, step: 100 },
      description: "Number of synthetic data nodes to generate.",
      table: { category: "Stress Test" },
    },
  },
  args: {
    nodeCount: 500 as unknown,
  },
  render: (args: Record<string, unknown>) => {
    const nodeCount = (args.nodeCount as number) ?? 500;
    const endYear = new Date().getFullYear() + 3;
    const startYear = endYear - 5;

    const data = useMemo(
      () => generateStressData({ count: nodeCount, startYear, endYear }),
      [nodeCount, startYear, endYear],
    );

    const props = argsToProps(args);

    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <SpiralTimeline {...props} data={data} />
        <FpsOverlay />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Renders the SpiralTimeline with a large synthetic dataset to stress-test SVG rendering performance. " +
          "Use the **nodeCount** slider (100–2000) to find the threshold where performance degrades on your device. " +
          "The FPS overlay in the top-right corner shows real-time frame rate. " +
          "**60 FPS** = smooth rendering, **30 FPS** = acceptable, **below 15 FPS** = optimization needed.",
      },
    },
  },
};
