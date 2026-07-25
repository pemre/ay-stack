import { defineConfig } from "vitest/config";

/**
 * Workspace-level test project.
 *
 * Covers the static checks that constrain the workspace as a whole (lockfile,
 * manifests, gitignore, docs, workflows, tarballs) plus the baseline resolver in
 * `tools/tokens/`, which previously had to be run with `node --test` because no
 * root runner existed. Per-package suites are run by `pnpm -r test`; the root
 * `test` script runs both.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tools/**/*.test.mjs"],
    testTimeout: 60_000,
  },
});
