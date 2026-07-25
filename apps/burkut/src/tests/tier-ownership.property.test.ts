// Feature: ay-monorepo-foundation, Property 3: For any CSS file in @ay/ui-library
// or in the Bürküt application, that file SHALL declare no custom property whose
// name belongs to the core or semantic tier owned by @ay/tokens; and for any
// custom property declared by @ay/tokens, that property's name SHALL belong to
// the core or semantic tier and SHALL match no legacy-alias name, no
// app-specific prefix, and no component-tier prefix.
//
// **Validates: Requirements 4.1, 4.5, 4.8, 4.9, 4.10, 4.11, 6.4, 16.7**
//
// This is the Bürküt half of the property, and it is what satisfies Requirement
// 16.7 — the test suite asserting that the Bürküt application declares no core
// or semantic custom property. The owned name sets are read from
// packages/tokens/src/ rather than hardcoded, so a token added there tightens
// this check automatically.

import { relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  APP,
  APP_TOKENS_CSS,
  coreNames,
  declaredNames,
  filesUnder,
  ROOT,
  read,
  semanticNames,
} from "./helpers/css";

const CORE = coreNames();
const SEMANTIC = semanticNames();
const BURKUT_CSS = filesUnder(APP, [".css"]);

/** Prefixes that mark a name as belonging to a tier @ay/tokens must not own. */
const APP_SPECIFIC_PREFIXES = ["--tl-bg-", "--vis-"];
const APP_SPECIFIC_NAMES = ["--font-serif"];
const COMPONENT_PREFIXES = ["--spiral-", "--image-zoom-", "--btn-"];

describe("Property 3: bidirectional tier ownership — Bürküt half", () => {
  it("declares no core-tier or semantic-tier custom property anywhere in Bürküt CSS", () => {
    const violations: string[] = [];
    let namesScanned = 0;

    for (const file of BURKUT_CSS) {
      for (const name of declaredNames(read(file))) {
        namesScanned++;
        if (CORE.has(name)) {
          violations.push(relative(ROOT, file) + " declares core token " + name);
        } else if (SEMANTIC.has(name)) {
          violations.push(relative(ROOT, file) + " declares semantic token " + name);
        }
      }
    }

    expect(violations, "Bürküt declares tokens @ay/tokens owns").toEqual([]);
    // Non-vacuity: the glob actually found and parsed Bürküt's stylesheets.
    expect(BURKUT_CSS.length).toBeGreaterThan(0);
    expect(namesScanned).toBeGreaterThan(20);
  });

  it("declares every app-specific token Requirement 7 names, in the themes it names them for", () => {
    const css = read(APP_TOKENS_CSS);
    const names = new Set(declaredNames(css));
    const timeline = ["ancient", "early", "fragment", "mid", "late", "modern"].map(
      (era) => "--tl-bg-" + era,
    );
    const vis = ["bg", "text", "border", "item-bg", "item-border", "item-text"].map(
      (part) => "--vis-" + part,
    );

    for (const name of [...timeline, ...vis, "--font-serif"]) {
      expect(names.has(name), name + " is not declared by app-tokens.css").toBe(true);
    }
  });

  it("keeps the reverse direction: @ay/tokens owns no Bürküt-tier name", () => {
    // The other half of the bidirectional property, checked from the consumer's
    // side too: the shared package must not have absorbed an app-specific token,
    // a legacy alias, or a component token.
    const owned = [...CORE, ...SEMANTIC];
    const trespassing = owned.filter(
      (name) =>
        APP_SPECIFIC_PREFIXES.some((prefix) => name.startsWith(prefix)) ||
        APP_SPECIFIC_NAMES.includes(name) ||
        COMPONENT_PREFIXES.some((prefix) => name.startsWith(prefix)),
    );
    expect(trespassing, "@ay/tokens declares a name it does not own").toEqual([]);

    // Every legacy alias Bürküt declares must be absent from @ay/tokens (6.4).
    const aliasNames = declaredNames(read(APP_TOKENS_CSS)).filter(
      (name) =>
        !APP_SPECIFIC_PREFIXES.some((prefix) => name.startsWith(prefix)) &&
        !APP_SPECIFIC_NAMES.includes(name),
    );
    expect(aliasNames.length).toBeGreaterThan(0);
    expect(aliasNames.filter((name) => CORE.has(name) || SEMANTIC.has(name))).toEqual([]);
  });
});
