import{j as e}from"./jsx-runtime-B_jdX55V.js";import{u as t,M as a,C as r}from"./blocks-DQXk3-t2.js";import{T as c,S as o}from"./Tokens.stories-bxmGuCzg.js";import"./iframe-CmaHmlH9.js";import"./preload-helper-DyxzNcLA.js";import"./index-BwQDkpGd.js";function i(s){const n={a:"a",code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",...t(),...s.components};return e.jsxs(e.Fragment,{children:[e.jsx(a,{of:c}),`
`,e.jsx(n.h1,{id:"design-tokens",children:"Design tokens"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"@ay/ui-library"})," owns the AY core and semantic CSS variables. Blocks consume semantic values and declare their own component-scoped variables."]}),`
`,e.jsx(r,{of:o}),`
`,e.jsx(n.h2,{id:"plain-css",children:"Plain CSS"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-css",children:`@import "@ay/ui-library/styles.css";
`})}),`
`,e.jsx(n.p,{children:"This imports the plain token entry and all library component styles."}),`
`,e.jsx(n.h2,{id:"tailwind-v4",children:"Tailwind v4"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-css",children:`@import "tailwindcss";
@import "@ay/ui-library/theme.css";
`})}),`
`,e.jsxs(n.p,{children:["Import the AY theme after Tailwind so its ",e.jsx(n.code,{children:"@theme static"})," block extends Tailwind's default theme."]}),`
`,e.jsx(n.h2,{id:"theme-switching",children:"Theme switching"}),`
`,e.jsxs(n.p,{children:["Set ",e.jsx(n.code,{children:'data-theme="dark"'})," on an ancestor to switch semantic values without changing component code."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-html",children:`<html data-theme="dark"></html>
`})}),`
`,e.jsxs(n.p,{children:["For tier ownership, naming rules, and component-token guidance, see ",e.jsx(n.a,{href:"../../TOKEN-ARCHITECTURE.md",children:"TOKEN-ARCHITECTURE.md"}),"."]})]})}function j(s={}){const{wrapper:n}={...t(),...s.components};return n?e.jsx(n,{...s,children:e.jsx(i,{...s})}):i(s)}export{j as default};
