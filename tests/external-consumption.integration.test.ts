// Feature: ay-monorepo-foundation — integration tests for external consumption.
//
// Unlike the properties elsewhere in this suite, this file is not quantified
// over a generated input space — the two publishable packages are the input,
// and packing each of them twice would yield the same answer — so it runs
// once, with 1-3 concrete examples per check, per the design's Testing
// Strategy ("Integration (1-3 examples, not 100)").
//
// Requirements 9.4 and 9.5 ask what happens when @ay/tokens and @ay/ui-library
// are installed from a tarball into a project outside the Monorepo Root, so
// this test packs both packages for real (`pnpm pack`), installs the tarballs
// into a temp directory under the OS temp dir — never under this repository —
// and resolves them the way an external consumer's tooling would: through the
// package specifier, not a relative path back into the workspace. Requirement
// 5.5 (the four build artifacts) is checked against that same installed
// package. Requirement 5.6 is checked separately, by patching and restoring
// @ay/tokens' own source and rebuilding — no packing needed for that one,
// since the question is whether the *build* propagates the change, not
// whether a tarball does.
//
// **Validates: Requirements 5.5, 5.6, 9.4, 9.5**

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ROOT } from "./helpers/workspace";

const TOKENS_PKG = join(ROOT, "packages", "tokens");
const UI_PKG = join(ROOT, "packages", "ui-library");

interface PackResult {
  name: string;
  version: string;
  filename: string;
}

/** Pack a workspace package into `destination` and return pnpm's report. */
function pack(pkgDir: string, destination: string): PackResult {
  const stdout = execFileSync("pnpm", ["pack", "--json", "--pack-destination", destination], {
    cwd: pkgDir,
    encoding: "utf-8",
  });
  return JSON.parse(stdout) as PackResult;
}

/** Build a package in place if any of its expected artifacts is missing. */
function ensureBuilt(pkgDir: string, pkgName: string, requiredFiles: string[]): void {
  const missing = requiredFiles.some((file) => !existsSync(join(pkgDir, file)));
  if (!missing) return;
  execFileSync("pnpm", ["--filter", `${pkgName}...`, "build"], {
    cwd: ROOT,
    encoding: "utf-8",
  });
}

/**
 * Directory of an installed peer dependency, resolved from @ay/ui-library's
 * own node_modules — react, react-dom, and d3 are its peers, and the
 * workspace install already put them there. Walking up from the resolved
 * entry file to the nearest package.json that declares the exact name handles
 * packages whose exports map does not expose "./package.json" (d3 does not).
 */
function peerDependencyDir(specifier: string): string {
  const uiRequire = createRequire(join(UI_PKG, "package.json"));
  let dir = dirname(uiRequire.resolve(specifier));
  for (let i = 0; i < 6; i++) {
    try {
      const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
      if (manifest.name === specifier) return dir;
    } catch {
      // keep walking up
    }
    dir = dirname(dir);
  }
  throw new Error(`could not locate an installed package.json for ${specifier}`);
}

describe("external consumption from a packed tarball", () => {
  let consumerDir: string;
  let packDestination: string;

  beforeAll(() => {
    ensureBuilt(TOKENS_PKG, "@ay/tokens", [
      "dist/tokens.css",
      "dist/theme.css",
      "dist/core.css",
      "dist/semantic.css",
    ]);
    ensureBuilt(UI_PKG, "@ay/ui-library", [
      "dist/index.es.js",
      "dist/index.cjs.js",
      "dist/index.d.ts",
      "dist/style.css",
    ]);

    packDestination = mkdtempSync(join(tmpdir(), "ay-pack-"));
    const tokensPack = pack(TOKENS_PKG, packDestination);
    const uiPack = pack(UI_PKG, packDestination);

    // Outside the Monorepo Root by construction: mkdtemp resolves under the
    // OS temp directory, never under ROOT.
    consumerDir = mkdtempSync(join(tmpdir(), "ay-consumer-"));
    writeFileSync(
      join(consumerDir, "package.json"),
      JSON.stringify({ name: "ay-external-consumer", version: "1.0.0", private: true }, null, 2),
    );

    const reactDir = peerDependencyDir("react");
    const reactDomDir = peerDependencyDir("react-dom");
    const d3Dir = peerDependencyDir("d3");

    execFileSync(
      "npm",
      [
        "install",
        "--no-save",
        "--no-audit",
        "--no-fund",
        "--loglevel=error",
        tokensPack.filename,
        uiPack.filename,
        `file:${reactDir}`,
        `file:${reactDomDir}`,
        `file:${d3Dir}`,
      ],
      { cwd: consumerDir, encoding: "utf-8" },
    );
  }, 180_000);

  afterAll(() => {
    if (packDestination) rmSync(packDestination, { recursive: true, force: true });
    if (consumerDir) rmSync(consumerDir, { recursive: true, force: true });
  });

  it("resolves every @ay/tokens export subpath through the package specifier", () => {
    // Requirement 9.4. CSS has no require/import condition split, so plain
    // require.resolve is enough — no subprocess needed for this half.
    const consumerRequire = createRequire(join(consumerDir, "package.json"));

    const root = consumerRequire.resolve("@ay/tokens");
    const theme = consumerRequire.resolve("@ay/tokens/theme.css");
    const core = consumerRequire.resolve("@ay/tokens/core.css");
    const semantic = consumerRequire.resolve("@ay/tokens/semantic.css");
    const manifest = consumerRequire.resolve("@ay/tokens/package.json");

    for (const resolved of [root, theme, core, semantic, manifest]) {
      expect(existsSync(resolved), resolved).toBe(true);
    }

    // The Tailwind entry carries the @theme static block; the plain entry
    // that "." resolves to must not, per Property 8 / Requirement 11.6.
    // Comments are stripped first: the plain entry's banner comment
    // mentions "@theme" in prose, which is not the at-rule this checks for.
    const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(stripComments(readFileSync(theme, "utf-8"))).toMatch(/@theme\s+static\b/);
    expect(stripComments(readFileSync(root, "utf-8"))).not.toMatch(/@theme\b/);
  });

  it("resolves ImageZoom and SpiralTimeline through the @ay/ui-library barrel", async () => {
    // Requirement 9.5. The package's exports map splits on the import/require
    // condition, and require.resolve always takes the require branch even
    // under a dynamic import() call site, so resolution has to happen the way
    // a real ESM consumer's loader would: a script living inside the consumer
    // project, executed as its own process, importing the bare specifier.
    const probePath = join(consumerDir, "resolve-ui-library.mjs");
    writeFileSync(
      probePath,
      [
        'const mod = await import("@ay/ui-library");',
        "console.log(JSON.stringify({",
        "  exportNames: Object.keys(mod).sort(),",
        "  imageZoom: typeof mod.ImageZoom,",
        "  spiralTimeline: typeof mod.SpiralTimeline,",
        "}));",
      ].join("\n"),
    );

    const stdout = execFileSync(process.execPath, [probePath], {
      cwd: consumerDir,
      encoding: "utf-8",
    });
    const result = JSON.parse(stdout);

    expect(result.exportNames).toEqual(expect.arrayContaining(["ImageZoom", "SpiralTimeline"]));
    expect(result.imageZoom).toBe("function");
    expect(result.spiralTimeline).toBe("function");
  });

  it("installs the four build artifacts the @ay/ui-library production build emits", () => {
    // Requirement 5.5.
    const distDir = join(consumerDir, "node_modules", "@ay", "ui-library", "dist");
    for (const file of ["index.es.js", "index.cjs.js", "index.d.ts", "style.css"]) {
      expect(existsSync(join(distDir, file)), file).toBe(true);
    }
  });
});

describe("a semantic value patch propagates to a consumer stylesheet", () => {
  const semanticPath = join(TOKENS_PKG, "src", "semantic.css");
  const buildScript = join(TOKENS_PKG, "scripts", "build-css.mjs");
  const ORIGINAL_LIGHT_DECL = "--color-primary: var(--color-amber-500);";
  const PATCHED_LIGHT_DECL = "--color-primary: var(--color-green-500);";

  function build(): void {
    execFileSync(process.execPath, [buildScript], { cwd: TOKENS_PKG, encoding: "utf-8" });
  }

  function builtLightPrimary(): string | undefined {
    const css = readFileSync(join(TOKENS_PKG, "dist", "theme.css"), "utf-8");
    return css.match(/--color-primary:\s*([^;]+);/)?.[0];
  }

  it("rebuilds dist/theme.css with the patched value, then restores the original", () => {
    // Requirement 5.6. Bürküt and Storybook both import the token stylesheet
    // through the @ay/tokens package specifier (Property 4 / Requirements
    // 5.3-5.4) and both entries declare identical values (Property 8), so
    // checking the built theme entry directly is checking exactly what a
    // "next build" of either consumer would pick up.
    const original = readFileSync(semanticPath, "utf-8");
    expect(original).toContain(ORIGINAL_LIGHT_DECL);

    try {
      build();
      expect(builtLightPrimary()).toBe(ORIGINAL_LIGHT_DECL);

      const patched = original.replace(ORIGINAL_LIGHT_DECL, PATCHED_LIGHT_DECL);
      expect(patched).not.toBe(original);
      writeFileSync(semanticPath, patched);
      build();

      expect(builtLightPrimary()).toBe(PATCHED_LIGHT_DECL);
    } finally {
      writeFileSync(semanticPath, original);
      build();
    }

    expect(readFileSync(semanticPath, "utf-8")).toBe(original);
    expect(builtLightPrimary()).toBe(ORIGINAL_LIGHT_DECL);
  }, 60_000);
});
