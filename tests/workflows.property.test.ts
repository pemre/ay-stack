// Feature: ay-monorepo-foundation, Property 19: For any GitHub Actions workflow
// in the workspace, the workflow SHALL install dependencies with pnpm, SHALL cache
// the pnpm store, SHALL reference no pre-migration path, and any job that
// publishes a Pages artifact SHALL declare `needs` on every build job feeding it.
//
// **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**
//
// The property quantifies over every file in .github/workflows/, so it is checked
// exhaustively over the real workflow set. There is no YAML parser in the
// workspace and adding one for a handful of structural reads is not worth a
// dependency, so the jobs block is read by indentation — enough to recover job
// names, their `needs` edges, and the actions and commands each job runs.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers/workspace";

const WORKFLOW_DIR = join(ROOT, ".github", "workflows");

interface Job {
    name: string;
    needs: string[];
    /** Raw text of the job block, steps included. */
    body: string;
}

interface Workflow {
    path: string;
    text: string;
    jobs: Job[];
}

/** Every workflow file in the single .github/workflows directory. */
function workflows(): Workflow[] {
    if (!existsSync(WORKFLOW_DIR)) return [];
    return readdirSync(WORKFLOW_DIR)
        .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
        .map((file) => {
            const path = join(WORKFLOW_DIR, file);
            const text = readFileSync(path, "utf-8");
            return { path: relative(ROOT, path), text, jobs: parseJobs(text) };
        });
}

/**
 * Recovers the jobs block by indentation: `jobs:` at column 0, each job key at
 * two spaces, everything more deeply indented belonging to that job.
 */
function parseJobs(text: string): Job[] {
    const lines = text.split("\n");
    const jobs: Job[] = [];
    let inJobs = false;
    let current: Job | null = null;

    for (const line of lines) {
        if (/^jobs:\s*$/.test(line)) {
            inJobs = true;
            continue;
        }
        if (!inJobs) continue;
        // A non-indented, non-blank line ends the jobs block.
        if (line.trim() !== "" && !line.startsWith(" ")) break;

        const jobKey = line.match(/^ {2}([A-Za-z0-9_-]+):\s*$/);
        if (jobKey) {
            current = { name: jobKey[1], needs: [], body: "" };
            jobs.push(current);
            continue;
        }
        if (!current) continue;
        current.body += `${line}\n`;

        const needs = line.match(/^ {4}needs:\s*(.+)$/);
        if (needs) {
            current.needs = needs[1]
                .replace(/[[\]]/g, "")
                .split(",")
                .map((entry) => entry.trim())
                .filter((entry) => entry !== "");
        }
    }
    return jobs;
}

/** Steps that run a production build of a workspace package. */
function isBuildJob(job: Job): boolean {
    return /run:\s*pnpm\s+--filter\s+\S+\s+build/.test(job.body);
}

/** Jobs that hand something to GitHub Pages. */
function publishesPages(job: Job): boolean {
    return /actions\/(upload-pages-artifact|deploy-pages)@/.test(job.body);
}

/** Transitive `needs` closure, so a job may depend on a build through assemble. */
function needsClosure(job: Job, byName: Map<string, Job>): Set<string> {
    const seen = new Set<string>();
    const queue = [...job.needs];
    while (queue.length > 0) {
        const next = queue.shift() as string;
        if (seen.has(next)) continue;
        seen.add(next);
        const dependency = byName.get(next);
        if (dependency) queue.push(...dependency.needs);
    }
    return seen;
}

// Patterns that only existed before the restructure. `ay-ui-library` covers the
// old directory and the old package name; the rest cover the npm-based workflows.
// The `(?<!p)` guards keep `pnpm install` and `pnpm run` from matching as `npm`.
const PRE_MIGRATION_PATTERNS: [label: string, pattern: RegExp][] = [
    ["ay-ui-library", /ay-ui-library/],
    ["package-lock.json", /package-lock\.json/],
    ["yarn.lock", /yarn\.lock/],
    ["npm ci", /(?<!p)npm ci\b/],
    ["npm install", /(?<!p)npm install\b/],
    ["npm run", /(?<!p)npm run\b/],
    ["yarn install", /yarn install\b/],
    ["detect-package-manager", /detect-package-manager/],
];

/** Minimum action major version that is still current. */
const ACTION_FLOOR: Record<string, number> = {
    "actions/checkout": 4,
    "actions/setup-node": 4,
    "actions/cache": 4,
    "actions/upload-artifact": 4,
    "actions/download-artifact": 4,
    "actions/configure-pages": 5,
    "actions/upload-pages-artifact": 3,
    "actions/deploy-pages": 4,
    "pnpm/action-setup": 4,
};

describe("Property 19: workflow path and tooling currency", () => {
    it("keeps exactly one workflow directory, at the workspace root", () => {
        expect(existsSync(WORKFLOW_DIR)).toBe(true);
        // A stray .github inside a package would be dead configuration: GitHub only
        // reads the repository-root directory.
        const strays = ["packages", "apps"]
            .flatMap((parent) => {
                const parentAbs = join(ROOT, parent);
                if (!existsSync(parentAbs)) return [];
                return readdirSync(parentAbs, { withFileTypes: true })
                    .filter((entry) => entry.isDirectory())
                    .map((entry) => `${parent}/${entry.name}/.github`);
            })
            .filter((candidate) => existsSync(join(ROOT, candidate)));
        expect(strays).toEqual([]);
    });

    it("finds at least one workflow to check", () => {
        expect(workflows().length).toBeGreaterThan(0);
    });

    it("installs dependencies with pnpm at the workspace root", () => {
        for (const workflow of workflows()) {
            expect(workflow.text, `${workflow.path} does not run pnpm install`).toMatch(
                /run:\s*pnpm install/,
            );
        }
    });

    it("caches the pnpm store keyed on pnpm-lock.yaml", () => {
        for (const workflow of workflows()) {
            expect(workflow.text, `${workflow.path} does not use actions/cache`).toMatch(
                /uses:\s*actions\/cache@/,
            );
            expect(workflow.text, `${workflow.path} does not key the cache on the lockfile`).toMatch(
                /hashFiles\('pnpm-lock\.yaml'\)/,
            );
            expect(workflow.text, `${workflow.path} does not cache the pnpm store path`).toMatch(
                /pnpm store path/,
            );
        }
    });

    it("references no pre-migration path or package manager", () => {
        const found: string[] = [];
        for (const workflow of workflows()) {
            for (const [label, pattern] of PRE_MIGRATION_PATTERNS) {
                if (pattern.test(workflow.text)) found.push(`${workflow.path}: ${label}`);
            }
        }
        expect(found).toEqual([]);
    });

    it("references only workspace paths that exist", () => {
        const missing: string[] = [];
        for (const workflow of workflows()) {
            // Post-restructure package paths the workflow hands to actions.
            const paths = workflow.text.match(/(?:packages|apps|tools)\/[A-Za-z0-9._/-]+/g) ?? [];
            for (const path of new Set(paths)) {
                // Build output may not exist before a build runs; its package must.
                const packageDir = path.split("/").slice(0, 2).join("/");
                if (!existsSync(join(ROOT, packageDir))) missing.push(`${workflow.path}: ${path}`);
            }
        }
        expect(missing).toEqual([]);
    });

    it("builds Storybook from packages/ui-library and Bürküt from apps/burkut", () => {
        const text = workflows()
            .map((workflow) => workflow.text)
            .join("\n");
        // Requirement 14.1 — Storybook at the site root.
        expect(text).toMatch(/pnpm --filter @ay\/ui-library build-storybook/);
        expect(text).toMatch(/STORYBOOK_BASE:\s*\/ay-stack\//);
        expect(text).toMatch(/packages\/ui-library\/storybook-static/);
        // Requirement 14.2 — Bürküt under /burkut/.
        expect(text).toMatch(/pnpm --filter "burkut\.\.\." build/);
        expect(text).toMatch(/GITHUB_PAGES/);
        expect(text).toMatch(/apps\/burkut\/dist/);
    });

    it("makes every Pages-publishing job depend on every build job", () => {
        const violations: string[] = [];
        for (const workflow of workflows()) {
            const byName = new Map(workflow.jobs.map((job) => [job.name, job]));
            const buildJobs = workflow.jobs.filter(isBuildJob).map((job) => job.name);
            expect(buildJobs.length, `${workflow.path} declares no build job`).toBeGreaterThan(0);

            for (const job of workflow.jobs.filter(publishesPages)) {
                const closure = needsClosure(job, byName);
                for (const build of buildJobs) {
                    if (!closure.has(build)) {
                        violations.push(`${workflow.path}: job "${job.name}" does not need "${build}"`);
                    }
                }
            }
        }
        expect(violations).toEqual([]);
    });

    it("uses current major versions of every action it references", () => {
        const outdated: string[] = [];
        for (const workflow of workflows()) {
            const uses = workflow.text.match(/uses:\s*([\w.-]+\/[\w.-]+)@v(\d+)/g) ?? [];
            for (const entry of uses) {
                const parsed = entry.match(/uses:\s*([\w.-]+\/[\w.-]+)@v(\d+)/);
                if (!parsed) continue;
                const [, action, major] = parsed;
                const floor = ACTION_FLOOR[action];
                if (floor === undefined) {
                    outdated.push(`${workflow.path}: unknown action ${action}`);
                } else if (Number(major) < floor) {
                    outdated.push(`${workflow.path}: ${action}@v${major} < v${floor}`);
                }
            }
        }
        expect(outdated).toEqual([]);
    });
});
