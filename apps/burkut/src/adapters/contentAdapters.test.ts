import { describe, expect, it, vi } from "vitest";
import type { ContentIndex } from "../shared/types.ts";
import {
  buildContentViewModel,
  buildGeoFeatures,
  buildSidebarTree,
  buildTimelineItems,
  resolveContentId,
} from "./contentAdapters.ts";

describe("buildSidebarTree", () => {
  const index: ContentIndex = {
    xia: {
      id: "xia",
      group: "Dynasties and States",
      title: "Xia Dynasty",
      start: "-002070-01-01",
      _path: "",
      _isHeader: false,
    },
    shang: {
      id: "shang",
      group: "Dynasties and States",
      title: "Shang Dynasty",
      start: "-001600-01-01",
      _path: "",
      _isHeader: false,
    },
    period_ancient: {
      id: "period_ancient",
      group: "Dynasties and States",
      title: "🟢 Ancient China",
      start: "-002070-01-01",
      type: "background",
      _path: "",
      _isHeader: false,
    },
    "Dynasties and States": {
      id: "Dynasties and States",
      group: "Dynasties and States",
      title: "Dynasties and States",
      sidebarSort: "start",
      _path: "",
      _isHeader: true,
    },
    lit_b: { id: "lit_b", group: "Literature", title: "Chapter B", _path: "", _isHeader: false },
    lit_a: { id: "lit_a", group: "Literature", title: "Chapter A", _path: "", _isHeader: false },
  };

  it("derives one TreeNode per group, sorted alphabetically", () => {
    const tree = buildSidebarTree(index);
    expect(tree.map((g) => g.id)).toEqual(["Dynasties and States", "Literature"]);
  });

  it("excludes header entries from children", () => {
    const tree = buildSidebarTree(index);
    const group = tree.find((g) => g.id === "Dynasties and States");
    const ids = group?.children?.map((c) => c.id) ?? [];
    expect(ids).not.toContain("Dynasties and States");
  });

  it("sidebarSort: 'start' sorts children chronologically, background items first at equal dates", () => {
    const tree = buildSidebarTree(index);
    const group = tree.find((g) => g.id === "Dynasties and States");
    const ids = group?.children?.map((c) => c.id) ?? [];
    expect(ids.indexOf("period_ancient")).toBeLessThan(ids.indexOf("xia"));
    expect(ids.indexOf("xia")).toBeLessThan(ids.indexOf("shang"));
  });

  it("marks background-type entries as isSubheading", () => {
    const tree = buildSidebarTree(index);
    const group = tree.find((g) => g.id === "Dynasties and States");
    const ancient = group?.children?.find((c) => c.id === "period_ancient");
    expect(ancient?.isSubheading).toBe(true);
  });

  it("groups without sidebarSort are sorted alphabetically by title", () => {
    const tree = buildSidebarTree(index);
    const group = tree.find((g) => g.id === "Literature");
    const labels = group?.children?.map((c) => c.label) ?? [];
    expect(labels).toEqual(["Chapter A", "Chapter B"]);
  });

  it("marks completed groups and items from completedSet", () => {
    const tree = buildSidebarTree(index, new Set(["xia", "Literature"]));
    const dynasties = tree.find((g) => g.id === "Dynasties and States");
    const literature = tree.find((g) => g.id === "Literature");
    expect(dynasties?.children?.find((c) => c.id === "xia")?.completed).toBe(true);
    expect(dynasties?.children?.find((c) => c.id === "shang")?.completed).toBeFalsy();
    expect(literature?.completed).toBe(true);
  });
});

describe("buildTimelineItems", () => {
  it("filters and maps entries with start+end+group", () => {
    const index: ContentIndex = {
      xia: {
        id: "xia",
        title: "Xia Dynasty",
        start: "-002070-01-01",
        end: "-001600-01-01",
        group: "Dynasties",
        _path: "",
        _isHeader: false,
      },
      incomplete: { id: "incomplete", group: "Literature", _path: "", _isHeader: false },
    };
    const items = buildTimelineItems(index);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("xia");
  });
});

describe("buildGeoFeatures", () => {
  it("maps only located entries to GeoFeature", () => {
    const index: ContentIndex = {
      shang: {
        id: "shang",
        title: "Shang Dynasty",
        location: { lat: 36.1, lng: 114.3, label: "Yinxu" },
        _path: "",
        _isHeader: false,
      },
      unlocated: { id: "unlocated", _path: "", _isHeader: false },
    };
    const features = buildGeoFeatures(index);
    expect(features).toHaveLength(1);
    expect(features[0]).toMatchObject({ id: "shang", lat: 36.1, lng: 114.3, label: "Yinxu" });
  });
});

describe("resolveContentId", () => {
  it("returns selectedId when present", () => {
    expect(resolveContentId("xia", "Dynasties")).toBe("xia");
  });

  it("falls back to activeGroup when selectedId is null", () => {
    expect(resolveContentId(null, "Dynasties")).toBe("Dynasties");
  });
});

describe("buildContentViewModel", () => {
  const index: ContentIndex = {
    xia: {
      id: "xia",
      title: "Xia Dynasty",
      subtitle: "2070–1600 BCE",
      tags: ["legendary"],
      _path: "",
      _isHeader: false,
    },
  };

  it("resolves markdown via getContent and meta from the selected entry", () => {
    const getContent = vi.fn().mockReturnValue("Content.");
    const vm = buildContentViewModel(index, getContent, "xia", "Dynasties");
    expect(getContent).toHaveBeenCalledWith("xia");
    expect(vm.markdown).toBe("Content.");
    expect(vm.subtitle).toBe("2070–1600 BCE");
    expect(vm.tags).toEqual(["legendary"]);
  });

  it("falls back to activeGroup header content when selectedId is null, without meta", () => {
    const getContent = vi.fn().mockReturnValue("# Header\n\nGroup description.");
    const vm = buildContentViewModel(index, getContent, null, "Dynasties");
    expect(getContent).toHaveBeenCalledWith("Dynasties");
    expect(vm.markdown).toBe("# Header\n\nGroup description.");
    expect(vm.subtitle).toBeUndefined();
  });

  it("markdown is null when getContent returns null", () => {
    const getContent = vi.fn().mockReturnValue(null);
    const vm = buildContentViewModel(index, getContent, "xia", "Dynasties");
    expect(vm.markdown).toBeNull();
  });
});
