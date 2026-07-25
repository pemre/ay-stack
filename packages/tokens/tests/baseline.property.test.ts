// Feature: ay-monorepo-foundation, Property 1: For any pre-migration source
// (Bürküt's global.css, ay-ui-library/src/styles/tokens.css) and for any custom
// property that source declares, resolving that property through THAT SOURCE'S
// OWN post-migration stylesheet chain SHALL yield the identical literal value in
// the light theme and in the dark theme, except for the single allowlisted entry
// — dark --color-border-hover on Bürküt's consumer chain.
//
// **Validates: Requirements 4.4, 6.5, 7.4, 8.1, 8.2, 8.3, 8.4**
//
// The diff is PER CONSUMER. The two pre-migration sources were independent
// consumers, not layers of one cascade: Bürküt never loaded the library's
// tokens.css and the library never loaded global.css. So each consumer's own
// `perSource` baseline is diffed against that same consumer's own post-migration
// chain. The merged light/dark maps are not used — they carry Bürküt's dark
// --color-border-hover into a comparison the library never made, which would
// charge the library with a change to a value it never declared.
//
// Resolution comes from tools/tokens/resolve.mjs, the same instrument that
// captured the baseline, so both sides of every comparison are produced by
// identical semantics.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveThemes } from "../../../tools/tokens/resolve.mjs";
import { ROOT, read } from "./helpers/css";

type Theme = "light" | "dark";
const THEMES: Theme[] = ["light", "dark"];

interface Baseline {
  sources: string[];
  perSource: Record<string, Record<Theme, Record<string, string>>>;
}

const baseline: Baseline = JSON.parse(read(ROOT, "tools", "tokens", "baseline.json"));

interface ChainEntry {
  /** Workspace-relative path. */
  path: string;
  /** Set when a later task creates the file; absence then skips instead of failing. */
  pendingTask?: string;
}

interface Consumer {
  label: string;
  /** Key into baseline.perSource — the consumer's own pre-migration source. */
  baselineKey: string;
  /** Custom properties the baseline recorded for this consumer, per theme. */
  expectedProperties: number;
  /** The consumer's post-migration stylesheet chain, in cascade order. */
  chain: ChainEntry[];
}

const CONSUMERS: Consumer[] = [
  {
    label: "burkut",
    baselineKey: "src/styles/global.css",
    expectedProperties: 78,
    chain: [
      { path: "packages/tokens/dist/tokens.css" },
      { path: "apps/burkut/src/styles/app-tokens.css", pendingTask: "task 12.2" },
    ],
  },
  {
    label: "@ay/ui-library",
    baselineKey: "ay-ui-library/src/styles/tokens.css",
    expectedProperties: 38,
    chain: [{ path: "packages/tokens/dist/tokens.css" }],
  },
];

// The one accepted deviation in the whole feature, keyed by source path so it is
// scoped to Bürküt's chain alone: the same drift in @ay/ui-library is a plain
// failure. Nothing may be added here without a corresponding design decision.
const ALLOWED_DEVIATIONS: Record<
  string,
  Partial<Record<Theme, Record<string, { from: string; to: string; reason: string }>>>
> = {
  "src/styles/global.css": {
    dark: {
      "--color-border-hover": {
        from: "#f29b1744",
        to: "rgba(245, 171, 53, 0.27)",
        reason: "design.md — dark accent derives from amber-400, matching --color-primary",
      },
    },
  },
};

interface Deviation {
  theme: Theme;
  name: string;
  from: string;
  to: string;
}

interface Report {
  /** Baseline keys absent from the post-migration chain — a token disappeared. */
  missing: string[];
  /** Values that changed and are not allowlisted. */
  changed: string[];
  /** Values that changed and are allowlisted. */
  accepted: Deviation[];
  /** How many baseline properties were compared, per theme. */
  checked: Record<Theme, number>;
}

function absentEntries(consumer: Consumer): ChainEntry[] {
  return consumer.chain.filter((entry) => !existsSync(join(ROOT, entry.path)));
}

function diff(consumer: Consumer): Report {
  const post = resolveThemes(consumer.chain.map((entry) => read(ROOT, entry.path)));
  const base = baseline.perSource[consumer.baselineKey];
  if (!base) throw new Error("baseline.json has no perSource entry for " + consumer.baselineKey);

  const allowed = ALLOWED_DEVIATIONS[consumer.baselineKey] ?? {};
  const report: Report = {
    missing: [],
    changed: [],
    accepted: [],
    checked: { light: 0, dark: 0 },
  };

  for (const theme of THEMES) {
    const before = base[theme];
    const after = post[theme] as Record<string, string>;
    for (const [name, expected] of Object.entries(before)) {
      report.checked[theme]++;
      if (!(name in after)) {
        report.missing.push(theme + " " + name + " (was " + expected + ")");
        continue;
      }
      const actual = after[name];
      if (actual === expected) continue;
      const allow = allowed[theme]?.[name];
      if (allow && allow.from === expected && allow.to === actual) {
        report.accepted.push({ theme, name, from: expected, to: actual });
        continue;
      }
      report.changed.push(theme + " " + name + ": " + expected + " -> " + actual);
    }
  }
  return report;
}

// Reported at collection time so a pending chain file is impossible to miss in
// the test output, rather than the consumer quietly dropping out of the diff.
const pending = CONSUMERS.map((consumer) => ({ consumer, absent: absentEntries(consumer) })).filter(
  (entry) => entry.absent.length > 0,
);

for (const { consumer, absent } of pending) {
  const unowned = absent.filter((entry) => !entry.pendingTask);
  const owned = absent.filter((entry) => entry.pendingTask);
  if (owned.length > 0 && unowned.length === 0) {
    console.warn(
      "\n⚠️  BASELINE DIFF INCOMPLETE for " +
        consumer.label +
        ": the post-migration chain is not fully in place yet.\n" +
        owned
          .map((entry) => "    missing " + entry.path + " — created by " + entry.pendingTask)
          .join("\n") +
        "\n    This consumer's " +
        consumer.expectedProperties +
        " properties are NOT being checked. The diff gets stronger automatically\n" +
        "    once that file exists; nothing here needs changing.\n",
    );
  }
}

describe("Property 1: computed-value preservation across the migration", () => {
  for (const consumer of CONSUMERS) {
    const absent = absentEntries(consumer);
    const skip = absent.length > 0 && absent.every((entry) => entry.pendingTask);

    it.skipIf(skip)(
      "resolves every " + consumer.label + " baseline property to its pre-migration literal",
      () => {
        // A chain file that no later task owns is a real failure, not a skip.
        const unowned = absent.filter((entry) => !entry.pendingTask);
        expect(
          unowned.map((entry) => entry.path),
          "post-migration chain file missing for " + consumer.label,
        ).toEqual([]);

        const report = diff(consumer);

        // Missing keys and changed values are distinct failures so the cause is
        // unambiguous: a token that disappeared is not a token that drifted.
        expect(report.missing, "tokens missing from the " + consumer.label + " chain").toEqual([]);
        expect(
          report.changed,
          "computed values changed on the " + consumer.label + " chain",
        ).toEqual([]);

        // Exhaustive, not sampled: every property the baseline recorded for this
        // consumer was compared in both themes.
        expect(report.checked.light).toBe(consumer.expectedProperties);
        expect(report.checked.dark).toBe(consumer.expectedProperties);

        // Only Bürküt's chain may deviate, and only on the one allowlisted entry.
        const allowedNames = Object.keys(ALLOWED_DEVIATIONS[consumer.baselineKey]?.dark ?? {});
        expect(report.accepted.map((d) => d.name).sort()).toEqual(allowedNames.sort());
      },
    );
  }

  it("checks at least one consumer chain in full, so the guard is never vacuous", () => {
    const checkedInFull = CONSUMERS.filter((consumer) => absentEntries(consumer).length === 0);
    expect(
      checkedInFull.map((consumer) => consumer.label),
      "every consumer chain is incomplete, so Property 1 proved nothing. Pending: " +
        pending.flatMap(({ absent }) => absent.map((entry) => entry.path)).join(", "),
    ).not.toEqual([]);

    const totalChecked = checkedInFull.reduce(
      (sum, consumer) => sum + diff(consumer).checked.light + diff(consumer).checked.dark,
      0,
    );
    expect(totalChecked).toBeGreaterThan(0);
  });

  it("does not tolerate the allowlisted drift outside Bürküt's chain", () => {
    // Scoping the allowlist by source path is what makes it a design decision
    // about one consumer rather than a blanket exemption for the token name.
    expect(Object.keys(ALLOWED_DEVIATIONS)).toEqual(["src/styles/global.css"]);
    expect(ALLOWED_DEVIATIONS["ay-ui-library/src/styles/tokens.css"]).toBeUndefined();

    const library = CONSUMERS.find((consumer) => consumer.label === "@ay/ui-library");
    if (!library || absentEntries(library).length > 0) return;
    const post = resolveThemes(library.chain.map((entry) => read(ROOT, entry.path)));
    expect((post.dark as Record<string, string>)["--color-border-hover"]).toBe(
      "rgba(245, 171, 53, 0.27)",
    );
  });
});
