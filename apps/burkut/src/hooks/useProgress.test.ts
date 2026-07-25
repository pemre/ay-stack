import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { ContentIndex } from "../shared/types.ts";
import { getAllContentIds, useProgress } from "./useProgress";

/**
 * SPEC: useProgress hook
 * ----------------------
 * 1. Returns 0% when nothing is completed
 * 2. toggleComplete marks/unmarks items
 * 3. Percentage is calculated correctly
 * 4. State persists to localStorage
 * 5. State restores from localStorage on mount
 * 6. Detects new content (ids not in stored knownIds)
 * 7. acknowledgeNewContent clears newContentIds and updates knownIds
 * 8. Prunes completedIds for items removed from the index
 * 9. First launch: all ids become known, no newContentIds
 */

const mockIndex: ContentIndex = {
  xia: { id: "xia", group: "Dynasties and States", title: "Xia", _path: "", _isHeader: false },
  shang: {
    id: "shang",
    group: "Dynasties and States",
    title: "Shang",
    _path: "",
    _isHeader: false,
  },
  Cinema: { id: "Cinema", group: "Cinema", title: "Cinema", _path: "", _isHeader: true },
};

beforeEach(() => {
  localStorage.clear();
});

describe("getAllContentIds", () => {
  it("returns all keys from the index", () => {
    expect(getAllContentIds(mockIndex)).toEqual(["xia", "shang", "Cinema"]);
  });

  it("returns empty array for empty index", () => {
    expect(getAllContentIds({})).toEqual([]);
  });
});

describe("useProgress", () => {
  it("returns 0% when nothing is completed", () => {
    const { result } = renderHook(() => useProgress(mockIndex));
    expect(result.current.percentage).toBe(0);
    expect(result.current.completedCount).toBe(0);
    expect(result.current.totalCount).toBe(3);
  });

  it("toggleComplete marks an item as completed", () => {
    const { result } = renderHook(() => useProgress(mockIndex));
    act(() => result.current.toggleComplete("xia"));
    expect(result.current.isComplete("xia")).toBe(true);
    expect(result.current.completedCount).toBe(1);
    expect(result.current.percentage).toBe(33);
  });

  it("toggleComplete unmarks a completed item", () => {
    const { result } = renderHook(() => useProgress(mockIndex));
    act(() => result.current.toggleComplete("xia"));
    expect(result.current.isComplete("xia")).toBe(true);
    act(() => result.current.toggleComplete("xia"));
    expect(result.current.isComplete("xia")).toBe(false);
    expect(result.current.completedCount).toBe(0);
  });

  it("calculates 100% when all items are completed", () => {
    const { result } = renderHook(() => useProgress(mockIndex));
    act(() => {
      result.current.toggleComplete("xia");
      result.current.toggleComplete("shang");
      result.current.toggleComplete("Cinema");
    });
    expect(result.current.percentage).toBe(100);
    expect(result.current.completedCount).toBe(3);
  });

  it("persists completedIds to localStorage", () => {
    const { result } = renderHook(() => useProgress(mockIndex));
    act(() => result.current.toggleComplete("xia"));

    const stored = JSON.parse(localStorage.getItem("readingProgress") ?? "{}");
    expect(stored.completedIds).toContain("xia");
    expect(stored.version).toBe(1);
  });

  it("restores completedIds from localStorage", () => {
    localStorage.setItem(
      "readingProgress",
      JSON.stringify({
        version: 1,
        completedIds: ["shang"],
        knownIds: ["xia", "shang", "Cinema"],
      }),
    );

    const { result } = renderHook(() => useProgress(mockIndex));
    expect(result.current.isComplete("shang")).toBe(true);
    expect(result.current.completedCount).toBe(1);
  });

  it("detects new content when index has ids not in stored knownIds", () => {
    localStorage.setItem(
      "readingProgress",
      JSON.stringify({
        version: 1,
        completedIds: ["xia"],
        knownIds: ["xia", "shang"],
      }),
    );

    const expandedIndex: ContentIndex = {
      ...mockIndex,
      newItem: { id: "newItem", group: "Cinema", title: "New Movie", _path: "", _isHeader: false },
    };

    const { result } = renderHook(() => useProgress(expandedIndex));
    expect(result.current.newContentIds).toContain("newItem");
    expect(result.current.newContentIds).toContain("Cinema");
  });

  it("acknowledgeNewContent clears newContentIds and updates knownIds", () => {
    localStorage.setItem(
      "readingProgress",
      JSON.stringify({
        version: 1,
        completedIds: [],
        knownIds: ["xia"],
      }),
    );

    const { result } = renderHook(() => useProgress(mockIndex));
    expect(result.current.newContentIds.length).toBeGreaterThan(0);

    act(() => result.current.acknowledgeNewContent());
    expect(result.current.newContentIds).toEqual([]);

    const stored = JSON.parse(localStorage.getItem("readingProgress") ?? "{}");
    expect(stored.knownIds).toContain("xia");
    expect(stored.knownIds).toContain("shang");
    expect(stored.knownIds).toContain("Cinema");
  });

  it("prunes completedIds for items removed from the index", () => {
    localStorage.setItem(
      "readingProgress",
      JSON.stringify({
        version: 1,
        completedIds: ["xia", "removedItem"],
        knownIds: ["xia", "shang", "Cinema", "removedItem"],
      }),
    );

    const { result } = renderHook(() => useProgress(mockIndex));
    expect(result.current.isComplete("xia")).toBe(true);
    expect(result.current.completedSet.has("removedItem")).toBe(false);
  });

  it("first launch: all ids become known, no newContentIds", () => {
    const { result } = renderHook(() => useProgress(mockIndex));
    expect(result.current.newContentIds).toEqual([]);
  });

  it("returns 0% for empty index", () => {
    const { result } = renderHook(() => useProgress({}));
    expect(result.current.percentage).toBe(0);
    expect(result.current.totalCount).toBe(0);
  });

  it("ignores invalid localStorage data (wrong version)", () => {
    localStorage.setItem(
      "readingProgress",
      JSON.stringify({ version: 999, completedIds: ["xia"], knownIds: ["xia"] }),
    );

    const { result } = renderHook(() => useProgress(mockIndex));
    expect(result.current.isComplete("xia")).toBe(false);
  });
});
