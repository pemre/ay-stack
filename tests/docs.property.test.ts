// Feature: ay-monorepo-foundation, Property 17: For any markdown or steering
// document in the workspace, every filesystem path it references SHALL exist, every
// package-manager command it shows SHALL invoke pnpm, every reference to the library
// by package specifier SHALL use @ay/ui-library, and no document SHALL instruct the
// reader to use npm link or yalc.
//
// **Validates: Requirements 3.8, 12.6, 12.7, 15.3, 15.4, 17.7**
//
// The property quantifies over every markdown and MDX document git knows about
// (excluding spec history and user content — see helpers/docs.ts), crossed with the
// paths, commands, and specifiers each one contains. It is checked exhaustively over
// the real document set rather than over generated input.
//
// Two judgement calls are encoded deliberately:
//
//   * A pre-migration path or a forbidden tool named on a line that also carries a
//     negation cue ("no longer", "instead of", "renamed") is documentation of a
//     removal, not a stale instruction. Those lines pass. Inside a fenced code block
//     there is no such allowance: a code block is something a reader copies.
//   * `ay-ui-library` in prose is history and is allowed; `ay-ui-library` used as a
//     package specifier — in an import, an install command, a node_modules path, or a
//     registry URL — is not.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
    documents,
    fencedLines,
    historyStartLine,
    isNegated,
    pathReferences,
    resolvesSomewhere,
} from "./helpers/docs";
import { ROOT, workspacePackages } from "./helpers/workspace";

/** Package-manager invocations that are not pnpm (Requirement 15.4). */
const NON_PNPM_COMMANDS = [
    /(?<!p)\bnpm (?:install|ci|run|test|publish|link|i)\b/,
    /\bnpx\b/,
    /\byarn (?:add|install|run)\b/,
];

/** The library referenced by its old package specifier (Requirement 3.8). */
const OLD_SPECIFIER_USES = [
    /(?:from|import)\s+["']ay-ui-library(?:\/[^"']*)?["']/,
    /require\(["']ay-ui-library/,
    /(?:add|install|link|i)\s+ay-ui-library\b/,
    /node_modules\/ay-ui-library/,
    /npmjs\.com\/package\/ay-ui-library/,
];

/** URLs that stopped existing when the repository was renamed. */
const DEAD_URLS = [/pemre\.github\.io\/ay-ui-library/, /pemre\.github\.io\/burkut/];

/** Linking workflows the Local Dev Alias replaces (Requirement 12.7). */
const FORBIDDEN_TOOLS = [/npm link/, /\byalc\b/];

interface Finding {
    doc: string;
    line: number;
    text: string;
}

/**
 * Scan every document line for the given patterns. Lines inside fenced code blocks
 * are always reported; prose lines are reported only when they do not carry a
 * negation cue.
 */
function scan(patterns: RegExp[], options: { allowNegatedProse: boolean }): Finding[] {
    const findings: Finding[] = [];
    for (const doc of documents()) {
        const fenced = fencedLines(doc.lines);
        const history = historyStartLine(doc);
        for (const [index, line] of doc.lines.entries()) {
            // Released changelog entries record what was true then, not what to do now.
            if (history !== null && index >= history) break;
            if (!patterns.some((pattern) => pattern.test(line))) continue;
            if (options.allowNegatedProse && !fenced.has(index) && isNegated(line)) continue;
            findings.push({ doc: doc.path, line: index + 1, text: line.trim() });
        }
    }
    return findings;
}

function format(findings: Finding[]): string[] {
    return findings.map((finding) => `${finding.doc}:${finding.line}: ${finding.text}`);
}

describe("Property 17: documentation and steering hygiene", () => {
    it("finds documents to check, including every package README and steering file", () => {
        const paths = documents().map((doc) => doc.path);
        expect(paths).toContain("README.md");
        expect(paths).toContain("ROADMAP.md");
        expect(paths).toContain("packages/tokens/README.md");
        expect(paths).toContain("packages/ui-library/README.md");
        expect(paths).toContain("packages/vite-config/README.md");
        expect(paths).toContain("apps/burkut/README.md");
        expect(paths.filter((path) => path.includes(".kiro/steering/")).length).toBeGreaterThan(0);
    });

    it("references only filesystem paths that exist", () => {
        const broken: string[] = [];
        for (const doc of documents()) {
            for (const reference of pathReferences(doc)) {
                // A path named as absent or superseded is a record of a removal.
                if (!reference.fenced && isNegated(doc.lines[reference.line])) continue;
                if (resolvesSomewhere(doc, reference.raw)) continue;
                broken.push(`${doc.path}:${reference.line + 1}: ${reference.raw}`);
            }
        }
        expect(broken).toEqual([]);
    });

    it("shows only pnpm package-manager commands", () => {
        expect(format(scan(NON_PNPM_COMMANDS, { allowNegatedProse: true }))).toEqual([]);
    });

    it("references the library only as @ay/ui-library", () => {
        expect(format(scan(OLD_SPECIFIER_USES, { allowNegatedProse: false }))).toEqual([]);
    });

    it("links no pre-rename published URL", () => {
        expect(format(scan(DEAD_URLS, { allowNegatedProse: false }))).toEqual([]);
    });

    it("instructs no reader to link packages with npm link or yalc", () => {
        expect(format(scan(FORBIDDEN_TOOLS, { allowNegatedProse: true }))).toEqual([]);
    });

    it("documents the Local Dev Alias as the supported cross-package workflow", () => {
        // Requirement 12.6 — the workflow must be described, not merely not-forbidden.
        const describing = documents().filter(
            (doc) => doc.text.includes("AY_LOCAL=1") && /local dev alias/i.test(doc.text),
        );
        expect(describing.map((doc) => doc.path)).toContain("README.md");
        expect(describing.length).toBeGreaterThan(1);
    });

    it("gives every non-private package a README that names it", () => {
        // Requirement 17.2, 17.3 — a published package's README must exist and use the
        // package's current name.
        const missing: string[] = [];
        for (const pkg of workspacePackages()) {
            const readme = join(pkg.absDir, "README.md");
            if (!existsSync(readme)) {
                missing.push(`${pkg.dir}/README.md`);
                continue;
            }
            const doc = documents().find((entry) => entry.path === `${pkg.dir}/README.md`);
            if (!doc || !doc.text.includes(pkg.name)) {
                missing.push(`${pkg.dir}/README.md does not name ${pkg.name}`);
            }
        }
        expect(missing).toEqual([]);
    });

    it("keeps no superseded migration plan at the workspace root", () => {
        // Requirement 17.6.
        expect(existsSync(join(ROOT, "MIGRATION_PLAN.md"))).toBe(false);
    });
});
