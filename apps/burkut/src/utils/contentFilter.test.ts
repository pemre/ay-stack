import { describe, expect, it } from "vitest";
import type {
  ContentFilter,
  ContentIndex,
  ContentWidgetConfig,
  MapWidgetConfig,
  SidebarWidgetConfig,
  TimelineWidgetConfig,
} from "../shared/types.ts";
import { applyFilter, resolveFilter } from "./contentFilter.ts";

// ── resolveFilter ──

describe("resolveFilter", () => {
  const dashboardFilter: ContentFilter = {
    contentType: "image",
    tags: ["travel"],
    sourceDirectory: "photos/",
  };

  it("returns instance-level filter when sidebar has non-empty tags", () => {
    const config: SidebarWidgetConfig = { type: "sidebar", tags: ["history"], contentType: null };
    const result = resolveFilter(dashboardFilter, config);
    expect(result).toEqual({ tags: ["history"], contentType: null });
  });

  it("returns instance-level filter when sidebar has non-null contentType", () => {
    const config: SidebarWidgetConfig = { type: "sidebar", tags: [], contentType: "markdown" };
    const result = resolveFilter(dashboardFilter, config);
    expect(result).toEqual({ tags: [], contentType: "markdown" });
  });

  it("returns instance-level filter when sidebar has both tags and contentType", () => {
    const config: SidebarWidgetConfig = {
      type: "sidebar",
      tags: ["art"],
      contentType: "video",
    };
    const result = resolveFilter(dashboardFilter, config);
    expect(result).toEqual({ tags: ["art"], contentType: "video" });
  });

  it("falls back to dashboard filter when sidebar has empty config", () => {
    const config: SidebarWidgetConfig = { type: "sidebar", tags: [], contentType: null };
    const result = resolveFilter(dashboardFilter, config);
    expect(result).toBe(dashboardFilter);
  });

  it("falls back to dashboard filter for content widget config", () => {
    const config: ContentWidgetConfig = { type: "content", pinnedItemId: "item-1" };
    const result = resolveFilter(dashboardFilter, config);
    expect(result).toBe(dashboardFilter);
  });

  it("falls back to dashboard filter for map widget config", () => {
    const config: MapWidgetConfig = {
      type: "map",
      boundingBox: { north: 40, south: 30, east: 50, west: 20 },
      zoomLevel: 5,
    };
    const result = resolveFilter(dashboardFilter, config);
    expect(result).toBe(dashboardFilter);
  });

  it("falls back to dashboard filter for timeline widget config", () => {
    const config: TimelineWidgetConfig = {
      type: "timeline",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    };
    const result = resolveFilter(dashboardFilter, config);
    expect(result).toBe(dashboardFilter);
  });

  it("returns empty dashboard filter when both are empty (show all)", () => {
    const emptyDashFilter: ContentFilter = {};
    const config: SidebarWidgetConfig = { type: "sidebar", tags: [], contentType: null };
    const result = resolveFilter(emptyDashFilter, config);
    expect(result).toBe(emptyDashFilter);
  });
});

// ── applyFilter ──

describe("applyFilter", () => {
  const sampleIndex: ContentIndex = {
    "entry-1": {
      id: "entry-1",
      type: "markdown",
      tags: ["history", "travel"],
      _path: "content/history/doc.md",
      _isHeader: false,
    },
    "entry-2": {
      id: "entry-2",
      type: "image",
      tags: ["travel"],
      _path: "content/photos/beach.jpg",
      _isHeader: false,
    },
    "entry-3": {
      id: "entry-3",
      type: "markdown",
      tags: ["art"],
      _path: "content/art/painting.md",
      _isHeader: false,
    },
    "entry-4": {
      id: "entry-4",
      type: "video",
      tags: [],
      _path: "content/videos/clip.mp4",
      _isHeader: false,
    },
  };

  it("returns all entries when filter is empty", () => {
    const result = applyFilter(sampleIndex, {});
    expect(Object.keys(result)).toHaveLength(4);
  });

  it("filters by contentType", () => {
    const result = applyFilter(sampleIndex, { contentType: "markdown" });
    expect(Object.keys(result)).toEqual(["entry-1", "entry-3"]);
  });

  it("filters by tags (AND logic)", () => {
    const result = applyFilter(sampleIndex, { tags: ["history", "travel"] });
    expect(Object.keys(result)).toEqual(["entry-1"]);
  });

  it("filters by single tag", () => {
    const result = applyFilter(sampleIndex, { tags: ["travel"] });
    expect(Object.keys(result)).toEqual(["entry-1", "entry-2"]);
  });

  it("filters by sourceDirectory", () => {
    const result = applyFilter(sampleIndex, { sourceDirectory: "content/art" });
    expect(Object.keys(result)).toEqual(["entry-3"]);
  });

  it("combines all filter criteria", () => {
    const result = applyFilter(sampleIndex, {
      contentType: "markdown",
      tags: ["history"],
      sourceDirectory: "content/history",
    });
    expect(Object.keys(result)).toEqual(["entry-1"]);
  });

  it("returns empty index when no entries match", () => {
    const result = applyFilter(sampleIndex, { contentType: "audio" });
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("handles entries with no tags gracefully", () => {
    const result = applyFilter(sampleIndex, { tags: ["travel"] });
    expect(result["entry-4"]).toBeUndefined();
  });

  it("handles entries with undefined tags", () => {
    const indexWithUndefinedTags: ContentIndex = {
      "no-tags": {
        id: "no-tags",
        type: "markdown",
        _path: "content/doc.md",
        _isHeader: false,
      },
    };
    const result = applyFilter(indexWithUndefinedTags, { tags: ["any"] });
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("treats null contentType as no filter", () => {
    const result = applyFilter(sampleIndex, { contentType: null });
    expect(Object.keys(result)).toHaveLength(4);
  });

  it("treats null sourceDirectory as no filter", () => {
    const result = applyFilter(sampleIndex, { sourceDirectory: null });
    expect(Object.keys(result)).toHaveLength(4);
  });

  it("treats empty tags array as no filter", () => {
    const result = applyFilter(sampleIndex, { tags: [] });
    expect(Object.keys(result)).toHaveLength(4);
  });
});
