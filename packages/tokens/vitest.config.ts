import { defineConfig } from "vitest/config";

/**
 * The token tests read both src/ and dist/, so dist/ has to exist before they
 * run. The root `verify` script orders test before build (cheapest gate first),
 * and `pnpm -r test` can run on a clean checkout, so the build is invoked from
 * globalSetup instead of being assumed — that keeps `test: "vitest run"` honest
 * and makes a stale dist/ impossible to test against.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["./tests/setup/build.ts"],
  },
});
