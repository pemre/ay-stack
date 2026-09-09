import{j as e}from"./jsx-runtime-B_jdX55V.js";import{u as d,M as t,C as i,a as c}from"./blocks-DQXk3-t2.js";import{I as o,D as l,E as a}from"./ImageZoom.stories-fp5EkjAL.js";import"./iframe-CmaHmlH9.js";import"./preload-helper-DyxzNcLA.js";import"./index-BwQDkpGd.js";function r(s){const n={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...d(),...s.components};return e.jsxs(e.Fragment,{children:[`
`,`
`,e.jsx(t,{of:o}),`
`,e.jsx(n.h1,{id:"imagezoom",children:"ImageZoom"}),`
`,e.jsx(n.p,{children:"A mouse-tracking zoom-on-hover image component for React. Hover over the image and the area under your cursor magnifies — letting users inspect detail without leaving the page."}),`
`,e.jsx(i,{of:l}),`
`,e.jsx(n.h2,{id:"prerequisites",children:"Prerequisites"}),`
`,e.jsxs(n.p,{children:["ImageZoom uses a ",e.jsx(n.strong,{children:"hybrid styling approach"}),": Tailwind CSS utility classes handle layout and the scale transform, while the library's CSS custom property system handles theming. Your consumer project must have Tailwind CSS configured for the hover-zoom effect to work."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bash",children:`pnpm add tailwindcss @tailwindcss/vite
`})}),`
`,e.jsxs(n.p,{children:["Make sure the Tailwind classes used by ImageZoom are included in your content paths. If you use Tailwind v4, no extra configuration is needed beyond the standard setup. For Tailwind v3, add the library's source to your ",e.jsx(n.code,{children:"content"})," array:"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-js",children:`// tailwind.config.js (v3)
module.exports = {
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/@ay/ui-library/dist/**/*.js",
  ],
};
`})}),`
`,e.jsxs(n.blockquote,{children:[`
`,e.jsx(n.p,{children:"Without Tailwind configured, the image still renders correctly but the hover-zoom and layout utilities will not apply."}),`
`]}),`
`,e.jsx(n.h2,{id:"usage",children:"Usage"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-tsx",children:`import { ImageZoom } from "@ay/ui-library";
import "@ay/ui-library/styles.css";
import "@ay/ui-library";

function App() {
  return (
    <ImageZoom
      src="https://example.com/photo.jpg"
      alt="Mountain landscape at sunset"
    />
  );
}
`})}),`
`,e.jsx(n.h3,{id:"custom-zoom-level-and-transition",children:"Custom Zoom Level and Transition"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-tsx",children:`<ImageZoom
  src="/images/product-detail.jpg"
  alt="Product close-up"
  config={{ zoomLevel: 2, transitionDuration: 500 }}
/>
`})}),`
`,e.jsx(n.h3,{id:"with-custom-class-names",children:"With Custom Class Names"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-tsx",children:`<ImageZoom
  src="/images/hero.jpg"
  alt="Hero banner"
  className="rounded-lg shadow-xl"
  imageClassName="object-cover"
/>
`})}),`
`,e.jsx(n.h2,{id:"props",children:"Props"}),`
`,e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Prop"}),e.jsx("th",{children:"Type"}),e.jsx("th",{children:"Default"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"src"})}),e.jsx("td",{children:e.jsx("code",{children:"string"})}),e.jsx("td",{children:"(required)"}),e.jsx("td",{children:"Image source URL"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"alt"})}),e.jsx("td",{children:e.jsx("code",{children:"string"})}),e.jsx("td",{children:"(required)"}),e.jsx("td",{children:"Alt text for accessibility. Pass empty string for decorative images."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"config"})}),e.jsx("td",{children:e.jsx("code",{children:"ImageZoomConfig"})}),e.jsx("td",{children:e.jsx("code",{children:"{}"})}),e.jsx("td",{children:"Configuration object — all fields optional"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"className"})}),e.jsx("td",{children:e.jsx("code",{children:"string"})}),e.jsx("td",{children:"—"}),e.jsx("td",{children:"Additional CSS class for the root container"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"imageClassName"})}),e.jsx("td",{children:e.jsx("code",{children:"string"})}),e.jsx("td",{children:"—"}),e.jsxs("td",{children:["Additional CSS class for the ",e.jsx("code",{children:"<img>"})," element"]})]})]})]}),`
`,e.jsx(n.h2,{id:"configuration",children:"Configuration"}),`
`,e.jsxs(n.p,{children:["All configuration fields are optional. Unspecified fields use sensible defaults via ",e.jsx(n.code,{children:"DEFAULT_CONFIG"}),"."]}),`
`,e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Field"}),e.jsx("th",{children:"Type"}),e.jsx("th",{children:"Default"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"zoomLevel"})}),e.jsx("td",{children:e.jsx("code",{children:"number"})}),e.jsx("td",{children:e.jsx("code",{children:"3"})}),e.jsx("td",{children:"Zoom magnification level. Clamped to nearest supported value: 1.5, 2, 2.5, or 3."})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"transitionDuration"})}),e.jsx("td",{children:e.jsx("code",{children:"number"})}),e.jsx("td",{children:e.jsx("code",{children:"300"})}),e.jsx("td",{children:"Transition duration in milliseconds for the zoom animation."})]})]})]}),`
`,e.jsx(n.h3,{id:"supported-zoom-levels",children:"Supported Zoom Levels"}),`
`,e.jsx(n.p,{children:"The component supports four discrete zoom levels. Any numeric value is clamped to the nearest supported level (ties break upward)."}),`
`,e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Level"}),e.jsx("th",{children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"1.5"})}),e.jsx("td",{children:"Subtle magnification"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"2"})}),e.jsx("td",{children:"Moderate magnification"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"2.5"})}),e.jsx("td",{children:"Strong magnification"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"3"})}),e.jsx("td",{children:"Maximum magnification (default)"})]})]})]}),`
`,e.jsx(n.h2,{id:"theming",children:"Theming"}),`
`,e.jsxs(n.p,{children:["ImageZoom is themed through CSS custom properties. The tiers, their naming patterns, and their ownership rules are documented once, in ",e.jsx(n.code,{children:"@ay/ui-library"}),": see ",e.jsx(n.a,{href:"https://github.com/pemre/ay-stack/blob/main/packages/ui-library/TOKEN-ARCHITECTURE.md",rel:"nofollow",children:"TOKEN-ARCHITECTURE.md"}),"."]}),`
`,e.jsxs(n.p,{children:["What matters here: the block consumes semantic tokens from ",e.jsx(n.code,{children:"@ay/ui-library"})," and exposes its own ",e.jsx(n.code,{children:"--image-zoom-*"})," component tokens for overrides."]}),`
`,e.jsx(n.p,{children:"Override any component token to customize the look:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-css",children:`.my-wrapper .image-zoom {
  --image-zoom-bg: #0a0a1a;
  --image-zoom-border: #333;
  --image-zoom-placeholder-bg: #1a1a2e;
  --image-zoom-placeholder-text: #aaa;
}
`})}),`
`,e.jsxs(n.p,{children:["Theme switching works automatically via the ",e.jsx(n.code,{children:"data-theme"})," attribute on a parent element:"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-html",children:`<div data-theme="dark">
  <ImageZoom src="/photo.jpg" alt="Night sky" />
</div>
`})}),`
`,e.jsx(n.h3,{id:"available-component-tokens",children:"Available Component Tokens"}),`
`,e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Token"}),e.jsx("th",{children:"Maps to"}),e.jsx("th",{children:"Purpose"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"--image-zoom-bg"})}),e.jsx("td",{children:e.jsx("code",{children:"--color-bg-body"})}),e.jsx("td",{children:"Container background"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"--image-zoom-surface"})}),e.jsx("td",{children:e.jsx("code",{children:"--color-bg-surface"})}),e.jsx("td",{children:"Surface elements"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"--image-zoom-text"})}),e.jsx("td",{children:e.jsx("code",{children:"--color-text-primary"})}),e.jsx("td",{children:"Primary text"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"--image-zoom-border"})}),e.jsx("td",{children:e.jsx("code",{children:"--color-border-default"})}),e.jsx("td",{children:"Borders"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"--image-zoom-placeholder-bg"})}),e.jsx("td",{children:e.jsx("code",{children:"--color-bg-surface-alt"})}),e.jsx("td",{children:"Placeholder / error fallback background"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"--image-zoom-placeholder-text"})}),e.jsx("td",{children:e.jsx("code",{children:"--color-text-secondary"})}),e.jsx("td",{children:"Placeholder / error fallback text"})]})]})]}),`
`,e.jsx(n.h2,{id:"edge-cases",children:"Edge Cases"}),`
`,e.jsx(n.h3,{id:"empty-source",children:"Empty Source"}),`
`,e.jsxs(n.p,{children:["When no ",e.jsx(n.code,{children:"src"})," is provided, the component renders a placeholder state instead of an ",e.jsx(n.code,{children:"<img>"})," element:"]}),`
`,e.jsx(i,{of:a}),`
`,e.jsx(n.h3,{id:"image-load-failure",children:"Image Load Failure"}),`
`,e.jsxs(n.p,{children:["If the image fails to load, the ",e.jsx(n.code,{children:"alt"})," text is displayed as visible fallback content inside the container, styled with the placeholder tokens."]}),`
`,e.jsx(n.h3,{id:"decorative-images",children:"Decorative Images"}),`
`,e.jsxs(n.p,{children:["Pass an empty ",e.jsx(n.code,{children:"alt"})," string for decorative images. The container receives ",e.jsx(n.code,{children:'role="img"'})," to maintain accessibility semantics."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-tsx",children:`<ImageZoom src="/decorative-bg.jpg" alt="" />
`})}),`
`,e.jsx(n.h2,{id:"accessibility",children:"Accessibility"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["The ",e.jsx(n.code,{children:"alt"})," prop is applied directly to the ",e.jsx(n.code,{children:"<img>"})," element"]}),`
`,e.jsxs(n.li,{children:["Decorative images (",e.jsx(n.code,{children:'alt=""'}),") set ",e.jsx(n.code,{children:'role="img"'})," on the container"]}),`
`,e.jsxs(n.li,{children:["The container cursor is set to ",e.jsx(n.code,{children:"zoom-in"})," to signal interactivity"]}),`
`,e.jsx(n.li,{children:"On image load failure, the alt text is rendered as visible fallback content"}),`
`]}),`
`,e.jsx(n.h2,{id:"interactive-controls",children:"Interactive Controls"}),`
`,e.jsx(n.p,{children:"Use the controls panel below to experiment with all configuration options:"}),`
`,e.jsx(c,{})]})}function g(s={}){const{wrapper:n}={...d(),...s.components};return n?e.jsx(n,{...s,children:e.jsx(r,{...s})}):r(s)}export{g as default};
