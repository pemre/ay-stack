// Feature: ay-monorepo-foundation, Property 11: For any non-private workspace
// package, the packed tarball SHALL contain a LICENSE file, a non-empty description,
// and every file its exports map targets, and SHALL contain no test file, story
// file, .storybook file, or lockfile.
//
// **Validates: Requirements 9.2, 9.7, 9.8**
//
// The property quantifies over the non-private workspace packages, so it runs the
// packer once per package rather than 100 times — the input set is the real package
// set, and packing twice yields the same answer.
//
// Note on the command: pnpm 9's `pack` has no `--dry-run` flag, so the equivalent is
// to pack into a temporary directory and discard the tarball. `--json` reports the
// exact file list that would be published, which is what the property is about.

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { type WorkspacePackage, workspacePackages } from "./helpers/workspace";

interface PackResult {
    name: string;
    version: string;
    filename: string;
    files: { path: string }[];
}

/** Files that must never ship: sources of truth for developers, not consumers. */
const FORBIDDEN = [
    { label: "test file", pattern: /(^|\/)[^/]*\.(test|spec)\.[cm]?[jt]sx?$/ },
    { label: "story file", pattern: /(^|\/)[^/]*\.stories\.[cm]?[jt]sx?$/ },
    { label: "storybook config", pattern: /(^|\/)\.storybook\// },
    { label: "lockfile", pattern: /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$/ },
    { label: "test directory", pattern: /(^|\/)(tests|__tests__)\// },
];

/** Every `./…` target reachable in an exports map, conditions included. */
function exportTargets(exportsField: unknown): string[] {
    const targets: string[] = [];
    const walk = (node: unknown) => {
        if (typeof node === "string") {
            if (node.startsWith("./")) targets.push(node.slice(2));
            return;
        }
        if (node && typeof node === "object") {
            for (const value of Object.values(node as Record<string, unknown>)) walk(value);
        }
    };
    walk(exportsField);
    return [...new Set(targets)];
}

function publishable(): WorkspacePackage[] {
    return workspacePackages().filter((pkg) => pkg.manifest.private !== true);
}

/**
 * Pack into a temp directory, read the reported file list, drop the tarball.
 */
function pack(pkg: WorkspacePackage): PackResult {
    const destination = mkdtempSync(join(tmpdir(), "ay-pack-"));
    try {
        const stdout = execFileSync("pnpm", ["pack", "--json", "--pack-destination", destination], {
            cwd: pkg.absDir,
            encoding: "utf-8",
        });
        return JSON.parse(stdout) as PackResult;
    } finally {
        rmSync(destination, { recursive: true, force: true });
    }
}

const packed = new Map<string, PackResult>();

describe("Property 11: publishable tarball contents", () => {
    beforeAll(() => {
        // A packed tarball can only contain build output that exists, so build any
        // package whose exports targets are missing. Cheap when dist/ is warm.
        for (const pkg of publishable()) {
            const missing = exportTargets(pkg.manifest.exports).filter(
                (target) => !existsSync(resolve(pkg.absDir, target)),
            );
            if (missing.length > 0) {
                execFileSync("pnpm", ["--filter", `${pkg.name}...`, "build"], {
                    cwd: resolve(pkg.absDir, "..", ".."),
                    encoding: "utf-8",
                });
            }
        }
        for (const pkg of publishable()) packed.set(pkg.name, pack(pkg));
    }, 300_000);

    it("finds the two publishable packages", () => {
        expect(publishable().map((pkg) => pkg.name).sort()).toEqual([
            "@ay/tokens",
            "@ay/ui-library",
        ]);
    });

    it("includes a LICENSE file in every tarball", () => {
        const without = publishable()
            .filter((pkg) => {
                const files = packed.get(pkg.name)?.files ?? [];
                return !files.some((file) => /^LICEN[CS]E(\..*)?$/.test(file.path));
            })
            .map((pkg) => pkg.name);
        expect(without).toEqual([]);
    });

    it("declares a non-empty description on every publishable package", () => {
        const without = publishable()
            .filter((pkg) => String(pkg.manifest.description ?? "").trim() === "")
            .map((pkg) => pkg.name);
        expect(without).toEqual([]);
    });

    it("includes every file the exports map targets", () => {
        const missing: string[] = [];
        for (const pkg of publishable()) {
            const files = new Set((packed.get(pkg.name)?.files ?? []).map((file) => file.path));
            for (const target of exportTargets(pkg.manifest.exports)) {
                if (!files.has(target)) missing.push(`${pkg.name}: ${target}`);
            }
        }
        expect(missing).toEqual([]);
    });

    it("includes no test file, story file, .storybook file, or lockfile", () => {
        const found: string[] = [];
        for (const pkg of publishable()) {
            for (const file of packed.get(pkg.name)?.files ?? []) {
                for (const { label, pattern } of FORBIDDEN) {
                    if (pattern.test(file.path)) found.push(`${pkg.name}: ${label} ${file.path}`);
                }
            }
        }
        expect(found).toEqual([]);
    });

    it("ships the package manifest and its documents", () => {
        for (const pkg of publishable()) {
            const files = new Set((packed.get(pkg.name)?.files ?? []).map((file) => file.path));
            expect(files.has("package.json"), `${pkg.name} package.json`).toBe(true);
            expect(files.has("README.md"), `${pkg.name} README.md`).toBe(true);
        }
    });
});
