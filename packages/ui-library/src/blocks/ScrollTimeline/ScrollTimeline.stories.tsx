import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScrollTimeline } from "./ScrollTimeline.tsx";
import type { ScrollTimelineProps } from "./types.ts";

/* ── Demo content with varied layout ──────────────────────── */

const sections: ScrollTimelineProps["sections"] = [
  { id: "jan", label: "January" },
  { id: "feb", label: "February" },
  { id: "mar", label: "March" },
  { id: "apr", label: "April" },
  { id: "may", label: "May" },
  { id: "jun", label: "June" },
];

/** Rich content with images, short text, long text, and code blocks. */
function RichContent() {
  return (
    <div>
      {/* Section 1 — short text */}
      <div
        data-timeline-id="jan"
        data-timeline-label="January"
        style={{ minHeight: "60vh", padding: "2rem 0", borderBottom: "1px solid #e5e5e5" }}
      >
        <h2 style={{ margin: "0 0 0.5rem" }}>January — Kickoff</h2>
        <p style={{ color: "#666", lineHeight: 1.6 }}>The project kicks off. Short and sweet.</p>
      </div>

      {/* Section 2 — image + text */}
      <div
        data-timeline-id="feb"
        data-timeline-label="February"
        style={{ minHeight: "90vh", padding: "2rem 0", borderBottom: "1px solid #e5e5e5" }}
      >
        <h2 style={{ margin: "0 0 0.5rem" }}>February — Design Phase</h2>
        <img
          src="https://picsum.photos/seed/february/600/300"
          alt="Design mockup"
          style={{ width: "100%", borderRadius: "8px", marginBottom: "1rem" }}
          loading="lazy"
        />
        <p style={{ color: "#666", lineHeight: 1.6 }}>
          Wireframes and design systems take shape. The team reviews the first round of mockups and
          provides feedback on color, typography, and layout choices. Several iterations are
          expected before the final design is approved.
        </p>
        <p style={{ color: "#666", lineHeight: 1.6 }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
          sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
          est laborum.
        </p>
      </div>

      {/* Section 3 — code block */}
      <div
        data-timeline-id="mar"
        data-timeline-label="March"
        style={{ minHeight: "65vh", padding: "2rem 0", borderBottom: "1px solid #e5e5e5" }}
      >
        <h2 style={{ margin: "0 0 0.5rem" }}>March — Implementation</h2>
        <pre
          style={{
            background: "#1e1e2e",
            color: "#cdd6f4",
            padding: "1rem",
            borderRadius: "8px",
            overflow: "auto",
            fontSize: "0.85rem",
          }}
        >
          <code>{`const timeline = new ScrollTimeline({
  sections: data,
  onActive: (id) => console.log(id),
});`}</code>
        </pre>
        <p style={{ color: "#666", lineHeight: 1.6, marginTop: "1rem" }}>
          Core implementation begins. The component is wired up and integration tests are written.
        </p>
      </div>

      {/* Section 4 — long text, no image */}
      <div
        data-timeline-id="apr"
        data-timeline-label="April"
        style={{ minHeight: "80vh", padding: "2rem 0", borderBottom: "1px solid #e5e5e5" }}
      >
        <h2 style={{ margin: "0 0 0.5rem" }}>April — Testing & QA</h2>
        <p style={{ color: "#666", lineHeight: 1.6 }}>
          Comprehensive testing begins. Unit tests cover edge cases like empty sections, single
          items, and very long labels. Integration tests verify scroll behavior across different
          viewport sizes. Accessibility audit ensures the timeline is navigable by keyboard and
          readable by screen readers. Performance profiling identifies any jank in the scroll
          handler. The team discovers that images loading asynchronously can shift content
          positions, so a ResizeObserver is added to recompute dot positions when the content height
          changes. This is a longer paragraph to demonstrate how the timeline behaves with
          substantial text content that spans many lines.
        </p>
      </div>

      {/* Section 5 — image + bullet list */}
      <div
        data-timeline-id="may"
        data-timeline-label="May"
        style={{ minHeight: "60vh", padding: "2rem 0", borderBottom: "1px solid #e5e5e5" }}
      >
        <h2 style={{ margin: "0 0 0.5rem" }}>May — Beta Release</h2>
        <img
          src="https://picsum.photos/seed/may-beta-release/600/200"
          alt="Beta release dashboard"
          style={{ width: "100%", borderRadius: "8px", marginBottom: "1rem" }}
          loading="lazy"
        />
        <ul style={{ color: "#666", lineHeight: 1.8, paddingLeft: "1.5rem" }}>
          <li>Feature freeze on May 1st</li>
          <li>Beta program opens to 50 users</li>
          <li>Feedback collected via in-app survey</li>
          <li>Two bug-fix releases planned</li>
        </ul>
      </div>

      {/* Section 6 — short, with quote */}
      <div
        data-timeline-id="jun"
        data-timeline-label="June"
        style={{ minHeight: "55vh", padding: "2rem 0" }}
      >
        <h2 style={{ margin: "0 0 0.5rem" }}>June — Launch</h2>
        <blockquote
          style={{
            borderLeft: "3px solid #ccc",
            paddingLeft: "1rem",
            color: "#999",
            fontStyle: "italic",
          }}
        >
          "Ship it." — The Team
        </blockquote>
        <p style={{ color: "#666", lineHeight: 1.6, marginTop: "1rem" }}>
          The product goes live. Time to celebrate.
        </p>
      </div>
    </div>
  );
}

/** Minimal content for the SingleSection story. */
function SingleContent() {
  return (
    <div
      data-timeline-id="start"
      data-timeline-label="Start"
      style={{ minHeight: "50vh", padding: "2rem" }}
    >
      <h2>Only one section</h2>
      <p>The timeline shows a single dot at the top.</p>
    </div>
  );
}

const meta: Meta<ScrollTimelineProps> = {
  title: "Blocks/ScrollTimeline",
  component: ScrollTimeline,
  decorators: [
    (Story) => (
      <div style={{ width: "100%", minHeight: "120vh" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    namePrefix: { control: "text" },
  },
  args: {
    sections,
    namePrefix: "narrative",
    config: { alwaysShowLabels: true },
  },
  render: (args) => (
    <ScrollTimeline {...args}>
      <RichContent />
    </ScrollTimeline>
  ),
};

export default meta;
type Story = StoryObj<ScrollTimelineProps>;

export const Default: Story = {};

export const HoverLabels: Story = {
  args: {
    sections,
    config: { alwaysShowLabels: false },
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
      <SingleContent />
    </ScrollTimeline>
  ),
};

export const ManySections: Story = {
  args: {
    sections: Array.from({ length: 12 }, (_, i) => ({
      id: `s-${i}`,
      label: `Step ${i + 1}`,
    })),
    config: { alwaysShowLabels: true },
  },
  render: (args) => (
    <ScrollTimeline {...args}>
      <div>
        {Array.from({ length: 12 }, (_, i) => {
          const id = `s-${i}`;
          return (
            <div
              key={id}
              data-timeline-id={id}
              data-timeline-label={`Step ${i + 1}`}
              style={{ minHeight: "30vh", padding: "1.5rem 0", borderBottom: "1px solid #eee" }}
            >
              <h3>Step {i + 1}</h3>
              <p style={{ color: "#999" }}>Content for step {i + 1}.</p>
            </div>
          );
        })}
      </div>
    </ScrollTimeline>
  ),
};
