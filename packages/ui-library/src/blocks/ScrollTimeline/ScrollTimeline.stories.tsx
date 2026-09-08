import type { Meta, StoryObj } from "@storybook/react-vite";

import { ScrollTimeline } from "./ScrollTimeline.tsx";
import type { ScrollTimelineProps } from "./types.ts";

const sections: ScrollTimelineProps["sections"] = [
  { id: "2025-04", label: "Early 2025" },
  { id: "2025-08", label: "Mid 2025" },
  { id: "2025-12", label: "Late 2025" },
  { id: "2026-04", label: "2026" },
  { id: "2026-08", label: "Mid 2026" },
  { id: "2027-03", label: "Early 2027" },
  { id: "2027-12", label: "Late 2027" },
];

function DemoContent({ sections }: { sections: { id: string; title: string; body: string }[] }) {
  return (
    <div>
      {sections.map((s) => (
        <div
          key={s.id}
          data-timeline-id={s.id}
          data-timeline-label={s.title}
          style={{
            minHeight: "60vh",
            padding: "2rem 0",
            borderBottom: "1px solid var(--color-border-default, #e5e5e5)",
          }}
        >
          <h2 style={{ margin: "0 0 0.5rem" }}>{s.title}</h2>
          <p style={{ color: "#666", lineHeight: 1.6 }}>{s.body}</p>
        </div>
      ))}
    </div>
  );
}

const contentSections = [
  { id: "2025-04", title: "Early 2025", body: "AI coding assistants are useful but limited." },
  { id: "2025-08", title: "Mid 2025", body: "Models handle multi-hour coding tasks reliably." },
  { id: "2025-12", title: "Late 2025", body: "Models match skilled engineers on real projects." },
  { id: "2026-04", title: "2026", body: "Superhuman coder emerges — faster and cheaper." },
  { id: "2026-08", title: "Mid 2026", body: "AI agents run ML experiments end-to-end." },
  { id: "2027-03", title: "Early 2027", body: "Superhuman AI researcher — 25x faster." },
  { id: "2027-12", title: "Late 2027", body: "Artificial superintelligence arrives." },
];

const meta: Meta<ScrollTimelineProps> = {
  title: "Blocks/ScrollTimeline",
  component: ScrollTimeline,
  decorators: [
    (Story) => (
      <div style={{ width: "100%", minHeight: "100vh" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    namePrefix: { control: "text" },
    config: { control: "object" },
  },
  args: {
    sections,
    namePrefix: "narrative",
  },
  render: (args) => (
    <ScrollTimeline {...args}>
      <DemoContent sections={contentSections} />
    </ScrollTimeline>
  ),
};

export default meta;
type Story = StoryObj<ScrollTimelineProps>;

export const Default: Story = {};

export const AlwaysShowLabels: Story = {
  args: {
    sections,
    config: { alwaysShowLabels: true },
  },
};

export const CustomNavWidth: Story = {
  args: {
    sections,
    config: { navWidth: 200, alwaysShowLabels: true },
  },
};

export const SingleSection: Story = {
  args: {
    sections: [{ id: "start", label: "Start" }],
  },
  render: (args) => (
    <ScrollTimeline {...args}>
      <div
        data-timeline-id="start"
        data-timeline-label="Start"
        style={{ minHeight: "50vh", padding: "2rem" }}
      >
        <h2>Only one section</h2>
        <p>The timeline shows a single dot.</p>
      </div>
    </ScrollTimeline>
  ),
};

export const EmptyLabels: Story = {
  args: {
    sections: [
      { id: "a", label: "" },
      { id: "b", label: "" },
    ],
  },
  render: (args) => (
    <ScrollTimeline {...args}>
      <div
        data-timeline-id="a"
        data-timeline-label=""
        style={{ minHeight: "40vh", padding: "2rem" }}
      >
        <h2>Section A</h2>
      </div>
      <div
        data-timeline-id="b"
        data-timeline-label=""
        style={{ minHeight: "40vh", padding: "2rem" }}
      >
        <h2>Section B</h2>
      </div>
    </ScrollTimeline>
  ),
};
