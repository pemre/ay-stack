import{u as r,j as e,M as s,C as o}from"./iframe-CcV_ZEO1.js";import{S as c,D as t}from"./ScrollTimeline.stories-B77AqmDe.js";import"./preload-helper-C7rGsTiM.js";function l(i){const n={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...r(),...i.components};return e.jsxs(e.Fragment,{children:[`
`,`
`,e.jsx(s,{of:c}),`
`,e.jsx(n.h1,{id:"scrolltimeline",children:"ScrollTimeline"}),`
`,e.jsx(n.p,{children:"A vertical scroll-progress timeline component. A sticky SVG on the left draws a progress line that grows as the user scrolls through content, with milestone dots that fill once scrolled past and labels that appear on hover (or permanently when configured)."}),`
`,e.jsxs(n.p,{children:["Reverse-engineered from the ",e.jsx(n.a,{href:"https://ai-2027.com",rel:"nofollow",children:"ai-2027.com"})," website's left-side navigation."]}),`
`,e.jsx(o,{of:t}),`
`,e.jsx(n.h2,{id:"how-it-works",children:"How it works"}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Scroll tracking"})," — A ",e.jsx(n.code,{children:"scroll"})," listener on ",e.jsx(n.code,{children:"window"})," computes progress (0â1) as the viewport center moves through the content area. A ",e.jsx(n.code,{children:"ResizeObserver"})," recomputes dot positions when content height changes (e.g. images loading)."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Active section"})," — The last section whose top is above the viewport center becomes active, highlighting its label."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Dot positions"})," — Each child element marked with ",e.jsx(n.code,{children:"data-timeline-id"})," and ",e.jsx(n.code,{children:"data-timeline-label"})," is measured and positioned proportionally along the SVG."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Progress line"})," — An SVG ",e.jsx(n.code,{children:"<line>"})," whose ",e.jsx(n.code,{children:"y2"})," is driven by ",e.jsx(n.code,{children:"Math.max(scrollProgress * 100, 2)%"}),"."]}),`
`]}),`
`,e.jsx(n.p,{children:"The component is fully prop-driven and has zero runtime dependencies beyond React."}),`
`,e.jsx(n.h2,{id:"usage",children:"Usage"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-tsx",children:`import { ScrollTimeline } from "@ay/ui-library";
import "@ay/ui-library/styles.css";

const sections = [
  { id: "jan", label: "January" },
  { id: "feb", label: "February" },
  { id: "mar", label: "March" },
];

function App() {
  return (
    <ScrollTimeline sections={sections} namePrefix="report">
      <article data-timeline-id="jan" data-timeline-label="January">
        <h2>January Report</h2>
        <p>Content...</p>
      </article>
      <article data-timeline-id="feb" data-timeline-label="February">
        <h2>February Report</h2>
        <p>Content...</p>
      </article>
      <article data-timeline-id="mar" data-timeline-label="March">
        <h2>March Report</h2>
        <p>Content...</p>
      </article>
    </ScrollTimeline>
  );
}
`})}),`
`,e.jsx(n.h3,{id:"always-show-labels",children:"Always show labels"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-tsx",children:`<ScrollTimeline
  sections={sections}
  config={{ alwaysShowLabels: true }}
>
  {/* children */}
</ScrollTimeline>
`})}),`
`,e.jsx(n.h3,{id:"custom-nav-width",children:"Custom nav width"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-tsx",children:`<ScrollTimeline
  sections={sections}
  config={{ navWidth: 200, alwaysShowLabels: true }}
>
  {/* children */}
</ScrollTimeline>
`})}),`
`,e.jsx(n.h2,{id:"props",children:"Props"}),`
`,e.jsxs(n.p,{children:[`| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `,e.jsx(n.code,{children:"sections"})," | ",e.jsx(n.code,{children:"ScrollTimelineSection[]"})," | â | Milestone sections with ",e.jsx(n.code,{children:"id"})," and ",e.jsx(n.code,{children:"label"}),`. |
| `,e.jsx(n.code,{children:"namePrefix"})," | ",e.jsx(n.code,{children:"string"})," | ",e.jsx(n.code,{children:'"narrative"'})," | Prefix for anchor link IDs (",e.jsx(n.code,{children:"#narrative-{id}"}),`). |
| `,e.jsx(n.code,{children:"config"})," | ",e.jsx(n.code,{children:"ScrollTimelineConfig"}),` | â | Optional configuration overrides. |
| `,e.jsx(n.code,{children:"config.navWidth"})," | ",e.jsx(n.code,{children:"number"})," | ",e.jsx(n.code,{children:"130"}),` | Width of the SVG nav area in pixels. |
| `,e.jsx(n.code,{children:"config.minViewportWidth"})," | ",e.jsx(n.code,{children:"number"})," | ",e.jsx(n.code,{children:"1024"}),` | Below this viewport width, the timeline is hidden. |
| `,e.jsx(n.code,{children:"config.alwaysShowLabels"})," | ",e.jsx(n.code,{children:"boolean"})," | ",e.jsx(n.code,{children:"false"}),` | Show labels permanently instead of on hover. |
| `,e.jsx(n.code,{children:"labels"})," | ",e.jsx(n.code,{children:"ScrollTimelineLabels"}),` | â | Accessibility label overrides. |
| `,e.jsx(n.code,{children:"labels.ariaLabel"})," | ",e.jsx(n.code,{children:"string"})," | ",e.jsx(n.code,{children:'"Scroll timeline"'}),` | aria-label for the nav element. |
| `,e.jsx(n.code,{children:"className"})," | ",e.jsx(n.code,{children:"string"})," | ",e.jsx(n.code,{children:'""'}),` | Extra CSS class on the root wrapper. |
| `,e.jsx(n.code,{children:"children"})," | ",e.jsx(n.code,{children:"ReactNode"})," | â | Content sections rendered alongside the timeline. |"]}),`
`,e.jsx(n.h2,{id:"host-responsibilities",children:"Host responsibilities"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["Each content section that should appear as a dot ",e.jsx(n.strong,{children:"must"})," have ",e.jsx(n.code,{children:"data-timeline-id"})," and ",e.jsx(n.code,{children:"data-timeline-label"})," attributes matching the ",e.jsx(n.code,{children:"sections"})," prop."]}),`
`,e.jsxs(n.li,{children:["Smooth scrolling (",e.jsx(n.code,{children:"scroll-behavior: smooth"})," on the root) is recommended for anchor navigation."]}),`
`,e.jsxs(n.li,{children:["The component hides itself below ",e.jsx(n.code,{children:"minViewportWidth"})," (default ",e.jsx(n.code,{children:"lg"})," breakpoint). Ensure content is readable without the timeline on mobile."]}),`
`]}),`
`,e.jsx(n.h2,{id:"theming",children:"Theming"}),`
`,e.jsx(n.p,{children:"ScrollTimeline uses component-level CSS custom properties that reference the library's semantic tokens:"}),`
`,e.jsxs(n.p,{children:[`| Token | Default | Purpose |
|-------|---------|---------|
| `,e.jsx(n.code,{children:"--scroll-timeline-line-color"})," | ",e.jsx(n.code,{children:"--color-text-primary"}),` | Progress line stroke |
| `,e.jsx(n.code,{children:"--scroll-timeline-dot-outer"})," | ",e.jsx(n.code,{children:"--color-text-primary"}),` | Outer dot ring |
| `,e.jsx(n.code,{children:"--scroll-timeline-dot-inner"})," | ",e.jsx(n.code,{children:"--color-bg-surface"}),` | Inner dot fill (unfilled state) |
| `,e.jsx(n.code,{children:"--scroll-timeline-label-color"})," | ",e.jsx(n.code,{children:"--color-text-primary"}),` | Label text color |
| `,e.jsx(n.code,{children:"--scroll-timeline-link-color"})," | ",e.jsx(n.code,{children:"--color-text-primary"})," | Anchor link color |"]}),`
`,e.jsxs(n.p,{children:["Override by targeting the ",e.jsx(n.code,{children:".scroll-timeline"})," class:"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-css",children:`.my-wrapper .scroll-timeline {
  --scroll-timeline-line-color: hotpink;
  --scroll-timeline-dot-outer: hotpink;
}
`})}),`
`,e.jsx(n.h2,{id:"accessibility",children:"Accessibility"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["The SVG nav is marked ",e.jsx(n.code,{children:'aria-hidden="true"'})," as it is a visual aid; the anchor links inside it are keyboard-focusable."]}),`
`,e.jsxs(n.li,{children:["The root ",e.jsx(n.code,{children:"<nav>"})," has an ",e.jsx(n.code,{children:"aria-label"})," configurable via the ",e.jsx(n.code,{children:"labels.ariaLabel"})," prop."]}),`
`,e.jsx(n.li,{children:"On narrow viewports, the timeline is removed entirely so only content remains."}),`
`]})]})}function x(i={}){const{wrapper:n}={...r(),...i.components};return n?e.jsx(n,{...i,children:e.jsx(l,{...i})}):l(i)}export{x as default};
