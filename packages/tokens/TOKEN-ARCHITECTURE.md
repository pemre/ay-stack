# Token Architecture

The authoritative statement of the three-tier token architecture, its naming
patterns, and its tier ownership rules. Every other document in this workspace
references this file rather than restating it.

## The three tiers

| Tier | Naming pattern | Example | Declared in | Referenced by |
| --- | --- | --- | --- | --- |
| **Core** | `--{category}-{name}-{scale}` | `--color-amber-500`, `--space-2`, `--radius-md`, `--duration-fast` | `@ay/tokens` — `src/core.css` | the semantic tier only |
| **Semantic** | `--{category}-{context}` | `--color-primary`, `--color-bg-surface`, `--color-border-default`, `--radius-control` | `@ay/tokens` — `src/semantic.css` | component CSS, application CSS |
| **Component** | `--{component}-{property}` | `--btn-height`, `--spiral-radius` | the component's own CSS file | that component's rules only |

Core tokens are raw, context-free design values. They carry no meaning about
where they are used, and component CSS never references them directly — a
component that reaches into the core tier cannot be re-themed, because there is
no indirection left to change.

Semantic tokens carry meaning, reference core values, and are re-declared per
theme. This is the tier components consume.

Component tokens stay with their component and are never centralized. They exist
so a component can name its own dimensions and map them onto semantic tokens in
one place.

## Ownership rules

1. `@ay/tokens` owns the core and semantic tiers, and only those. It declares no
   component token, no application-specific token, and no legacy alias.
2. No consumer declares a core or semantic token. A consumer that needs a new
   shared value adds it here; a consumer that needs a private value declares it in
   its own tier (component or application).
3. Component CSS references the semantic and component tiers only.
4. Application-specific values — Bürküt's `--tl-bg-*` timeline layers, its
   `--vis-*` overrides, `--font-serif` — belong to the application, not here.
5. The semantic tier is declared in `:root` and re-declared in full in
   `[data-theme="dark"]`. Every semantic token exists in both blocks, so theme
   switching is a matter of the cascade rather than of the compiler.

## Where each tier lives at runtime

The core tier is authored inside a Tailwind v4 `@theme static` block. Tailwind
emits theme variables as CSS custom properties *and* registers utility
namespaces, so one declaration produces both. `static` is required: without it
Tailwind emits only the variables it observes used as utilities, and these tokens
are consumed through hand-authored `var()` references, so they would be dropped.

The semantic tier stays out of `@theme`. `@theme` must be top level and cannot
express a selector such as `[data-theme="dark"]`, and theme variables that
reference other variables need the `inline` option, which bakes the referenced
value into every generated utility — freezing the light value and breaking theme
switching. Runtime-theme-switched tokens must remain plain custom properties.

The build derives a Tailwind-free copy of the core tier by rewriting
`@theme static { … }` to `:root { … }`. That rewrite is the only transformation;
values are never touched, so the Tailwind entry and the plain entry declare
identical names with identical values.

## Naming conventions worth knowing

- Alpha variants suffix the base color: `--color-amber-500-a20`.
- The suffix convention is internally inconsistent and deliberately preserved:
  `a12`–`a30` read as decimal alpha percentages, while `a44` and `a66` are hex
  alpha bytes carried over from the original hex literals (`0x44` ≈ 0.267,
  `0x66` = 0.400). Normalizing would change rendered alpha by up to 1/255.
  `src/core.css` documents this in place.
- Status colors are named `--color-status-{state}` with an optional `-subtle`
  companion, leaving room for `warning`, `danger`, and `info` siblings without a
  rename.
