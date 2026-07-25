/**
 * Tests for the baseline resolver.
 *
 * The resolver is the instrument the whole token migration is measured with, so
 * it carries its own tests. These are not one of the 20 design properties.
 *
 * Run: node --test tools/tokens/
 *
 * The node: test runner is used rather than Vitest because there is no pnpm
 * workspace and no root test project yet, and the Bürküt Vitest config's
 * `include` covers only `src/` and `vite-plugins/`. Moving these into a root
 * Vitest project belongs to task 4.4, which creates `tests/`.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import fc from "fast-check";
import { parseBlocks, resolveAll, resolveThemes } from "./resolve.mjs";

const RUNS = 200; // design's Testing Strategy sets a 100-iteration minimum

const BURKUT_CSS = readFileSync(new URL("../../src/styles/global.css", import.meta.url), "utf-8");
const LIBRARY_CSS = readFileSync(
    new URL("../../ay-ui-library/src/styles/tokens.css", import.meta.url),
    "utf-8",
);

/* ── Generators ──────────────────────────────────────────────────────────── */

const literalArb = fc.constantFrom(
    "#f29b17",
    "#f29b1744",
    "rgba(242, 155, 23, 0.12)",
    "6px",
    "0.15s",
    "0.85rem",
    "1px solid black",
);

const nameOf = (i) => `--t${i}`;

/**
 * An acyclic declaration map: token `i` may only reference a token `j < i`, so
 * a cycle is impossible by construction. Values mix plain literals, bare
 * references, references with an unused fallback, references to an *undeclared*
 * name with a fallback, and a `calc()` wrapping a reference.
 */
const acyclicDeclsArb = fc.integer({ min: 1, max: 10 }).chain((n) =>
    fc
        .tuple(
            ...Array.from({ length: n }, (_, i) => {
                const shapes = [literalArb.map((v) => ({ kind: "literal", v }))];
                if (i > 0) {
                    const refIdx = fc.integer({ min: 0, max: i - 1 });
                    shapes.push(refIdx.map((j) => ({ kind: "ref", j })));
                    shapes.push(
                        fc.tuple(refIdx, literalArb).map(([j, fb]) => ({ kind: "refWithFallback", j, fb })),
                    );
                    shapes.push(refIdx.map((j) => ({ kind: "calc", j })));
                }
                shapes.push(literalArb.map((fb) => ({ kind: "missingWithFallback", fb })));
                return fc.oneof(...shapes);
            }),
        )
        .map((items) => {
            const decls = new Map();
            items.forEach((item, i) => {
                switch (item.kind) {
                    case "literal":
                        decls.set(nameOf(i), item.v);
                        break;
                    case "ref":
                        decls.set(nameOf(i), `var(${nameOf(item.j)})`);
                        break;
                    case "refWithFallback":
                        decls.set(nameOf(i), `var(${nameOf(item.j)}, ${item.fb})`);
                        break;
                    case "calc":
                        decls.set(nameOf(i), `calc(var(${nameOf(item.j)}) * 1.5)`);
                        break;
                    default:
                        decls.set(nameOf(i), `var(--absent-${i}, ${item.fb})`);
                }
            });
            return decls;
        }),
);

/* ── Property tests ──────────────────────────────────────────────────────── */

describe("resolveAll properties", () => {
    test("resolution is idempotent", () => {
        fc.assert(
            fc.property(acyclicDeclsArb, (decls) => {
                const once = resolveAll(decls);
                const twice = resolveAll(once);
                assert.deepEqual([...twice], [...once]);
            }),
            { numRuns: RUNS },
        );
    });

    test("no var() survives a successful resolution", () => {
        fc.assert(
            fc.property(acyclicDeclsArb, (decls) => {
                for (const value of resolveAll(decls).values()) {
                    assert.ok(!value.includes("var("), `unresolved var() in ${value}`);
                }
            }),
            { numRuns: RUNS },
        );
    });

    test("cyclic chains throw", () => {
        // A ring of `k` tokens, each referencing the next, closed back on the first.
        fc.assert(
            fc.property(fc.integer({ min: 1, max: 8 }), fc.boolean(), (k, withFallback) => {
                const decls = new Map();
                for (let i = 0; i < k; i++) {
                    const next = nameOf((i + 1) % k);
                    decls.set(nameOf(i), withFallback ? `var(${next}, #000)` : `var(${next})`);
                }
                assert.throws(() => resolveAll(decls), /Cyclic custom property reference/);
            }),
            { numRuns: RUNS },
        );
    });

    test("var(--x, fb) selects fb exactly when --x is undeclared", () => {
        fc.assert(
            fc.property(
                literalArb,
                literalArb,
                fc.boolean(),
                (declaredValue, fallback, declareTarget) => {
                    fc.pre(declaredValue !== fallback);
                    const decls = new Map();
                    if (declareTarget) decls.set("--target", declaredValue);
                    decls.set("--consumer", `var(--target, ${fallback})`);

                    const resolved = resolveAll(decls).get("--consumer");
                    assert.equal(resolved, declareTarget ? declaredValue : fallback);
                },
            ),
            { numRuns: RUNS },
        );
    });
});

/* ── Unit tests ──────────────────────────────────────────────────────────── */

describe("parseBlocks", () => {
    test("collects :root, [data-theme=\"dark\"] and @theme static as blocks", () => {
        const css = `
      @import "tailwindcss";
      /* a comment with a } brace */
      @theme static {
        --color-amber-500: #f29b17;
      }
      :root { --color-primary: var(--color-amber-500); color-scheme: light; }
      [data-theme="dark"] { --color-primary: #f5ab35; }
      .btn { --btn-height: 32px; color: var(--color-primary); }
      @media (min-width: 40rem) { :root { --gutter: 2rem; } }
    `;
        const { root, dark } = parseBlocks([css]);

        assert.equal(root.get("--color-amber-500"), "#f29b17");
        assert.equal(root.get("--color-primary"), "var(--color-amber-500)");
        assert.equal(root.get("--gutter"), "2rem");
        assert.equal(dark.get("--color-primary"), "#f5ab35");
        // Only custom properties, and only from root-level / dark blocks.
        assert.ok(!root.has("color-scheme"));
        assert.ok(!root.has("--btn-height"));
    });

    test("later sources override earlier ones, matching the cascade", () => {
        const { root } = parseBlocks([":root { --x: a; }", ":root { --x: b; }"]);
        assert.equal(root.get("--x"), "b");
    });
});

describe("resolveAll errors", () => {
    test("throws on an undeclared name with no fallback, naming it", () => {
        assert.throws(
            () => resolveAll(new Map([["--a", "var(--nope)"]])),
            /Unresolvable custom property --nope referenced by --a/,
        );
    });
});

describe("resolveThemes against the pre-migration sources", () => {
    test("dark resolves as an overlay on root", () => {
        const { light, dark } = resolveThemes([BURKUT_CSS]);

        // Redeclared in dark.
        assert.equal(light["--color-primary"], "#f29b17");
        assert.equal(dark["--color-primary"], "#f5ab35");
        assert.equal(light["--code-bg"], "#eff1f3");
        assert.equal(dark["--code-bg"], "#2d333b");

        // Not redeclared in dark: the root declaration still applies, so the value
        // stays on the amber-500 chain.
        assert.equal(light["--accent-a66"], "#f29b1766");
        assert.equal(dark["--accent-a66"], "#f29b1766");

        // Redeclared in dark and re-pointed at the amber-400 chain.
        assert.equal(light["--accent-a44"], "#f29b1744");
        assert.equal(dark["--accent-a44"], "rgba(245, 171, 53, 0.27)");
    });

    test("every declared custom property resolves in both themes with no var() left", () => {
        for (const css of [BURKUT_CSS, LIBRARY_CSS]) {
            const { root, dark: darkDecls } = parseBlocks([css]);
            const declared = new Set([...root.keys(), ...darkDecls.keys()]);
            const { light, dark } = resolveThemes([css]);

            for (const name of declared) {
                assert.ok(name in light, `${name} missing from light`);
                assert.ok(name in dark, `${name} missing from dark`);
                assert.ok(!light[name].includes("var("), `${name} light unresolved: ${light[name]}`);
                assert.ok(!dark[name].includes("var("), `${name} dark unresolved: ${dark[name]}`);
            }
        }
    });

    test("the two sources disagree on dark --color-border-hover only", () => {
        const burkut = resolveThemes([BURKUT_CSS]);
        const library = resolveThemes([LIBRARY_CSS]);

        assert.equal(burkut.dark["--color-border-hover"], "#f29b1744");
        assert.equal(library.dark["--color-border-hover"], "rgba(245, 171, 53, 0.27)");
        assert.equal(burkut.light["--color-border-hover"], library.light["--color-border-hover"]);

        const shared = Object.keys(library.dark).filter((n) => n in burkut.dark);
        const differing = shared.filter((n) => burkut.dark[n] !== library.dark[n]);
        assert.deepEqual(differing, ["--color-border-hover"]);
    });
});
