# ay-stack Roadmap

Roadmap for the **shared stack** — `@ay/tokens`, `@ay/ui-library`, and the
`@ay/dashboard-engine` to come.

This document is written to be delegated. Each phase states its entry criteria,
scope, explicit non-scope, exit criteria, and known risks, so an agent can pick up
a phase without reconstructing the reasoning.

---

## Where we are

`ay-monorepo-foundation` is complete.
`widget-purity-contract` is complete. The
workspace is a pnpm monorepo; design tokens are extracted to a single publishable
package; the component library is renamed to the `@ay/` scope; Bürküt lives under
`apps/burkut/`.

The migration's regression guard is a committed baseline of every pre-migration
custom property, resolved per consumer, in both themes. It currently passes
**78/78 for Bürküt** and **38/38 for `@ay/ui-library`** with exactly one accepted
deviation. That guard must stay green through every phase below.

| Phase | Spec | Status |
|-------|------|--------|
| 0 | `ay-monorepo-foundation` | finished |
| 1 | `widget-purity-contract` | finished |
| 2 | `dashboard-engine-extraction` | not started |
| 3 | `burkut-repo-extraction` | not started |
| 4 | second app | not started |

---

## Phase 1 — `widget-purity-contract`

**Goal.** Bring Bürküt's four widgets up to the props-driven contract
`SpiralTimeline` already implements, so they can become library Blocks.

**Why now.** This is the actual blocker for a shared component library, and it is
independent of the engine.

**Entry criteria.** Phase 0 complete.

**The problem, concretely.** Every one of the four widgets violates the contract:

| Widget | Coupling to remove |
|--------|--------------------|
| `Sidebar` | takes `ContentIndex`; reads `_isHeader`, `sidebarSort`, `group`; takes `completedSet` (progress tracker); calls `useTranslation()`; contains a BCE-date parser |
| `TimelinePanel` | takes `ContentIndex`, maps to vis-timeline items internally; `useTranslation()` |
| `MapPanel` | takes `ContentIndex`, reads `meta.location`/`meta.polygon`; hardcoded China center/zoom; hardcoded `ACCENT_COLOR`; calls `useTheme()` |
| `ContentPanel` | takes `ContentIndex` **and** `getContent(id)` — a data-access function as a prop; `isComplete`/`onToggleComplete` progress coupling |

Four distinct leaks: the domain model reaches every widget, i18n is resolved
inside components instead of passed as labels, `useTheme()` is imported directly,
and one widget takes a data-fetching callback.

A fifth leak is in the grid, not the widgets: `WidgetGrid` resolves the component
from the registry and then feeds it props via a **hardcoded `switch` on
`widgetTypeId`**, with config panels in a second hardcoded map. Adding a widget
type today means editing engine code in two places, which defeats the registry.

**Scope.**
1. Introduce view-model types (`TreeNode[]`, `TimelineItem[]`, `GeoFeature[]`,
   `{ markdown, title }`) and adapters in Bürküt mapping `ContentIndex` → view
   models. Widgets stop seeing the domain model.
2. Replace `useTranslation()` inside widgets with a `labels` prop object, following
   the existing `SpiralTimelineLabels` pattern.
3. Remove `useTheme()` from `MapPanel`; drive tile selection from a prop.
4. Give each widget `config` + `DEFAULT_CONFIG` merged per the library's convention.
5. Move the registry's prop wiring into registry-declared data contracts so the
   `switch` disappears.
6. **Schema versioning and a layout migration handler.** `.burkut/layouts/dashboard.json`
   is user-editable disk state with a `version: 1` field and no migration path.
7. **Only then** rename widget type IDs: `sidebar` → `tree-list`,
   `content` → `markdown-viewer`, `map` → `geo-map`, `timeline` → `linear-timeline`.
   `LinearTimeline` pairs with the existing `SpiralTimeline`.

**Ordering constraint.** Step 6 must precede step 7. `"sidebar"` is persisted to
users' disks; renaming without a migration handler turns every existing layout
into "Unknown Widget" placeholders.

**Out of scope.** `WidgetShell`, error boundaries, `@ay/dashboard-engine`, moving
any widget into `@ay/ui-library`. Purify in place; move later.

**Exit criteria.** All four widgets take view models, `labels`, and `config`; no
`useTranslation`/`useTheme` inside them; the prop-wiring `switch` is gone; a
migration handler upgrades a `version: 1` layout file; type IDs renamed; baseline
diff still green; Bürküt renders identically.

**Risks.** The adapters are where domain knowledge accumulates — keep them thin
and pure. `Sidebar`'s BCE-date parser and `sidebarSort` are genuinely
Bürküt-specific and belong in the adapter, not the Block.

---

## Phase 2 — `dashboard-engine-extraction`

**Goal.** Extract `@ay/dashboard-engine`: the grid, a real `WidgetShell`, the
registry, and schema-driven widget options.

**Entry criteria.** Phase 1 complete. Attempting this before the widgets are pure
means extracting coupling into a shared package.

**Scope.**
1. **`WidgetShell` with a real error boundary.** There is none today — grep for
   `ErrorBoundary|componentDidCatch` returns zero matches, so a throwing widget
   takes down the whole grid. `WidgetHeader` is currently a *sibling* of the body
   inside `WidgetGrid`, not a wrapper; no component owns the widget's boundary.
   This is the highest-value item in the whole migration and the literal
   "update once, all apps benefit" mechanism.
2. Suspense/loading and empty states in the shell.
3. Registry entries declare an **options schema**, and config panels are
   **generated from it** — deleting the four hand-written panels. This is Grafana's
   `setPanelOptions` pattern and the main payoff of adopting schemas.
4. Validate at the untrusted boundaries only: the persisted layout JSON and app
   schema config. Validate once on load, then it's TypeScript's job. Do **not**
   validate props on every render.
5. Target **Standard Schema** rather than hard-coupling to zod, so consumers
   aren't forced onto your validator.
6. Pluggable `PersistenceAdapter`. Cross-tab sync and persistence are genuinely
   reusable and belong in the engine, but `.burkut/layouts/dashboard.json` and the
   dev-server endpoints are Bürküt-specific — engine defines the interface, the app
   supplies the implementation.
7. Move the purified widgets into `@ay/ui-library` as Blocks with stories.

**Consider splitting the library.** `@ay/ui-library` currently mixes primitives
with heavy blocks. `Timeline` drags vis-timeline, `Map` drags Leaflet. Splitting
`@ay/ui` (primitives — Bürküt's `src/components/ui/` is the seed) from
`@ay/widgets` (heavy blocks) stops every app paying for both. Make
`react-leaflet` / `vis-timeline` optional peers or separate entry points.

**Out of scope.** Declarative app schemas, the pub/sub bus.

**Exit criteria.** A throwing widget shows a shell-level error instead of blanking
the grid; adding a widget type touches only the registry; config panels are
generated; the engine is publishable and does not depend on `@ay/ui-library`.

---

## Phase 3 — Inter-widget communication

**Goal.** Declarative wiring between widgets.

**Do not build this earlier.** There is exactly **one** real cross-widget signal
today: `selectedId`, held as `useState` in `App.tsx` and drilled through
`WidgetGrid`. It is not in the Zustand store. `activeGroup` is dead —
`WidgetGrid` passes `activeGroup=""` and `onSelectGroup={() => {}}`. Building a
general pub/sub for one channel is premature.

**Build it when** Bürküt's product Phase 5 (query bar, cross-widget filtering,
faceted counters) needs it.

**Design note that matters.** Use **stateful channels, not an event emitter.** A
widget mounting after a value was published still needs the current value — drag a
new Content widget onto a dashboard with something already selected and it must
show it. Event emitters drop that; a Zustand slice with last-value semantics does
not. Also budget for cycle prevention: `publishes`/`subscribesTo` makes the
dashboard a dataflow graph, and two widgets that both publish and subscribe to a
selection channel will loop.

Note that `broadcastMiddleware` is cross-*browser-tab* sync of the shared slice.
It is not an in-app widget bus. Different mechanisms; don't conflate them.

---

## Phase 4 — Extract Bürküt to its own repository

**Goal.** Bürküt becomes a standalone repo consuming published `@ay/*` packages.

**Entry criteria.** Phase 2 complete and `@ay/*` packages published, so the app has
something real to install.

**Scope.** Move `apps/burkut/` out; consume published versions; keep the Local Dev
Alias working via the `AY_LOCAL=1` Vite alias plus `resolve.dedupe`; move Bürküt's
Pages deploy back to its own repo.

**Known consequences.**
- Bürküt's Pages URL changes a second time, from `/ay-stack/burkut/` back to
  whatever the standalone repo serves. Expected, already recorded.
- The consolidated `deploy-pages.yml` loses its Bürküt build job; Storybook keeps
  the site root.
- `apps/burkut/package.json` deliberately retains `bin`, `files`, and `homepage`
  precisely so this move is mechanical.

**Then repeat for each new app** — music library, image gallery. Each is its own
GitHub repo with its own Kiro steering, consuming `@ay/*` from the registry. The
second app is the real test of whether the stack is reusable; expect it to surface
assumptions baked into Bürküt.

---

## Standing constraints

Read these before touching anything.

- **The baseline diff is the regression guard.** `tools/tokens/baseline.json` is the
  only record of the pre-migration world. Diff per consumer using `perSource`,
  never the merged maps. The allowlist holds exactly one entry, keyed by source
  path, and nothing may be added without a design decision.
- **Environment hazard:** something in this workspace reformats files after they
  are written — reindents to 4 spaces and has been observed corrupting template
  literals (`--absent-${i}` → `--absent - ${i}`). Re-read every generated file,
  prefer string concatenation in generated code, and finish with
  `pnpm biome format --write`. Requirement 10.9 mandates 2-space indent.
- **Dependency direction:** `@ay/tokens` ← `@ay/ui-library` ← app. Nothing imports
  from `apps/`. The engine must not depend on the block library.
- **The token architecture is stated exactly once**, in
  `packages/tokens/TOKEN-ARCHITECTURE.md`. Reference it with
  `#[[file:...]]`; never restate it. A root test enforces this.
- **Never write `npm link` or `yalc` into a document.** A root test asserts no
  document does. Use the Local Dev Alias.
- **Aim for schema-first layout and wiring, code for domain logic.** Fully
  declarative means every new behavior needs a new schema primitive. Keep the
  custom-widget escape hatch first-class. Chasing 100% "logicless" is where these
  architectures die.

---

## Deferred ledger

Consciously punted, with the reason. Pick these up when the listed condition holds.

| Item | Why deferred | Pick up when |
|------|--------------|--------------|
| Alpha suffix normalization — `a12`–`a30` are decimal percentages, `a44`/`a66` are hex alpha bytes, and the two amber shades express them in different notations | Normalizing shifts rendered alpha by up to 1/255, violating the zero-visual-change contract | A visual-diff budget exists |
| Dark core ramp — dark-block semantic literals (`#1c2128`, `#22272e`, …) aren't backed by core tokens | Would change nothing visually but inflate the migration diff | Any dark-theme redesign |
| Tailwind preflight scoping | Needs the Phase 0 task 21 visual check to know whether it changed anything | Task 21 reports a difference |
| Static build — the empty-`ContentGraph` fallback is a stopgap to unblock `vite build`, not a static-export feature | Real static export is Bürküt product Phase 6 | Bürküt Phase 6 |
| Property 7's wording is stricter than the design's own `SpiralTimeline` snippet, which reaches the core tier inside the component-token mapping block | Implemented as intended: core `var()` only on the right-hand side of a component-token declaration | Revisiting the design doc |
| `@ay/ui-library` re-exporting the token stylesheet as a subpath | Ergonomic win, not required for correctness | Any consumer trips on import order |
| Splitting `@ay/ui` primitives from `@ay/widgets` heavy blocks | Only matters once a third consumer exists | Phase 2 or the second app |
