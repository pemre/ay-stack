# Icon Abstraction and Regression-Recovery Plan

## Purpose

Restore the iconography lost during `dashboard-engine-extraction`, then create a
stable icon API in `@ay/ui-library` that can be reused by Bürküt and future apps.
This plan is intentionally staged so visual parity is restored before optional
icon redesign or cleanup begins.

## Current findings

### Confirmed regressions

The pre-extraction `WidgetHeader` used `lucide-react` icons. The extracted
`WidgetShell` replaced them with emoji/text glyphs:

| Action | Pre-extraction icon | Current regression |
|---|---|---|
| Configure | `Settings`, size `14` | `⚙️` |
| Duplicate | `Copy`, size `14` | `📋` |
| Remove | `X`, size `14` | `🗑️` |
| Close | `X`, size `14` | `✕` |

Primary source:

- `packages/ui-library/src/dashboard/WidgetShell/WidgetShell.tsx`

The generated configuration panel has the same regression:

- Previous hand-written panels used Lucide `X`, size `14`, for close actions.
- The generated panel currently renders the text glyph `✕`.
- Source: `packages/ui-library/src/dashboard/ConfigPanel/GeneratedConfigPanel.tsx`

The old sidebar config panel also used Lucide `X`, size `10`, for removing tags.
The generated string-array control should preserve that smaller action-icon size.

### Existing icons to include in the abstraction

These existed before extraction, so they are not regressions, but they should be
included in the curated icon API and migrated to it:

- `📍` in `GeoMap`'s selected-location information row
- `Check`, `ChevronDown`, and `ChevronRight` in `TreeList`
- `Check` in `MarkdownViewer`
- The custom inline SVG donut chart in `ProgressPie`

Replacing the map pin with an equivalent `MapPinIcon` is an abstraction change,
not a visual redesign. Redesigning the progress chart remains out of scope.

## Architectural decision

The preferred implementation is to let both Bürküt and
`@ay/ui-library` consume the curated icon exports from
`@ay/ui-library`. This is a deliberate tradeoff, not an accidental dependency.

The resulting dependency direction is:

```text
@ay/ui-library <- @ay/ui-library <- @ay/ui-library <- burkut
       \______________________________^              /
                         burkut may also import both packages
```

There is no dependency cycle because `@ay/ui-library` does not import the
dashboard engine. The engine can import only the public icon entry point; it must
not import Bürküt blocks or app code.

### Why this is reasonable

- Both packages use the same visual icon language.
- The icons already belong to the UI layer and are implemented by the library.
- A single icon implementation prevents Bürküt and the engine drifting again.
- The widget shell is a UI component, so supplying its icon set from the UI
  library is practical rather than domain coupling.

### Costs and accepted harm

- `@ay/ui-library` is no longer independently consumable without
  `@ay/ui-library`.
- Engine consumers inherit the UI library's current dependency tree, including
  heavy block dependencies even when they only need icons.
- The roadmap criterion that the engine have no dependency on `@ay/ui-library`
  must be updated if this plan is implemented.
- A future split into `@ay/ui` (primitives/icons) and `@ay/widgets` (heavy
  blocks) becomes more valuable and should remove this dependency cost later.

For this repository, visual consistency is more important than preserving the
engine's current sibling-package independence. Keep the dependency explicit in
`packages/ui-library/package.json` and revisit it with the deferred
`@ay/ui`/`@ay/widgets` split.

## Target icon API in `@ay/ui-library`

Create a curated icon entry point in a new icon directory under the UI library's
source tree:

```text
<ui-library-source>/icons/
  SettingsIcon.tsx
  CopyIcon.tsx
  XIcon.tsx
  PlusIcon.tsx
  MoonIcon.tsx
  SunIcon.tsx
  GithubIcon.tsx
  RotateCcwIcon.tsx
  MapPinIcon.tsx
  CheckIcon.tsx
  ChevronDownIcon.tsx
  ChevronRightIcon.tsx
  index.ts
```

The wrappers should use `lucide-react` internally but should not expose the raw
Lucide component names as the library's public API.

Recommended exports:

```text
SettingsIcon
CopyIcon
XIcon
PlusIcon
MoonIcon
SunIcon
GithubIcon
RotateCcwIcon
MapPinIcon
CheckIcon
ChevronDownIcon
ChevronRightIcon
```

Prefer semantic names such as `SettingsIcon` and `CloseIcon` over an API that
leaks the implementation library. If both `XIcon` and `CloseIcon` are needed,
choose one public name and use it consistently; the historical parity mapping
is `XIcon` for both remove and close until a deliberate redesign is approved.

### Icon wrapper contract

Each wrapper should:

- Accept the relevant `lucide-react` SVG props.
- Preserve explicit `size`, `strokeWidth`, `className`, and color props.
- Default to decorative behavior when used inside an already-labelled button.
- Set `aria-hidden="true"` and `focusable="false"` for decorative usage.
- Avoid introducing a second accessible name when the parent button already has
  an `aria-label`.

Do not create a generic icon registry or export every Lucide icon in the first
iteration. Keep the public surface deliberately small and based on actual
workspace usage.

## Engine slot API

### `WidgetShell`

Add an optional icon-slot object to:

- `packages/ui-library/src/dashboard/WidgetShell/WidgetShell.tsx`

Suggested shape:

```ts
export interface WidgetShellIcons {
  config?: ReactNode;
  duplicate?: ReactNode;
  remove?: ReactNode;
  close?: ReactNode;
}
```

Add `icons?: WidgetShellIcons` to `WidgetShellProps`.

The engine should render the supplied nodes inside the existing action buttons.
It may import the curated icon components from `@ay/ui-library` for its default
shell icons, but it should not import raw `lucide-react`, Bürküt blocks, or app
code. Keep the slots available so another consumer can override the defaults.

If an icon slot is omitted, retain a valid button with its accessible label; do
not silently introduce an emoji fallback. The app adapter should provide icons
for the normal Bürküt path.

### `GeneratedConfigPanel`

Add icon slots to:

- `packages/ui-library/src/dashboard/ConfigPanel/GeneratedConfigPanel.tsx`

Suggested shape:

```ts
export interface GeneratedConfigPanelIcons {
  close?: ReactNode;
  removeTag?: (tag: string) => ReactNode;
}
```

Add `icons?: GeneratedConfigPanelIcons` to the panel props. Use the close icon
for the panel close button and the smaller remove icon for string-array chips.
The engine remains responsible for button semantics and labels; the consumer
supplies only visual icon nodes.

## Implementation phases

## Phase 1 — Restore Bürküt visual parity

1. Add `@ay/ui-library: workspace:^` to the engine's dependencies and keep the
   dependency limited to the public icon exports.
2. Create the curated icon wrappers in the planned UI-library icon directory.
3. Export them from that directory's `index.ts` barrel.
4. Export the icon components from the UI library's existing public barrel.
5. Add `WidgetShellIcons` and the `icons` prop to `WidgetShell`.
6. Add `GeneratedConfigPanelIcons` and the `icons` prop to
   `GeneratedConfigPanel`.
7. Update the engine and Bürküt's `WidgetGrid` adapter to use the shared icons:
   - `SettingsIcon size={14}` for configure
   - `CopyIcon size={14}` for duplicate
   - `XIcon size={14}` for remove
   - `XIcon size={14}` for close
8. Pass `XIcon` for generated-panel close and tag removal, preserving sizes
   `14` and `10` respectively.
9. Replace GeoMap's `📍` with `MapPinIcon` without changing its surrounding
   layout or text.
10. Remove the `⚙️`, `📋`, `🗑️`, and `✕` glyphs from dashboard controls.
11. Preserve existing CSS classes, button dimensions, aria labels, and click
   behavior so the change is icon-only.

### Phase 1 acceptance criteria

- Bürküt's widget action icons visually match the pre-extraction Lucide icons.
- No dashboard action renders an emoji or text-glyph substitute.
- `@ay/ui-library` has an explicit dependency on `@ay/ui-library` and
  imports only its curated icon API.
- `WidgetShell` and `GeneratedConfigPanel` remain usable without an icon package.
- Existing action callbacks and drag behavior remain unchanged.

## Phase 2 — Migrate existing direct Lucide call sites

After Phase 1 is visually verified, migrate the existing direct imports to the
curated library API:

| Current source | Current icons |
|---|---|
| `apps/burkut/src/App.tsx` | `Github`, `RotateCcw` |
| `apps/burkut/src/components/DashboardBar/DashboardBar.tsx` | `Plus`, `X` |
| `apps/burkut/src/components/ThemeToggle/ThemeToggle.tsx` | `Moon`, `Sun` |
| `packages/ui-library/src/blocks/GeoMap/GeoMapClient.tsx` | `📍` → `MapPinIcon` |
| `packages/ui-library/src/blocks/TreeList/TreeList.tsx` | `Check`, `ChevronDown`, `ChevronRight` |
| `packages/ui-library/src/blocks/MarkdownViewer/MarkdownViewerClient.tsx` | `Check` |

For each migration:

1. Replace the raw Lucide import with the corresponding `@ay/ui-library`
   export where appropriate.
2. Preserve the existing size and behavior exactly.
3. Preserve parent-button aria labels.
4. Keep the icon decorative when the parent already has an accessible name.
5. Confirm no app source still imports `lucide-react` directly before removing
   the direct app dependency.

`@ay/ui-library` should retain `lucide-react` as its implementation dependency.

### Phase 2 acceptance criteria

- All shared icon usage goes through the curated library exports.
- Bürküt no longer imports `lucide-react` directly, if no remaining app-local
  usage requires it.
- Existing icon sizes and stroke behavior remain visually unchanged.
- The library's public API exposes only intentionally supported icons.

## Phase 3 — Optional icon cleanup

Do not combine this phase with regression recovery.

Potential follow-ups:

- Decide whether remove actions should use `XIcon` for historical parity or a
  more explicit `Trash2Icon` for clearer semantics.
- Consider a library icon gallery Storybook story.
- Review whether other emoji/text symbols exist outside the confirmed list.

Each change in this phase requires an explicit visual decision because it can
change the pre-extraction appearance.

## Tests

### Icon wrapper tests

Add an icon-wrapper test file under the planned icon directory:

```text
<ui-library-source>/icons/icons.test.tsx
```

Cover:

- Each public wrapper renders an SVG.
- Decorative icons expose `aria-hidden="true"`.
- `focusable="false"` is present for decorative icons.
- Explicit `size` and `className` props are preserved.

### `WidgetShell` tests

Update:

```text
packages/ui-library/src/dashboard/src/WidgetShell/WidgetShell.test.tsx
```

Cover:

- Supplied config, duplicate, remove, and close nodes render in the correct
  buttons.
- Existing aria labels remain on the buttons.
- Icon nodes do not replace or duplicate accessible button names.
- Omitting icons does not crash the shell.
- No emoji/text fallback is rendered by the shell.

### Generated panel tests

Update:

```text
packages/ui-library/src/dashboard/src/ConfigPanel/GeneratedConfigPanel.test.tsx
```

Cover:

- Supplied close icon renders.
- Supplied remove-tag icon renders for each chip.
- Close and remove buttons retain their aria labels and callbacks.
- Existing field-kind behavior remains unchanged.

### Bürküt integration tests

Update the relevant Bürküt component tests to assert icon presence through
stable accessibility or test selectors rather than exact SVG implementation
markup. Avoid tests coupled to Lucide internals.

## Visual verification

Use the same viewport and content data before and after the change. Compare:

- Widget header icon size and stroke weight.
- Spacing between title and action icons.
- Configure, duplicate, remove, and close icon appearance.
- Generated config-panel close icon.
- String-array tag removal icon.
- Dashboard bar plus/close icons.
- Theme toggle icons.
- GitHub and reset-layout icons.

A screenshot comparison should confirm that this work restores icons without
changing layout, colors, typography, or widget dimensions.

## Commands to run

From the workspace root:

```bash
pnpm --filter @ay/ui-library typecheck
pnpm --filter @ay/ui-library lint
pnpm --filter @ay/ui-library test
pnpm --filter @ay/ui-library build

pnpm --filter @ay/ui-library typecheck
pnpm --filter @ay/ui-library lint
pnpm --filter @ay/ui-library test
pnpm --filter @ay/ui-library build

pnpm --filter burkut typecheck
pnpm --filter burkut test
pnpm --filter burkut build

AY_LOCAL=1 pnpm --filter burkut build

pnpm test:root
```

Finish with a manual dev-server check:

```bash
pnpm dev
```

Confirm the widget actions, generated config panels, dashboard tabs, theme
control, and app header all use the intended icons.

## Completion checklist

- [ ] Confirmed pre-extraction icon mapping is documented.
- [ ] Curated icon wrappers exist in `@ay/ui-library`.
- [ ] Icon wrappers are exported from the library barrel.
- [ ] `WidgetShell` receives icons through slots.
- [ ] `GeneratedConfigPanel` receives close and tag-remove icons through slots.
- [ ] Bürküt passes library icons to the engine.
- [ ] Emoji/text glyph regressions are removed from dashboard controls.
- [ ] Existing direct Lucide call sites are migrated where appropriate.
- [ ] Engine's explicit `@ay/ui-library` dependency is limited to curated icon
      exports.
- [ ] Accessibility tests pass.
- [ ] Engine, library, Bürküt, local-alias, and root tests pass.
- [ ] Manual visual comparison confirms icon parity.
- [ ] Optional icon redesign is kept separate from the parity fix.







