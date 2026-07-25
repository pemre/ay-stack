/**
 * Shared helpers for the documentation and steering checks (Properties 17 and 18).
 *
 * The document set is read from git rather than from a hardcoded list, so a new
 * README or steering file is covered the moment it is added. Both tracked and
 * untracked-but-not-ignored files are included: a document that has not been
 * committed yet is still a document a reader can follow.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { ROOT } from "./workspace";

export interface Document {
    /** Path relative to the workspace root. */
    path: string;
    absPath: string;
    /** Absolute directory holding the document. */
    dir: string;
    text: string;
    lines: string[];
    /** True for files under a .kiro/steering directory. */
    isSteering: boolean;
}

/**
 * Directories whose markdown is not workspace documentation:
 * - `.kiro/specs/` — spec history. Requirements and design documents deliberately
 *   quote pre-migration paths and pre-migration package names; rewriting them would
 *   falsify the record.
 * - `apps/burkut/src/content/` and `apps/burkut/prompts/` — user content and prompt
 *   templates, not instructions to a contributor.
 * - build output and dependencies.
 */
const EXCLUDED = [
    ".kiro/specs/",
    "apps/burkut/src/content/",
    "apps/burkut/prompts/",
    "node_modules/",
    "dist/",
    "storybook-static/",
];

const DOC_EXTENSIONS = [".md", ".mdx"];

/** Every documentation file in the workspace, tracked or newly added. */
export function documents(): Document[] {
    const listed = execFileSync(
        "git",
        ["ls-files", "--cached", "--others", "--exclude-standard"],
        { cwd: ROOT, encoding: "utf-8", maxBuffer: 32 * 1024 * 1024 },
    )
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "");

    const seen = new Set<string>();
    const docs: Document[] = [];
    for (const path of listed) {
        if (!DOC_EXTENSIONS.some((extension) => path.endsWith(extension))) continue;
        if (EXCLUDED.some((prefix) => path.startsWith(prefix) || path.includes(`/${prefix}`))) continue;
        if (seen.has(path)) continue;
        seen.add(path);
        const absPath = join(ROOT, path);
        if (!existsSync(absPath)) continue;
        const text = readFileSync(absPath, "utf-8");
        docs.push({
            path,
            absPath,
            dir: dirname(absPath),
            text,
            lines: text.split("\n"),
            isSteering: path.includes(".kiro/steering/"),
        });
    }
    if (docs.length === 0) throw new Error("no documentation files discovered");
    return docs;
}

/** Line indices (0-based) that fall inside a fenced code block. */
export function fencedLines(lines: string[]): Set<number> {
    const inside = new Set<number>();
    let open = false;
    for (const [index, line] of lines.entries()) {
        if (/^\s*(```|~~~)/.test(line)) {
            open = !open;
            inside.add(index);
            continue;
        }
        if (open) inside.add(index);
    }
    return inside;
}

/**
 * Cues that a line is describing something as absent, replaced, or forbidden
 * rather than telling the reader to use it. A path or tool named on such a line is
 * documentation of a removal, which is the opposite of a stale instruction.
 */
const NEGATION_CUES = [
    "no ",
    "not ",
    "never",
    "instead",
    "rather than",
    "gone",
    "removed",
    "deprecat",
    "avoid",
    "fail",
    "cannot",
    "does not",
    "replaced",
    "superseded",
    "previously",
    "former",
    "pre-migration",
    "legacy",
    "old ",
    "was ",
    "were ",
    "no longer",
    "moved from",
    "renamed",
];

export function isNegated(line: string): boolean {
    const lower = line.toLowerCase();
    return NEGATION_CUES.some((cue) => lower.includes(cue));
}

/**
 * For a CHANGELOG, the line index where the historical record begins — the second
 * released-version heading. Entries below it describe what was true at an earlier
 * release: the commands that shipped, the URLs that were live. Rewriting them to the
 * current truth would falsify the record, so hygiene checks that look for stale
 * *instructions* stop there. Returns null for every other document.
 */
export function historyStartLine(doc: Document): number | null {
    if (!doc.path.endsWith("CHANGELOG.md")) return null;
    const headings = doc.lines
        .map((line, index) => ({ line, index }))
        .filter((entry) => /^##\s+\[/.test(entry.line));
    return headings.length > 1 ? headings[1].index : null;
}

export interface PathReference {
    raw: string;
    line: number;
    /** True when the reference came from inside a fenced code block. */
    fenced: boolean;
}

/** Paths that name generated output, which need not exist before a build runs. */
const GENERATED = ["dist/", "coverage/", "storybook-static/", "node_modules/"];

/**
 * Path-like references a reader could follow: markdown link targets, Kiro
 * file references, and inline-code paths rooted at a known workspace directory.
 *
 * Wildcards, brace placeholders, and URLs are skipped — they are patterns, not
 * paths.
 */
export function pathReferences(doc: Document): PathReference[] {
    const fenced = fencedLines(doc.lines);
    const found: PathReference[] = [];

    const push = (raw: string, line: number) => {
        // Drop a trailing anchor: `../../README.md#section` points at a file plus a
        // heading, and only the file part is a filesystem path.
        const cleaned = raw.trim().replace(/#.*$/, "").replace(/[),.;:]+$/, "");
        if (cleaned === "") return;
        if (/^(https?:|mailto:|#)/.test(cleaned)) return;
        if (/[*?{}<>|\s]/.test(cleaned)) return;
        if (!cleaned.includes("/")) return;
        if (GENERATED.some((prefix) => cleaned.includes(prefix))) return;
        found.push({ raw: cleaned, line, fenced: fenced.has(line) });
    };

    for (const [index, line] of doc.lines.entries()) {
        for (const match of line.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) push(match[1], index);
        for (const match of line.matchAll(/#\[\[file:([^\]]+)\]\]/g)) push(match[1], index);
        for (const match of line.matchAll(/`([^`]+)`/g)) {
            const candidate = match[1];
            // Only inline code that reads as a workspace path, so prose in backticks and
            // shell snippets are not mistaken for file references. `.burkut/` is
            // deliberately absent: it names a directory inside the *user's* content
            // tree, which the workspace cannot be expected to contain.
            if (
                !/^(\.{0,2}\/)?(packages|apps|tools|tests|src|vite-plugins|scripts|\.kiro|\.github)\//.test(
                    candidate,
                )
            )
                continue;
            push(candidate, index);
        }
    }
    return found;
}

/** The nearest ancestor directory holding a package.json, or the workspace root. */
export function packageRootOf(doc: Document): string {
    let dir = doc.dir;
    while (dir.startsWith(ROOT) && dir !== ROOT) {
        if (existsSync(join(dir, "package.json"))) return dir;
        dir = dirname(dir);
    }
    return ROOT;
}

/**
 * A path reference resolves when it exists relative to the document, to the
 * document's package root, or to the workspace root — the three ways a reader
 * would reasonably read it.
 */
export function resolvesSomewhere(doc: Document, reference: string): boolean {
    const bases = [doc.dir, packageRootOf(doc), ROOT];
    return bases.some((base) => existsSync(resolve(base, reference)));
}
