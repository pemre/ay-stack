import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, isAbsolute, resolve } from "node:path";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { resolveProjectRoot, resolveTargetDir, validateTargetDir } from "./paths.ts";

// Feature: ay-monorepo-foundation, Property 14: For any caller working directory, the Bürküt CLI
// SHALL compute a project root equal to the `apps/burkut` package directory; and for any pair of
// caller working directory and target directory argument, the CLI SHALL resolve the target to
// path.resolve(cwd, argument) independently of the package location.

/** Path segments: plain, spaced, and non-ASCII. */
const segment = fc.oneof(
  fc.stringMatching(/^[a-zA-Z0-9_-]{1,12}$/),
  fc.constantFrom("with space", "iki kelime", "günlük", "日記", "naïve", "a.b", "dot.dir"),
);

/** Arbitrary absolute directory, standing in for the caller's working directory. */
const absoluteDir = fc
  .array(segment, { minLength: 0, maxLength: 4 })
  .map((parts) => `/${parts.join("/")}`);

/** Arbitrary relative directory argument, including the interesting degenerate forms. */
const relativeArgument = fc.oneof(
  fc.constantFrom(".", "..", "./", "../..", "./content", "content/../content", "günlük/2024"),
  fc.array(segment, { minLength: 1, maxLength: 3 }).map((parts) => parts.join("/")),
);

const anyArgument = fc.oneof(relativeArgument, absoluteDir);

describe("Property 14: CLI path-resolution split", () => {
  /**
   * The project root is the `apps/burkut` package directory itself, identified
   * independently of how this test file is located: the directory whose
   * `package.json` names the `burkut` package and which holds `vite.config.ts`.
   *
   * **Validates: Requirements 13.1**
   */
  it("resolves the project root to the apps/burkut package directory", () => {
    const root = resolveProjectRoot();

    expect(isAbsolute(root)).toBe(true);
    expect(basename(root)).toBe("burkut");
    expect(basename(dirname(root))).toBe("apps");
    expect(existsSync(resolve(root, "vite.config.ts"))).toBe(true);

    const manifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"));
    expect(manifest.name).toBe("burkut");
    expect(manifest.bin.burkut).toBe("./dist/cli/bin/burkut.js");
  });

  /**
   * The project root carries no dependency on the caller's working directory:
   * resolving arbitrary target directories never moves it.
   *
   * **Validates: Requirements 13.1**
   */
  it("keeps the project root constant across arbitrary caller working directories", () => {
    const expected = resolveProjectRoot();

    fc.assert(
      fc.property(absoluteDir, anyArgument, (cwd, argument) => {
        resolveTargetDir(cwd, argument);
        expect(resolveProjectRoot()).toBe(expected);
      }),
      { numRuns: 200 },
    );
  });

  /**
   * The target argument resolves against the caller's working directory.
   *
   * **Validates: Requirements 13.2**
   */
  it("resolves the target argument as path.resolve(cwd, argument)", () => {
    fc.assert(
      fc.property(absoluteDir, anyArgument, (cwd, argument) => {
        const target = resolveTargetDir(cwd, argument);
        expect(target).toBe(resolve(cwd, argument));
        expect(isAbsolute(target)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  /**
   * Target resolution is independent of where the package lives: for a working
   * directory outside the package, the resolved target never lands inside it.
   *
   * **Validates: Requirements 13.1, 13.2**
   */
  it("resolves the target independently of the package location", () => {
    const root = resolveProjectRoot();

    fc.assert(
      fc.property(absoluteDir, relativeArgument, (cwd, argument) => {
        const outsideCwd = `/property-14-outside${cwd}`;
        const target = resolveTargetDir(outsideCwd, argument);
        expect(target.startsWith(root)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  /**
   * An absolute argument wins outright — two different working directories give
   * the same target.
   *
   * **Validates: Requirements 13.2**
   */
  it("ignores the working directory for absolute arguments", () => {
    fc.assert(
      fc.property(absoluteDir, absoluteDir, absoluteDir, (cwdA, cwdB, argument) => {
        expect(resolveTargetDir(cwdA, argument)).toBe(resolveTargetDir(cwdB, argument));
      }),
      { numRuns: 200 },
    );
  });

  /**
   * An absent or empty argument means the working directory itself, matching the
   * CLI's `burkut serve` with no directory operand.
   *
   * **Validates: Requirements 13.2**
   */
  it("treats an absent or empty argument as the working directory", () => {
    fc.assert(
      fc.property(absoluteDir, (cwd) => {
        expect(resolveTargetDir(cwd)).toBe(resolve(cwd));
        expect(resolveTargetDir(cwd, "")).toBe(resolve(cwd));
        expect(resolveTargetDir(cwd, ".")).toBe(resolve(cwd));
        expect(resolveTargetDir(cwd, "..")).toBe(resolve(cwd, ".."));
      }),
      { numRuns: 200 },
    );
  });

  /**
   * Unresolvable target directories are reported with the resolved absolute path
   * in the message.
   *
   * **Validates: Requirements 13.7**
   */
  it("names the unresolved path in the error message", () => {
    fc.assert(
      fc.property(absoluteDir, anyArgument, (cwd, argument) => {
        // Re-rooted under a directory that cannot exist, so the resolved path is
        // unresolvable no matter how many `..` segments the argument carries.
        const target = `/property-14-missing${resolveTargetDir(cwd, argument)}`;
        const message = validateTargetDir(target);
        expect(message).not.toBeNull();
        expect(message).toContain(target);
      }),
      { numRuns: 200 },
    );
  });
});
