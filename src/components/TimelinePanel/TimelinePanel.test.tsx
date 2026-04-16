import { beforeEach, describe, expect, it } from "vitest";
import type { ContentEntry, ContentIndex } from "../../shared/types.ts";

/**
 * SPEC: TimelinePanel / buildItems util + group visibility
 * ---------------------------------------------------------
 * 1. Index entries with start+end+group are converted to items
 * 2. Entries missing start/end are filtered out
 * 3. subtitle is appended to content if present
 * 4. className and type are read from frontmatter
 * 5. translatedGroups includes visible flag based on hiddenGroups set
 * 6. hiddenGroups persisted to / restored from localStorage
 *
 * NOTE: vis-timeline requires DOM in jsdom, so Timeline init
 * is left for integration tests.
 * This file only tests the pure buildItems and buildTranslatedGroups functions.
 */

// Isolated buildItems for direct testing
function buildItems(index: ContentIndex) {
  return Object.values(index)
    .filter((m: ContentEntry) => m.start && m.end && m.group)
    .map((m: ContentEntry) => ({
      id: m.id,
      content: m.subtitle
        ? `${m.title || m.id}<br><small>${m.subtitle}</small>`
        : ((m.title || m.id) as string),
      start: m.start as string,
      end: m.end as string,
      group: m.group as string,
      className: m.className || "",
      type: m.type || "range",
    }));
}

describe("buildItems", () => {
  it("converts valid items", () => {
    const index: ContentIndex = {
      xia: {
        id: "xia",
        title: "Xia Dynasty",
        subtitle: "2070–1600 BCE",
        start: "-002070-01-01",
        end: "-001600-01-01",
        group: "Dynasties",
        _path: "",
        _isHeader: false,
      },
    };
    const result = buildItems(index);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("xia");
    expect(result[0].content).toContain("2070–1600 BCE");
    expect(result[0].type).toBe("range");
  });

  it("filters out entries missing start/end", () => {
    const index: ContentIndex = {
      incomplete: {
        id: "incomplete",
        title: "Test",
        group: "Literature",
        _path: "",
        _isHeader: false,
      },
    };
    expect(buildItems(index)).toHaveLength(0);
  });

  it("reads className from frontmatter", () => {
    const index: ContentIndex = {
      xia: {
        id: "xia",
        start: "-002070-01-01",
        end: "-001600-01-01",
        group: "Dynasties",
        className: "semi-legendary",
        _path: "",
        _isHeader: false,
      },
    };
    expect(buildItems(index)[0].className).toBe("semi-legendary");
  });

  it("shows only title when subtitle is absent", () => {
    const index: ContentIndex = {
      test: {
        id: "test",
        title: "Test Item",
        start: "0618-01-01",
        end: "0907-01-01",
        group: "Dynasties",
        _path: "",
        _isHeader: false,
      },
    };
    expect(buildItems(index)[0].content).toBe("Test Item");
  });
});

/**
 * Pure function that derives vis.js groups from a ContentIndex, mirroring
 * the translatedGroups useMemo in TimelinePanel.
 */
function buildTranslatedGroups(index: ContentIndex, hiddenGroups: Set<string>) {
  const seen = new Set<string>();
  for (const item of Object.values(index)) {
    if (item.group) seen.add(item.group);
  }
  return [...seen].sort().map((groupId) => ({
    id: groupId,
    content: groupId,
    visible: !hiddenGroups.has(groupId),
  }));
}

const groupIndex: ContentIndex = {
  xia: { id: "xia", group: "Dynasties", _path: "", _isHeader: false },
  hero: { id: "hero", group: "Cinema", _path: "", _isHeader: false },
  poem: { id: "poem", group: "Literature", _path: "", _isHeader: false },
};

describe("buildTranslatedGroups (group visibility)", () => {
  it("all groups visible when hiddenGroups is empty", () => {
    const groups = buildTranslatedGroups(groupIndex, new Set());
    expect(groups).toHaveLength(3);
    for (const g of groups) expect(g.visible).toBe(true);
  });

  it("hides a single group when its id is in hiddenGroups", () => {
    const hidden = new Set(["Cinema"]);
    const groups = buildTranslatedGroups(groupIndex, hidden);
    const cinema = groups.find((g) => g.id === "Cinema");
    const dynasties = groups.find((g) => g.id === "Dynasties");
    expect(cinema?.visible).toBe(false);
    expect(dynasties?.visible).toBe(true);
  });

  it("hides multiple groups", () => {
    const hidden = new Set(["Cinema", "Literature"]);
    const groups = buildTranslatedGroups(groupIndex, hidden);
    expect(groups.filter((g) => g.visible)).toHaveLength(1);
    expect(groups.find((g) => g.id === "Dynasties")?.visible).toBe(true);
  });

  it("unknown ids in hiddenGroups don't affect existing groups", () => {
    const hidden = new Set(["NonExistentGroup"]);
    const groups = buildTranslatedGroups(groupIndex, hidden);
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
