# ay-stack

pnpm TypeScript monorepo: `apps/burkut` is the consumer application and `packages/ui-library` provides reusable React UI and dashboard infrastructure. Shared Vite/Vitest configuration lives in `packages/vite-config`.

## Working rules

- Use pnpm workspaces; run package scripts through `pnpm --filter <package> <script>` from the repository root.
- Preserve app/library boundaries. A reusable primitive or dashboard engine behavior belongs in `@ay/ui-library`; Bürküt-specific data, copy, and application state stay in `apps/burkut`.
- Keep public exports intentional. When a public API changes, update its tests, Storybook story, and consumer-facing documentation in the same change.
- Follow the nearest `AGENTS.md` for area-specific constraints. `packages/ui-library/AGENTS.md` governs library and Dashboard work.
- Validate changed packages with their typecheck, lint, test, and build scripts. Run the root `verify` command before broad cross-package changes.

