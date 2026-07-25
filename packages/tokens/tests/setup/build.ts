import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PKG = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

/** Build dist/ before any test reads it. */
export function setup(): void {
  execFileSync(process.execPath, [join(PKG, "scripts", "build-css.mjs")], {
    cwd: PKG,
    stdio: "inherit",
  });
}
