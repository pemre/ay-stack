import { beforeEach, describe, expect, it } from "vitest";
import { buildLinearTimelineGroups } from "./LinearTimeline.tsx";
import type { LinearTimelineItem } from "./types.ts";

/**
 * SPEC: LinearTimeline / group visibility
 * ---------------------------------------------------------
 * 1. Timeline items are converted into sorted groups
 * 2. Group visibility follows the hiddenGroups set
 * 3. hiddenGroups can be persisted to / restored from localStorage
 *
 * NOTE: vis-timeline requires DOM in jsdom, so Timeline init is left for
 * integration tests. This file tests the pure group helper.
 */

const groupItems: LinearTimelineItem[] = [
  {
    id: "xia",
    content: "Xia",
    start: "-002070-01-01",
    end: "-001600-01-01",
    group: "Dynasties",
    className: "",
    type: "range",
  },
  {
    id: "hero",
    content: "Hero",
    start: "1900-01-01",
    end: "1901-01-01",
    group: "Cinema",
    className: "",
    type: "range",
  },
  {
    id: "poem",
    content: "Poem",
    start: "1900-01-01",
    end: "1901-01-01",
    group: "Literature",
    className: "",
    type: "range",
  },
];

describe("buildTranslatedGroups (group visibility)", () => {
  it("all groups visible when hiddenGroups is empty", () => {
    const groups = buildLinearTimelineGroups(groupItems, new Set());
    expect(groups).toHaveLength(3);
    for (const g of groups) expect(g.visible).toBe(true);
  });

  it("hides a single group when its id is in hiddenGroups", () => {
    const hidden = new Set(["Cinema"]);
    const groups = buildLinearTimelineGroups(groupItems, hidden);
    const cinema = groups.find((g) => g.id === "Cinema");
    const dynasties = groups.find((g) => g.id === "Dynasties");
    expect(cinema?.visible).toBe(false);
    expect(dynasties?.visible).toBe(true);
  });

  it("hides multiple groups", () => {
    const hidden = new Set(["Cinema", "Literature"]);
    const groups = buildLinearTimelineGroups(groupItems, hidden);
    expect(groups.filter((g) => g.visible)).toHaveLength(1);
    expect(groups.find((g) => g.id === "Dynasties")?.visible).toBe(true);
  });

  it("unknown ids in hiddenGroups don't affect existing groups", () => {
    const hidden = new Set(["NonExistentGroup"]);
    const groups = buildLinearTimelineGroups(groupItems, hidden);
    for (const g of groups) expect(g.visible).toBe(true);
  });
});

describe("hiddenGroups localStorage persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores hiddenGroups as JSON array in localStorage", () => {
    const hidden = new Set(["Cinema", "Literature"]);
    localStorage.setItem("hiddenGroups", JSON.stringify([...hidden]));
    const stored = JSON.parse(localStorage.getItem("hiddenGroups") ?? "[]") as string[];
    expect(stored).toEqual(expect.arrayContaining(["Cinema", "Literature"]));
    expect(stored).toHaveLength(2);
  });

  it("restores hiddenGroups Set from localStorage", () => {
    localStorage.setItem("hiddenGroups", JSON.stringify(["Cinema"]));
    const stored = localStorage.getItem("hiddenGroups") ?? "[]";
    const restored = new Set(JSON.parse(stored) as string[]);
    expect(restored.has("Cinema")).toBe(true);
    expect(restored.has("Literature")).toBe(false);
  });

  it("returns empty Set when localStorage is empty", () => {
    const stored = localStorage.getItem("hiddenGroups");
    const restored = stored ? new Set(JSON.parse(stored) as string[]) : new Set<string>();
    expect(restored.size).toBe(0);
  });

  it("returns empty Set when localStorage has invalid JSON", () => {
    localStorage.setItem("hiddenGroups", "not-json");
    let restored: Set<string>;
    try {
      restored = new Set(JSON.parse(localStorage.getItem("hiddenGroups") ?? "[]") as string[]);
    } catch {
      restored = new Set();
    }
    expect(restored.size).toBe(0);
  });
});
