#!/usr/bin/env node
/**
 * Capture the computed-value baseline for the design tokens.
 *
 *   node tools/tokens/capture-baseline.mjs \
 *     --in src/styles/global.css \
 *     --in ay-ui-library/src/styles/tokens.css \
 *     --out tools/tokens/baseline.json
 *
 * `--in` is repeatable and order-significant (see the merge note below).
 * `--out` defaults to `tools/tokens/baseline.json`. Pass `--out -` to print to
 * stdout without writing a file.
 *
 * Output shape:
 *   {
 *     capturedAt, sources,            // as documented in design.md
 *     light, dark,                    // merged maps, every declared token
 *     mergeStrategy,                  // how conflicts were merged
 *     conflicts: { light, dark },     // names the sources disagree on
 *     perSource: { "<source>": { light, dark } }
 *   }
 *
 * Why `perSource` and `conflicts` exist: the pre-migration sources are two
 * independent consumers, not one cascade. They disagree on dark
 * `--color-border-hover`. A single merged map would silently discard one of the
 * two pre-migration realities, and this file is the only record of them once
 * `src/styles/global.css` is deleted. So the merged maps are kept for the
 * documented shape and the per-source maps are added alongside them.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { resolveThemes } from "./resolve.mjs";

const MERGE_STRATEGY =
    "first-source-wins: sources are independent consumers rather than a cascade, " +
    "so on a conflicting name the earliest --in source's resolved value is recorded " +
    "in the merged map. Every disagreement is listed under `conflicts` and every " +
    "source's own resolution is preserved under `perSource`.";

/** Parse `--in <path>` (repeatable) and `--out <path>`. */
export function parseArgs(argv) {
    const inputs = [];
    let out = "tools/tokens/baseline.json";

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--in") {
            const value = argv[++i];
            if (!value) throw new Error("--in requires a path");
            inputs.push(value);
        } else if (arg.startsWith("--in=")) {
            inputs.push(arg.slice("--in=".length));
        } else if (arg === "--out") {
            const value = argv[++i];
            if (!value) throw new Error("--out requires a path");
            out = value;
        } else if (arg.startsWith("--out=")) {
            out = arg.slice("--out=".length);
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    if (inputs.length === 0) throw new Error("at least one --in <path> is required");
    return { inputs, out };
}

/**
 * Build the baseline document from `{ source, css }` pairs.
 * Pure: takes CSS text, does no filesystem work, so it is testable directly.
 */
export function buildBaseline(sources, capturedAt = new Date().toISOString()) {
    const perSource = {};
    for (const { source, css } of sources) {
        perSource[source] = resolveThemes([css]);
    }

    const light = {};
    const dark = {};
    const conflicts = { light: {}, dark: {} };

    for (const theme of ["light", "dark"]) {
        const merged = theme === "light" ? light : dark;
        const seen = new Map(); // name -> [{ source, value }]

        for (const { source } of sources) {
            for (const [name, value] of Object.entries(perSource[source][theme])) {
                const entries = seen.get(name) ?? [];
                entries.push({ source, value });
                seen.set(name, entries);
            }
        }

        for (const name of [...seen.keys()].sort()) {
            const entries = seen.get(name);
            merged[name] = entries[0].value; // first --in source wins
            if (new Set(entries.map((e) => e.value)).size > 1) {
                conflicts[theme][name] = { chosen: entries[0].value, declaredBy: entries };
            }
        }
    }

    return {
        capturedAt,
        sources: sources.map((s) => s.source),
        mergeStrategy: MERGE_STRATEGY,
        light,
        dark,
        conflicts,
        perSource,
    };
}

function main(argv) {
    const { inputs, out } = parseArgs(argv);

    const sources = inputs.map((source) => {
        const abs = resolvePath(process.cwd(), source);
        let css;
        try {
            css = readFileSync(abs, "utf-8");
        } catch (cause) {
            throw new Error(`Cannot read input stylesheet: ${abs}`, { cause });
        }
        return { source, css };
    });

    const baseline = buildBaseline(sources);
    const json = `${JSON.stringify(baseline, null, 2)}\n`;

    if (out === "-") {
        process.stdout.write(json);
    } else {
        const abs = resolvePath(process.cwd(), out);
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(abs, json, "utf-8");
        const conflictCount =
            Object.keys(baseline.conflicts.light).length + Object.keys(baseline.conflicts.dark).length;
        process.stdout.write(
            `Wrote ${abs}\n` +
            `  sources:   ${baseline.sources.length}\n` +
            `  light:     ${Object.keys(baseline.light).length} tokens\n` +
            `  dark:      ${Object.keys(baseline.dark).length} tokens\n` +
            `  conflicts: ${conflictCount}\n`,
        );
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        main(process.argv.slice(2));
    } catch (error) {
        process.stderr.write(`${error.message}\n`);
        process.exitCode = 1;
    }
}
