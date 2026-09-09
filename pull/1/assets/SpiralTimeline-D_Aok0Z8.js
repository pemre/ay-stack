import{u as s,j as e,M as l,C as d,a as c}from"./iframe-CcV_ZEO1.js";import{S as t,D as o,N as h,R as a,a as x,b as j,T as p}from"./SpiralTimeline.stories-oNI8JKzZ.js";import"./preload-helper-C7rGsTiM.js";function i(r){const n={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...s(),...r.components};return e.jsxs(e.Fragment,{children:[`
`,`
`,e.jsx(l,{of:t}),`
`,e.jsx(n.h1,{id:"spiraltimeline",children:"SpiralTimeline"}),`
`,e.jsx(n.p,{children:"A D3-powered spiral timeline visualization for React. Each concentric ring represents one calendar year, months are arranged as radial sectors, and data nodes are plotted at their calendar positions."}),`
`,e.jsx(d,{of:o}),`
`,e.jsx(n.h2,{id:"usage",children:"Usage"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-tsx",children:`import { SpiralTimeline } from "@ay/ui-library";
import "@ay/ui-library/styles.css";
import "@ay/ui-library";

const data = [
  {
    date: new Date("2024-03-15"),
    type: "history",
    title: "Spring Equinox",
    content: "The vernal equinox marks the start of spring.",
  },
  {
    date: new Date("2024-07-20"),
    type: "science",
    title: "Moon Landing Anniversary",
    content: "Celebrating the Apollo 11 mission.",
  },
];

function App() {
  return (
    <SpiralTimeline
      data={data}
      config={{ yearsToShow: 3 }}
      locale="en"
      onNodeClick={(node) => console.log("Clicked:", node.title)}
    />
  );
}
`})}),`
`,e.jsx(n.h2,{id:"props",children:"Props"}),`
`,e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Prop"}),e.jsx("th",{children:"Type"}),e.jsx("th",{children:"Default"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"data"})}),e.jsx("td",{children:e.jsx("code",{children:"DataNode[]"})}),e.jsx("td",{children:"(required)"}),e.jsx("td",{children:"Array of data items to plot on the spiral"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"config"})}),e.jsx("td",{children:e.jsx("code",{children:"SpiralTimelineConfig"})}),e.jsx("td",{children:e.jsx("code",{children:"{}"})}),e.jsx("td",{children:"Configuration object — all fields optional"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"locale"})}),e.jsx("td",{children:e.jsx("code",{children:"string"})}),e.jsx("td",{children:"Browser locale"}),e.jsx("td",{children:"Locale for month labels and date formatting"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"className"})}),e.jsx("td",{children:e.jsx("code",{children:"string"})}),e.jsx("td",{children:"—"}),e.jsx("td",{children:"Additional CSS class for the root container"})]})]})]}),`
`,e.jsx(n.h2,{id:"data-format",children:"Data Format"}),`
`,e.jsxs(n.p,{children:["Each item in the ",e.jsx(n.code,{children:"data"})," array must conform to the ",e.jsx(n.code,{children:"DataNode"})," interface:"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`interface DataNode {
  date: Date;       // Calendar date for spiral positioning
  type: string;     // Maps to a TypeConfig entry for color/shape
  title: string;    // Shown in tooltip and aria-label
  content: string;  // Shown in tooltip body
  id?: string;      // Optional stable key for data updates
  metadata?: Record<string, unknown>; // Pass-through for extra fields
}
`})}),`
`,e.jsxs(n.p,{children:["The ",e.jsx(n.code,{children:"type"})," field maps to entries in ",e.jsx(n.code,{children:"config.types"})," to determine the node's color and shape. If no match is found, the first entry in ",e.jsx(n.code,{children:"types"})," is used as a fallback."]}),`
`,e.jsx(n.h2,{id:"configuration",children:"Configuration"}),`
`,e.jsx(n.p,{children:"All configuration fields are optional. Unspecified fields use sensible defaults."}),`
`,e.jsx(n.h3,{id:"general",children:"General"}),`
`,e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Field"}),e.jsx("th",{children:"Type"}),e.jsx("th",{children:"Default"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"yearsToShow"})}),e.jsx("td",{children:e.jsx("code",{children:"number"})}),e.jsx("td",{children:e.jsx("code",{children:"2"})}),e.jsx("td",{children:"Number of visible year rings"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"yearLabelPosition"})}),e.jsx("td",{children:e.jsx("code",{children:"YearLabelPosition"})}),e.jsx("td",{children:e.jsx("code",{children:'"top"'})}),e.jsx("td",{children:"Angle for year labels: top, right, bottom, left, top-right, top-left, bottom-right, bottom-left"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"onNodeClick"})}),e.jsx("td",{children:e.jsx("code",{children:"(node, event) => void"})}),e.jsx("td",{children:"—"}),e.jsx("td",{children:"Callback when a data node is clicked"})]})]})]}),`
`,e.jsx(n.h3,{id:"zoom",children:"Zoom"}),`
`,e.jsxs(n.p,{children:["Control zoom behavior via ",e.jsx(n.code,{children:"config.zoom"}),":"]}),`
`,e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Field"}),e.jsx("th",{children:"Type"}),e.jsx("th",{children:"Default"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"speed"})}),e.jsx("td",{children:e.jsx("code",{children:"number"})}),e.jsx("td",{children:e.jsx("code",{children:"1.0"})}),e.jsx("td",{children:"Zoom speed multiplier"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"mouseWheel"})}),e.jsx("td",{children:e.jsx("code",{children:"boolean"})}),e.jsx("td",{children:e.jsx("code",{children:"true"})}),e.jsx("td",{children:"Enable mouse wheel zoom on SVG"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"slider"})}),e.jsx("td",{children:e.jsx("code",{children:"boolean"})}),e.jsx("td",{children:e.jsx("code",{children:"true"})}),e.jsx("td",{children:"Show zoom range slider"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"buttons"})}),e.jsx("td",{children:e.jsx("code",{children:"boolean"})}),e.jsx("td",{children:e.jsx("code",{children:"true"})}),e.jsx("td",{children:"Show +/− zoom buttons"})]})]})]}),`
`,e.jsx(n.h3,{id:"fog",children:"Fog"}),`
`,e.jsxs(n.p,{children:["Control the depth/fog effect via ",e.jsx(n.code,{children:"config.fog"}),":"]}),`
`,e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Field"}),e.jsx("th",{children:"Type"}),e.jsx("th",{children:"Default"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"enabled"})}),e.jsx("td",{children:e.jsx("code",{children:"boolean"})}),e.jsx("td",{children:e.jsx("code",{children:"true"})}),e.jsx("td",{children:"Enable fog on outer rings"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"startRing"})}),e.jsx("td",{children:e.jsx("code",{children:"number"})}),e.jsx("td",{children:e.jsx("code",{children:"2"})}),e.jsx("td",{children:"Ring index where fog begins"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"intensity"})}),e.jsx("td",{children:e.jsx("code",{children:"number"})}),e.jsx("td",{children:e.jsx("code",{children:"0.8"})}),e.jsx("td",{children:"Fog intensity (0–1)"})]})]})]}),`
`,e.jsx(d,{of:h}),`
`,e.jsx(n.h3,{id:"ring-gradient",children:"Ring Gradient"}),`
`,e.jsxs(n.p,{children:["Control ring coloring via ",e.jsx(n.code,{children:"config.ringGradient"}),":"]}),`
`,e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Field"}),e.jsx("th",{children:"Type"}),e.jsx("th",{children:"Default"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"enabled"})}),e.jsx("td",{children:e.jsx("code",{children:"boolean"})}),e.jsx("td",{children:e.jsx("code",{children:"true"})}),e.jsx("td",{children:"Enable ring color gradient"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"scale"})}),e.jsx("td",{children:e.jsx("code",{children:"ColorScale"})}),e.jsx("td",{children:e.jsx("code",{children:'"spectral"'})}),e.jsx("td",{children:"D3 interpolator: spectral, rainbow, cool, warm"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"applyTo"})}),e.jsx("td",{children:e.jsx("code",{children:"GradientTarget[]"})}),e.jsx("td",{children:e.jsx("code",{children:'["grid", "labels"]'})}),e.jsx("td",{children:"Elements that receive the gradient"})]})]})]}),`
`,e.jsx(d,{of:a}),`
`,e.jsx(n.h3,{id:"animations",children:"Animations"}),`
`,e.jsxs(n.p,{children:["Control transitions via ",e.jsx(n.code,{children:"config.animations"}),":"]}),`
`,e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Field"}),e.jsx("th",{children:"Type"}),e.jsx("th",{children:"Default"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"enabled"})}),e.jsx("td",{children:e.jsx("code",{children:"boolean"})}),e.jsx("td",{children:e.jsx("code",{children:"true"})}),e.jsx("td",{children:"Enable animated transitions"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"duration"})}),e.jsx("td",{children:e.jsx("code",{children:"number"})}),e.jsx("td",{children:e.jsx("code",{children:"400"})}),e.jsx("td",{children:"Transition duration in ms"})]})]})]}),`
`,e.jsx(n.h3,{id:"type-mapping",children:"Type Mapping"}),`
`,e.jsxs(n.p,{children:["Map data-node types to visual representations via ",e.jsx(n.code,{children:"config.types"}),":"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`const config = {
  types: [
    { key: "history", color: "#3b82f6", shape: "circle" },
    { key: "cinema",  color: "#f59e0b", shape: "star" },
    { key: "science", color: "#8b5cf6", shape: "triangle" },
  ],
};
`})}),`
`,e.jsxs(n.p,{children:["Available shapes: ",e.jsx(n.code,{children:"circle"}),", ",e.jsx(n.code,{children:"square"}),", ",e.jsx(n.code,{children:"triangle"}),", ",e.jsx(n.code,{children:"star"}),", ",e.jsx(n.code,{children:"pentagon"}),"."]}),`
`,e.jsx(n.h3,{id:"labels",children:"Labels"}),`
`,e.jsxs(n.p,{children:["Override UI strings via ",e.jsx(n.code,{children:"config.labels"})," for localization:"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`const config = {
  labels: {
    zoomTitle: "Gösterilecek Yıl",
    timeWindowTitle: "Zaman Penceresi",
    ringSummaryTemplate: "Spiral: {rings} halka + kuyruk",
    totalYearsTemplate: "Toplam veri: {years} yıl",
  },
};
`})}),`
`,e.jsx(n.h2,{id:"theming",children:"Theming"}),`
`,e.jsxs(n.p,{children:["SpiralTimeline is themed through CSS custom properties. The tiers, their naming patterns, and their ownership rules are documented once, in ",e.jsx(n.code,{children:"@ay/ui-library"}),": see ",e.jsx(n.a,{href:"https://github.com/pemre/ay-stack/blob/main/packages/ui-library/TOKEN-ARCHITECTURE.md",rel:"nofollow",children:"TOKEN-ARCHITECTURE.md"}),"."]}),`
`,e.jsxs(n.p,{children:["The component reads semantic tokens from ",e.jsx(n.code,{children:"@ay/ui-library"})," and maps them to ",e.jsx(n.code,{children:"--spiral-*"})," component tokens. Override any component token to customize the look:"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-css",children:`.my-wrapper .spiral-timeline {
  --spiral-bg: #0a0a1a;
  --spiral-primary: hotpink;
  --spiral-tooltip-bg: #1a1a2e;
  --spiral-tooltip-border: #333;
}
`})}),`
`,e.jsxs(n.p,{children:["Theme switching works automatically via the ",e.jsx(n.code,{children:"data-theme"})," attribute on a parent element:"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-html",children:`<div data-theme="dark">
  <SpiralTimeline data={data} />
</div>
`})}),`
`,e.jsx(n.h3,{id:"available-component-tokens",children:"Available Component Tokens"}),`
`,e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Token"}),e.jsx("th",{children:"Maps to"}),e.jsx("th",{children:"Purpose"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"--spiral-bg"})}),e.jsx("td",{children:e.jsx("code",{children:"--color-bg-body"})}),e.jsx("td",{children:"Container background"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"--spiral-surface"})}),e.jsx("td",{children:e.jsx("code",{children:"--color-bg-surface"})}),e.jsx("td",{children:"Surface elements"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"--spiral-text"})}),e.jsx("td",{children:e.jsx("code",{children:"--color-text-primary"})}),e.jsx("td",{children:"Primary text"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"--spiral-text-secondary"})}),e.jsx("td",{children:e.jsx("code",{children:"--color-text-secondary"})}),e.jsx("td",{children:"Secondary text"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"--spiral-primary"})}),e.jsx("td",{children:e.jsx("code",{children:"--color-primary"})}),e.jsx("td",{children:"Accent color"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"--spiral-border"})}),e.jsx("td",{children:e.jsx("code",{children:"--color-border-default"})}),e.jsx("td",{children:"Borders"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"--spiral-tooltip-bg"})}),e.jsx("td",{children:e.jsx("code",{children:"--color-bg-surface"})}),e.jsx("td",{children:"Tooltip background"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"--spiral-tooltip-border"})}),e.jsx("td",{children:e.jsx("code",{children:"--color-border-default"})}),e.jsx("td",{children:"Tooltip border"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"--spiral-control-bg"})}),e.jsx("td",{children:e.jsx("code",{children:"--color-bg-surface"})}),e.jsx("td",{children:"Control panel background"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"--spiral-control-border"})}),e.jsx("td",{children:e.jsx("code",{children:"--color-border-default"})}),e.jsx("td",{children:"Control panel border"})]})]})]}),`
`,e.jsx(d,{of:x}),`
`,e.jsx(n.h2,{id:"responsive-behavior",children:"Responsive Behavior"}),`
`,e.jsxs(n.p,{children:["The component adapts to its container size automatically via ",e.jsx(n.code,{children:"ResizeObserver"}),". The spiral radius is computed as ",e.jsx(n.code,{children:"min(width, height) × 0.4"})," to prevent overflow."]}),`
`,e.jsx(n.p,{children:"When the container width drops below 300px, zoom controls are hidden to avoid clutter."}),`
`,e.jsx(d,{of:j}),`
`,e.jsx(n.h2,{id:"accessibility",children:"Accessibility"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["Data nodes have ",e.jsx(n.code,{children:'role="button"'}),", ",e.jsx(n.code,{children:'tabindex="0"'}),", and ",e.jsx(n.code,{children:"aria-label"})," with the node title and formatted date"]}),`
`,e.jsxs(n.li,{children:["Keyboard navigation: Enter or Space on a focused node triggers ",e.jsx(n.code,{children:"onNodeClick"})]}),`
`,e.jsx(n.li,{children:"Tooltip appears on focus and hides on blur"}),`
`,e.jsxs(n.li,{children:["The time window slider has ",e.jsx(n.code,{children:'role="slider"'})," with proper ARIA attributes"]}),`
`]}),`
`,e.jsx(n.h2,{id:"locale-support",children:"Locale Support"}),`
`,e.jsx(n.p,{children:"Pass a locale string to render month labels and format tooltip dates in any language:"}),`
`,e.jsx(d,{of:p}),`
`,e.jsx(n.h2,{id:"interactive-controls",children:"Interactive Controls"}),`
`,e.jsx(n.p,{children:"Use the controls panel below to experiment with all configuration options:"}),`
`,e.jsx(c,{})]})}function u(r={}){const{wrapper:n}={...s(),...r.components};return n?e.jsx(n,{...r,children:e.jsx(i,{...r})}):i(r)}export{u as default};
