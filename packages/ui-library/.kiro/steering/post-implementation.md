# Post-Implementation Checklist

Step-by-step guide for maintaining documentation and versioning after implementing
a feature or fixing a bug in `@ay/ui-library`.

# Checklist

After completing any feature or bugfix spec:

1. **Update `packages/ui-library/README.md` and `packages/ui-library/CHANGELOG.md`** —
   reflect new features, changed behavior, or updated package structure.
2. **Update steering docs** (`packages/ui-library/.kiro/steering/`) — keep every
   markdown file in sync with architectural, tooling, or product changes. Do not
   restate the token tier architecture; reference
   #[[file:packages/tokens/TOKEN-ARCHITECTURE.md]] instead.
3. **Update `packages/ui-library/package.json` version** per Semantic Versioning
   (patch for bugfixes, minor for new features, major for breaking changes).
4. **Check whether the change crosses a package boundary.** A token change belongs
   in `packages/tokens/`, and its release notes belong there too. A change that
   affects the workspace as a whole (scripts, catalog versions, layout) belongs in
   the root `README.md` and the root steering.
5. **Run `pnpm verify` at the workspace root** so every package's quality gates are
   green, not just this one's.

These updates should be included as tasks in every spec's `tasks.md`.
