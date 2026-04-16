# Requirements Document

## Introduction

Build a reusable, highly customizable D3-based spiral timeline React component (`SpiralTimeline`) as the first block inside an independent, standalone design system npm package (`ay-ui-library`, "🌜 Ay UI Library"). This package is a completely separate project from the Bürküt app — it has its own repository, `package.json`, TypeScript configuration, build pipeline, and Storybook setup. Bürküt will consume it as an npm dependency in the future.

The component displays data items on a spiral where each concentric ring represents one calendar year, months are arranged as radial sectors, and data nodes are plotted at their calendar positions. The component supports configurable zoom, fog, ring gradients, animations, custom data-node shapes, and a draggable time-window slider.

During local development, the `npm link` workflow allows the developer to work on the design system package and see changes reflected in the Bürküt app simultaneously without publishing. When ready, the package is published to npm and Bürküt updates its `package.json` version.

This phase focuses on building the standalone component and its design system infrastructure. Full integration into the Bürküt app's WidgetGrid layout system is deferred to a later phase. However, the component's data interfaces are designed to be compatible with Bürküt's content data structure to minimize friction during future integration.

The package includes open-source-quality project documentation (README, contributing guide, changelog) and Kiro steering documents so that AI-assisted development of new blocks can proceed with full project context.

Each implementation step must produce a working component — no breaking intermediate states.

## Glossary

- **Spiral_Timeline**: The D3-powered SVG visualization React component that renders data items on a spiral where each concentric ring represents one calendar year and months are arranged as radial sectors.
- **Block**: An independent, self-contained UI component living in the design system package's `src/blocks/` directory, designed for reuse across projects.
- **Design_System_Package**: The standalone npm package project (`ay-ui-library`) that lives in its own directory outside the Bürküt app, with its own `package.json`, TypeScript config, build pipeline, and Storybook setup. It is publishable to npm and consumable by Bürküt (or any React project) as a dependency.
- **Storybook_Story**: A Storybook story file (`.stories.tsx`) that renders a Block component with interactive controls (args/controls), autodocs, interaction tests (play functions), and MDX documentation pages, serving as both documentation and a development sandbox.
- **Time_Window**: The draggable slider control at the bottom of the Spiral_Timeline that selects which range of years is visible on the spiral.
- **Fog_Effect**: A configurable opacity fade applied to outer (older) rings of the spiral to create depth.
- **Ring_Gradient**: A configurable color scheme applied to spiral rings and year labels using D3 color interpolators (spectral, rainbow, cool, warm).
- **Data_Node**: A shaped SVG marker (circle, square, triangle, star, pentagon) plotted on the spiral at the calendar position of a data item.
- **Config_Object**: The TypeScript configuration interface that controls all customizable aspects of the Spiral_Timeline (zoom, fog, ring gradient, animations, node types, label positions).
- **Content_Item**: A Bürküt content entry parsed from Markdown front matter, containing at minimum a date, title, group, and optional geographic/descriptive metadata. Used as the reference data shape for interface compatibility.
- **Steering_Document**: A Markdown file placed in a project's `.kiro/steering/` directory that provides Kiro (the AI assistant) with persistent context about the project's tech stack, structure, conventions, and workflows, enabling Kiro to assist effectively without repeated explanation.

## Requirements

### Requirement 1: Design System Package Setup

**User Story:** As a developer, I want a standalone, publishable npm package project with Storybook, so that I can develop, test, document, and demo Block components independently of the Bürküt app, and consume the package via npm in any React project.

#### Acceptance Criteria

1. THE Design_System_Package SHALL be a standalone project directory (e.g. `ay-ui-library/`) with its own `package.json` defining the package name, version, entry points (`main`, `module`, `types`), peer dependencies (React, ReactDOM), and build/dev scripts.
2. THE Design_System_Package SHALL include its own `tsconfig.json` configured for TypeScript strict mode, React JSX, and declaration file generation (`.d.ts`) so that consumers get full type safety.
3. THE Design_System_Package SHALL include a Storybook configuration (`.storybook/` directory) that discovers story files from `src/blocks/` and renders them in a development server with the Bürküt CSS custom properties (core and semantic tokens) loaded for correct theming.
4. THE Design_System_Package SHALL include npm scripts for: starting the Storybook dev server, building a static Storybook site, building the package for distribution, running Block component tests, and linting.
5. THE Design_System_Package SHALL include a build pipeline (e.g. Vite library mode or tsup) that produces ESM and CJS bundles with TypeScript declaration files, suitable for npm publishing.
6. THE Design_System_Package SHALL support the `npm link` workflow so that a developer can link the local package into the Bürküt app's `node_modules` during development and see changes reflected without publishing.
7. THE Design_System_Package SHALL support `npm publish` for production distribution, with a properly configured `files` field in `package.json` to include only the built output and type declarations.
8. THE Design_System_Package SHALL include a top-level `README.md` documenting the project purpose, setup instructions (including `npm link` workflow), available scripts, package consumption guide, and contribution guidelines at open-source-quality standards.

### Requirement 2: Blocks Architecture

**User Story:** As a developer, I want the spiral timeline to live in the design system package's `src/blocks/` directory as an independent block, so that it can be developed, tested, and demoed without any coupling to the Bürküt app.

#### Acceptance Criteria

1. THE Spiral_Timeline SHALL reside in the Design_System_Package at `src/blocks/SpiralTimeline/SpiralTimeline.tsx` with co-located `SpiralTimeline.css`, `SpiralTimeline.test.tsx`, and `SpiralTimeline.stories.tsx` files.
2. THE Spiral_Timeline SHALL have zero import dependencies on Bürküt app-level modules (no imports from the Bürküt project's `App.tsx`, `config.ts`, `WidgetGrid`, `Sidebar`, `ContentPanel`, or any hook outside the design system package).
3. THE Spiral_Timeline SHALL accept all external dependencies (data, callbacks, locale) via props, making the component portable across projects.
4. THE Design_System_Package `src/` directory SHALL include a barrel `index.ts` that re-exports all Block components and their public TypeScript types as the package's public API.

### Requirement 3: Spiral Timeline React Component

**User Story:** As a developer, I want a standalone React component that renders the D3 spiral timeline, so that it can be reused and configured independently of the HTML prototype.

#### Acceptance Criteria

1. THE Spiral_Timeline SHALL accept a `data` prop containing an array of Data_Node objects, each with at minimum `date` (Date), `type` (string), `title` (string), and `content` (string) fields.
2. THE Spiral_Timeline SHALL accept a `config` prop conforming to the Config_Object interface that controls all visual and behavioral aspects of the visualization.
3. THE Spiral_Timeline SHALL provide sensible defaults for all Config_Object fields so that rendering with only a `data` prop produces a functional visualization.
4. THE Spiral_Timeline SHALL render an SVG element containing concentric spiral rings, radial month grid lines, month labels, year markers, seasonal background wedges, and Data_Node markers.
5. THE Spiral_Timeline SHALL use D3 (v7) only for SVG math, scales, and data joins — not for DOM creation outside the SVG element.
6. THE Spiral_Timeline SHALL clean up all D3 selections and event listeners on unmount to prevent memory leaks.

### Requirement 4: Configuration Interface

**User Story:** As a developer, I want a comprehensive TypeScript configuration interface for the spiral timeline, so that every visual and behavioral aspect can be customized by consumers.

#### Acceptance Criteria

1. THE Config_Object SHALL expose a `yearsToShow` numeric field controlling the initial number of visible year rings (default: 2).
2. THE Config_Object SHALL expose a `yearLabelPosition` field accepting one of `top`, `right`, `bottom`, `left`, `top-right`, `top-left`, `bottom-right`, `bottom-left` (default: `top`).
3. THE Config_Object SHALL expose a `zoom` object with `speed` (number), `mouseWheel` (boolean), `slider` (boolean), and `buttons` (boolean) fields controlling zoom behavior.
4. THE Config_Object SHALL expose a `fog` object with `enabled` (boolean), `startRing` (number), and `intensity` (number) fields controlling the Fog_Effect.
5. THE Config_Object SHALL expose a `ringGradient` object with `enabled` (boolean), `scale` (string enum of color interpolator names), and `applyTo` (array of `grid` | `labels`) fields controlling the Ring_Gradient.
6. THE Config_Object SHALL expose an `animations` object with `enabled` (boolean) and `duration` (number in milliseconds) fields controlling transition animations.
7. THE Config_Object SHALL expose a `types` array where each entry defines a `key` (string), `color` (string), and `shape` (one of `circle`, `square`, `triangle`, `star`, `pentagon`) for mapping data-node types to visual representations.
8. THE Config_Object SHALL expose an optional `onNodeClick` callback `(node: DataNode, event: MouseEvent) => void` invoked when a user clicks a Data_Node.

### Requirement 5: Spiral Rendering and Geometry

**User Story:** As a user, I want the spiral to accurately map calendar dates to angular positions and radial distances, so that I can visually locate events in time.

#### Acceptance Criteria

1. THE Spiral_Timeline SHALL map each year to one full rotation (360°) of the spiral, with January at the 12-o'clock position.
2. THE Spiral_Timeline SHALL compute radial distance proportionally so that the innermost visible ring represents the most recent year and outer rings represent progressively older years.
3. THE Spiral_Timeline SHALL render 12 radial grid lines separating months, with gradient opacity increasing from center to edge.
4. THE Spiral_Timeline SHALL render month labels at the outer edge of the spiral beyond the outermost ring.
5. THE Spiral_Timeline SHALL render year marker dots and labels at the configured `yearLabelPosition` angle on each ring boundary.
6. THE Spiral_Timeline SHALL render seasonal background wedges (winter-blue, spring-yellow/green, summer-green, autumn-orange) with radial gradient opacity behind the spiral grid.
7. WHEN the visible year range changes, THE Spiral_Timeline SHALL animate spiral segments, year markers, and Data_Nodes from their previous positions to their new positions using D3 transitions with the configured duration.

### Requirement 6: Time Window Slider

**User Story:** As a user, I want a draggable time-window slider so that I can pan across the full date range of the data and choose which years are visible on the spiral.

#### Acceptance Criteria

1. THE Time_Window SHALL display a horizontal track representing the full date range of the provided data, with tick marks and labels for each year.
2. THE Time_Window SHALL render a draggable window indicator whose width represents the number of currently visible years relative to the total data range.
3. WHEN the user drags the window indicator, THE Spiral_Timeline SHALL update the visible year range in real time with animated transitions.
4. WHEN the user clicks on the track outside the window indicator, THE Spiral_Timeline SHALL center the window on the clicked position.
5. THE Time_Window SHALL display the current window range (start year — end year) as a label inside the draggable indicator.
6. THE Time_Window SHALL display summary information (number of spiral rings and total data years) below the track.

### Requirement 7: Zoom Controls

**User Story:** As a user, I want zoom controls to increase or decrease the number of visible years on the spiral, so that I can focus on a specific period or see a broader overview.

#### Acceptance Criteria

1. WHEN `zoom.buttons` is true, THE Spiral_Timeline SHALL render increment/decrement buttons that adjust `yearsToShow` by 1, clamped between 1 and the total number of data years.
2. WHEN `zoom.slider` is true, THE Spiral_Timeline SHALL render a range slider that sets `yearsToShow` directly.
3. WHEN `zoom.mouseWheel` is true AND the user scrolls the mouse wheel over the SVG area, THE Spiral_Timeline SHALL adjust `yearsToShow` (scroll up = fewer years/zoom in, scroll down = more years/zoom out).
4. WHEN `yearsToShow` changes, THE Spiral_Timeline SHALL clamp the Time_Window start so that the window remains within the valid data range.

### Requirement 8: Data Node Interaction

**User Story:** As a user, I want to hover over and click data nodes on the spiral to see details and navigate to content, so that the visualization is interactive and useful.

#### Acceptance Criteria

1. WHEN the user hovers over a Data_Node, THE Spiral_Timeline SHALL display a tooltip near the cursor showing the node's title, content summary, and formatted date.
2. WHEN the user moves the cursor away from a Data_Node, THE Spiral_Timeline SHALL hide the tooltip.
3. WHEN the user clicks a Data_Node, THE Spiral_Timeline SHALL invoke the `onNodeClick` callback from the Config_Object with the clicked node's data and the mouse event.
4. THE Data_Node elements SHALL have `role="button"`, `tabindex="0"`, and an `aria-label` containing the node title and formatted date for keyboard accessibility.

### Requirement 9: Fog and Ring Gradient Effects

**User Story:** As a user, I want configurable visual effects on the spiral rings so that the visualization has depth and the most relevant (recent) data stands out.

#### Acceptance Criteria

1. WHILE `fog.enabled` is true, THE Spiral_Timeline SHALL reduce the opacity of spiral segments and data nodes on rings beyond `fog.startRing`, scaling opacity down by `fog.intensity` proportionally to distance from center.
2. WHILE `ringGradient.enabled` is true AND `ringGradient.applyTo` includes `grid`, THE Spiral_Timeline SHALL color spiral ring segments using the selected D3 color interpolator (`spectral`, `rainbow`, `cool`, `warm`).
3. WHILE `ringGradient.enabled` is true AND `ringGradient.applyTo` includes `labels`, THE Spiral_Timeline SHALL color year marker dots and labels using the selected D3 color interpolator.
4. WHILE `fog.enabled` is false, THE Spiral_Timeline SHALL render all rings at uniform opacity.

### Requirement 10: Theme and Design System Compliance

**User Story:** As a developer, I want the spiral timeline block to follow the Bürküt design token architecture so that it looks consistent in both light and dark themes and can be themed independently in the design system context.

#### Acceptance Criteria

1. THE Spiral_Timeline CSS SHALL use semantic design tokens (e.g. `--color-bg-surface`, `--color-border-default`, `--color-text-primary`, `--color-text-secondary`, `--color-primary`) instead of hardcoded color values.
2. WHEN the active theme changes (via `data-theme` attribute or CSS custom property overrides), THE Spiral_Timeline SHALL update its colors automatically via CSS custom property inheritance.
3. THE Spiral_Timeline SHALL define component-level CSS custom properties (e.g. `--spiral-bg`, `--spiral-tooltip-bg`) in its co-located CSS file, mapping to semantic tokens.
4. THE Design_System_Package Storybook setup SHALL provide the Bürküt CSS custom properties (core and semantic tokens) so that Block components render with correct theming in stories.

### Requirement 11: Internationalization

**User Story:** As a developer, I want the spiral timeline to support localized labels and date formatting, so that it works in any locale without hard-coded strings.

#### Acceptance Criteria

1. THE Spiral_Timeline SHALL accept an optional `locale` prop (string, e.g. `"tr"`, `"en"`, `"zh"`) and use it for month label rendering and date formatting via the `Date` locale API.
2. WHEN no `locale` prop is provided, THE Spiral_Timeline SHALL default to the browser's locale.
3. THE Spiral_Timeline control labels (zoom label, time window label, summary text) SHALL accept localized strings via a `labels` prop on the Config_Object, with English defaults.
4. THE Spiral_Timeline tooltip date SHALL be formatted using `toLocaleDateString` with the provided `locale` prop value.

### Requirement 12: Responsive Sizing

**User Story:** As a user, I want the spiral timeline to adapt to its container size so that it looks correct whether the container is small or expanded.

#### Acceptance Criteria

1. THE Spiral_Timeline SHALL compute its spiral radius based on the current container width and height, using the smaller dimension to prevent overflow.
2. WHEN the container is resized, THE Spiral_Timeline SHALL recalculate geometry and re-render within 200ms using a debounced resize observer.
3. THE Time_Window slider SHALL scale its track width to fill the available container width minus padding.
4. IF the container width falls below 300px, THEN THE Spiral_Timeline SHALL hide the zoom control panel to avoid UI clutter.

### Requirement 13: Storybook Stories with Interactive Configuration

**User Story:** As a developer, I want comprehensive Storybook stories for the spiral timeline that let me toggle and customize all configuration options interactively, run interaction tests, and browse auto-generated documentation, so that I can explore the component's full API without editing code.

#### Acceptance Criteria

1. THE Storybook_Story file SHALL include a default story rendering the Spiral_Timeline with sample data and default configuration, using Storybook args for all Config_Object fields.
2. THE Storybook_Story file SHALL expose Storybook controls (via argTypes) for every field in the Config_Object, including nested fields (zoom.mouseWheel, fog.enabled, fog.startRing, ringGradient.scale, animations.duration, yearLabelPosition, yearsToShow, and all others).
3. THE Storybook_Story file SHALL include a story demonstrating each data-node shape (circle, square, triangle, star, pentagon) with labeled examples.
4. THE Storybook_Story file SHALL include a story demonstrating theme switching (light and dark) within the Storybook environment.
5. THE Storybook_Story file SHALL include a story demonstrating responsive behavior at different container sizes.
6. THE Storybook_Story file SHALL include a story with an empty data array to demonstrate the empty-state rendering.
7. THE Storybook_Story file SHALL include interaction tests (play functions using `@storybook/test`) that verify tooltip display on hover, zoom button clicks, and time-window slider drag behavior.
8. THE Storybook_Story file SHALL enable autodocs so that Storybook generates an automatic API documentation page from the component's props and JSDoc comments.
9. THE Design_System_Package SHALL include an MDX documentation page alongside the stories providing a usage guide, configuration examples, and theming instructions within the Storybook UI.

### Requirement 14: Data Interface Compatibility

**User Story:** As a developer, I want the spiral timeline's data interface to be compatible with Bürküt's content data structure, so that future integration into the app requires minimal adapter code.

#### Acceptance Criteria

1. THE Data_Node interface SHALL include a `date` (Date), `type` (string), `title` (string), and `content` (string) field, matching the shape derivable from Bürküt Content_Item front matter (`date`/`startDate`, `title`, `group`, truncated body).
2. THE Data_Node interface SHALL support an optional `id` (string) field for stable keying during data updates.
3. THE Data_Node interface SHALL support an optional `metadata` (Record<string, unknown>) field for passing through additional Content_Item front-matter fields without breaking the interface.
4. THE Spiral_Timeline SHALL export its `DataNode`, `SpiralTimelineConfig`, and `SpiralTimelineProps` TypeScript types from the package barrel so that consumers can import them for type-safe integration.

### Requirement 15: Component Documentation

**User Story:** As a developer, I want the spiral timeline to be documented like a best-in-class open source component, so that any developer can understand, configure, and integrate it quickly.

#### Acceptance Criteria

1. THE Spiral_Timeline block directory SHALL include a `README.md` with: a feature overview, a visual screenshot or GIF, installation/setup instructions (both npm install and npm link), a minimal usage example, and a link to the Storybook stories for interactive demos.
2. THE `README.md` SHALL include a complete API reference table documenting every prop, its type, default value, and description.
3. THE `README.md` SHALL include a configuration reference section documenting every Config_Object field, its type, default value, and effect on the visualization.
4. THE `README.md` SHALL include a "Data Format" section documenting the Data_Node interface with examples showing how to map common data shapes to the expected format.
5. THE `README.md` SHALL include a "Theming" section explaining how to override component CSS custom properties and how the three-tier token architecture applies.
6. THE `README.md` SHALL include a "Contributing" section with development setup instructions, testing commands, and coding conventions.
7. THE Storybook autodocs and MDX documentation pages SHALL complement the README by providing interactive, in-browser documentation accessible from the Storybook UI.

### Requirement 16: Design_System_Package Documentation

**User Story:** As a developer, I want the Design_System_Package to be documented like a best-in-class open source UI library project, so that any developer can understand, configure, and integrate it quickly.

#### Acceptance Criteria

1. THE Design_System_Package SHALL include a top-level `README.md` with a project title ("🌜 Ay UI Library"), a concise tagline, and a badge section displaying build status, npm version, and license.
2. THE `README.md` SHALL include a "Philosophy & Design Principles" section explaining the library's approach to component design, theming, accessibility, and the relationship between the Design_System_Package and the Bürküt app.
3. THE `README.md` SHALL include a "Quick Start" section with step-by-step installation instructions covering both `npm install ay-ui-library` for published usage and the `npm link` workflow for local development alongside the Bürküt app.
4. THE `README.md` SHALL include a "Components" section listing every available Block component with a one-line description, import example, and a link to the corresponding Storybook demo page.
5. THE `README.md` SHALL include a "Theming & Design Tokens" section documenting the three-tier CSS custom property architecture (core, semantic, component), how to override tokens, and how light/dark theme switching works.
6. THE `README.md` SHALL include a "Contributing" section documenting development environment setup, the PR review process, coding standards (TypeScript strict mode, Biome linting, CSS custom properties), testing requirements (Vitest + Testing Library), and Storybook story conventions.
7. THE `README.md` SHALL include a "Changelog" section or link to a `CHANGELOG.md` file documenting the versioning policy (semantic versioning) and a record of notable changes per release.
8. THE `README.md` SHALL include a "License" section specifying the project's open-source license.
9. THE `README.md` SHALL include an "Available Scripts" section documenting every npm script defined in `package.json` with a description of its purpose.

### Requirement 17: Kiro Steering Documentation

**User Story:** As a developer, I want Kiro steering documents created for the ay-ui-library project, so that Kiro has full context about the project's tech stack, structure, conventions, and component development workflow when assisting with future development.

#### Acceptance Criteria

1. THE Design_System_Package SHALL include a `.kiro/steering/` directory containing Steering_Document files that provide Kiro with persistent project context.
2. THE Design_System_Package SHALL include a Steering_Document at `.kiro/steering/tech.md` documenting the tech stack (TypeScript, React, D3, Vite library mode, Storybook, Vitest, Biome), all build and dev commands, quality gate commands, TypeScript configuration, Biome configuration, and the CSS custom property design token architecture.
3. THE Design_System_Package SHALL include a Steering_Document at `.kiro/steering/structure.md` documenting the project directory layout (`src/blocks/`, `.storybook/`, `dist/`, `.kiro/steering/`), file co-location conventions (`.tsx`, `.css`, `.test.tsx`, `.stories.tsx` per block), barrel export patterns, and naming conventions.
4. THE Design_System_Package SHALL include a Steering_Document at `.kiro/steering/product.md` documenting the library's purpose, its relationship to the Bürküt app, the Block component model, the npm publishing and `npm link` consumption workflows, and the design philosophy.
5. THE Design_System_Package SHALL include a Steering_Document at `.kiro/steering/component-workflow.md` documenting the step-by-step process for adding a new Block component: file scaffolding, CSS custom property patterns, writing Vitest tests with Testing Library, creating Storybook stories with args/controls/autodocs/play functions, and updating the barrel export.
6. WHEN a developer uses Kiro to assist with the ay-ui-library project, THE Steering_Documents SHALL provide sufficient context for Kiro to generate code that follows the project's conventions without requiring repeated explanation of the tech stack, file structure, or coding standards.
