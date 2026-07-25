// Feature: ay-monorepo-foundation, Property 18: For any set of workspace
// documents, exactly one document SHALL contain the three-tier token architecture
// statement, and every other document that mentions the tiers SHALL reference that
// document through Kiro's file-reference syntax rather than restating it.
//
// **Validates: Requirements 15.5, 15.6**
//
// The property quantifies over every markdown and steering document git knows
// about, so it is checked exhaustively over the real document set. Two definitions
// carry the check:
//
//   * a document *states* the architecture when it names all three tiers together
//     with their naming patterns — the shape of the table that used to be
//     duplicated in two tech.md files;
//   * a document *mentions* the tiers when it uses the vocabulary at all, and such a
//     document must point at the canonical statement rather than paraphrase it.
//
// Steering documents must use Kiro's `#[[file:…]]` syntax, which loads the document
// into context. Plain documents may reference it with an ordinary markdown link,
// because a README reader follows links themselves.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { documents } from "./helpers/docs";
import { ROOT } from "./helpers/workspace";

const CANONICAL = "packages/tokens/TOKEN-ARCHITECTURE.md";
const KIRO_REFERENCE = `#[[file:${CANONICAL}]]`;

/** The three naming patterns. A document holding all three is stating the tiers. */
const TIER_PATTERNS = [
    /--\{category\}-\{name\}-\{scale\}/,
    /--\{category\}-\{context\}/,
    /--\{component\}-\{property\}/,
];

/** Vocabulary that means the document is talking about the tier architecture. */
const TIER_MENTIONS = [
    /three-tier/i,
    /core (?:token )?tier/i,
    /semantic (?:token )?tier/i,
    /component (?:token )?tier/i,
    /core → semantic → component/i,
];

function statesArchitecture(text: string): boolean {
    return TIER_PATTERNS.every((pattern) => pattern.test(text));
}

function mentionsTiers(text: string): boolean {
    return TIER_MENTIONS.some((pattern) => pattern.test(text));
}

function referencesCanonical(text: string, isSteering: boolean): boolean {
    if (text.includes(KIRO_REFERENCE)) return true;
    // A non-steering document may link instead; steering must use the Kiro syntax so
    // the canonical text is actually loaded rather than merely linked.
    return !isSteering && text.includes("TOKEN-ARCHITECTURE.md");
}

describe("Property 18: token architecture is stated exactly once", () => {
    it("has exactly one document stating the three tiers, and it is the canonical one", () => {
        const stating = documents()
            .filter((doc) => statesArchitecture(doc.text))
            .map((doc) => doc.path);
        expect(stating).toEqual([CANONICAL]);
    });

    it("makes every other tier-mentioning document reference the canonical statement", () => {
        const violations = documents()
            .filter((doc) => doc.path !== CANONICAL)
            .filter((doc) => mentionsTiers(doc.text))
            .filter((doc) => !referencesCanonical(doc.text, doc.isSteering))
            .map((doc) => doc.path);
        expect(violations).toEqual([]);
    });

    it("keeps the canonical document inside the published token package", () => {
        // Requirement 15.5's single statement is only durable if external consumers get
        // the same text, which means it must ship in the tarball.
        expect(documents().some((doc) => doc.path === CANONICAL)).toBe(true);
        const manifest = JSON.parse(
            readFileSync(join(ROOT, "packages", "tokens", "package.json"), "utf-8"),
        ) as { files: string[] };
        expect(manifest.files).toContain("TOKEN-ARCHITECTURE.md");
    });
});
