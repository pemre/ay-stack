---
inclusion: auto
---

# Post-Implementation Checklist

After completing any feature or bugfix spec:

1. **Update `apps/burkut/README.md`** — reflect new features, changed behavior, or
   updated project structure.
2. **Update steering docs** (`apps/burkut/.kiro/steering/`) — keep `structure.md`,
   `tech.md`, and `product.md` in sync with any architectural, tooling, or product
   change. Do not restate the token tier architecture; reference
   #[[file:packages/ui-library/TOKEN-ARCHITECTURE.md]] instead.
3. **Check whether the change belongs in a package instead.** A shared token change
   belongs in `packages/ui-library/`, a reusable component in `packages/ui-library/`,
   and a workspace-wide change (scripts, catalog versions, layout) in the root
   `README.md` and root steering.
4. **Run `pnpm verify` at the workspace root** so every package's quality gates are
   green, not just Bürküt's.

These updates should be included as tasks in every spec's `tasks.md`.
