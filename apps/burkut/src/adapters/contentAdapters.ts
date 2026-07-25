/**
 * Adapters mapping Bürküt's domain model (`ContentIndex`/`ContentEntry`) to the
 * view-model types widgets actually render (`viewModels.ts`).
 *
 * This is where Bürküt-specific domain knowledge accumulates -- the BCE-date
 * parser, `sidebarSort`, group derivation, and the `getContent` data access
 * call all live here so the widgets themselves stay props-driven and reusable.
 */

import type { ContentEntry, ContentIndex } from "../shared/types.ts";
import type { ContentViewModel, GeoFeature, TimelineItem, TreeNode } from "./viewModels.ts";

// ── Sidebar: ContentIndex -> TreeNode[] ──────────────────────────────────────

/**
 * Parse a front-matter `start` string (e.g. "-002070-01-01", "0581-01-01")
 * into a comparable numeric value. Handles negative (BCE) years correctly.
 * Returns NaN for missing/invalid values so they sort to the end.
 */
function parseStartValue(start?: string): number {
  if (!start) return NaN;
  const match = start.match(/^(-?\d+)-(\d{2})-(\d{2})$/);
  if (!match) return NaN;
  return parseInt(match[1], 10);
}

function getGroupHeader(index: ContentIndex, groupId: string): ContentEntry | undefined {
  return Object.values(index).find((item) => item.group === groupId && item._isHeader);
}

function itemsInGroup(index: ContentIndex, groupId: string): ContentEntry[] {
  const header = getGroupHeader(index, groupId);
  const sortMode = header?.sidebarSort;

  const items = Object.values(index).filter((item) => item.group === groupId && !item._isHeader);

  if (sortMode === "start") {
    items.sort((a, b) => {
      const aVal = parseStartValue(a.start);
      const bVal = parseStartValue(b.start);
      if (Number.isNaN(aVal) && Number.isNaN(bVal)) return 0;
      if (Number.isNaN(aVal)) return 1;
      if (Number.isNaN(bVal)) return -1;
      if (aVal !== bVal) return aVal - bVal;
      const aBg = a.type === "background" ? 0 : 1;
      const bBg = b.type === "background" ? 0 : 1;
      return aBg - bBg;
    });
  } else {
    items.sort((a, b) => (a.title || a.id).localeCompare(b.title || b.id));
  }

  return items;
}

/** Builds the sidebar's group/item tree from a ContentIndex. */
export function buildSidebarTree(index: ContentIndex, completedSet?: Set<string>): TreeNode[] {
  const seen = new Set<string>();
  for (const item of Object.values(index)) {
    if (item.group) seen.add(item.group);
  }
  const groups = [...seen].sort((a, b) => a.localeCompare(b));

  return groups.map((groupId) => ({
    id: groupId,
    label: groupId,
    completed: completedSet?.has(groupId),
    children: itemsInGroup(index, groupId).map((item) => ({
      id: item.id,
      label: item.title || item.id,
      tooltip: item.subtitle,
      isSubheading: item.type === "background",
      completed: completedSet?.has(item.id),
    })),
  }));
}

// ── Timeline: ContentIndex -> TimelineItem[] ─────────────────────────────────

/** Builds vis-timeline items from a ContentIndex. */
export function buildTimelineItems(index: ContentIndex): TimelineItem[] {
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

// ── Map: ContentIndex -> GeoFeature[] ────────────────────────────────────────

/** Builds map features (markers + polygons) from every located entry in a ContentIndex. */
export function buildGeoFeatures(index: ContentIndex): GeoFeature[] {
  return Object.values(index)
    .filter((m: ContentEntry) => m.location != null)
    .map((m: ContentEntry) => ({
      id: m.id,
      label: m.location?.label,
      title: m.title,
      lat: (m.location as NonNullable<ContentEntry["location"]>).lat,
      lng: (m.location as NonNullable<ContentEntry["location"]>).lng,
      polygon: m.polygon as [number, number][] | undefined,
    }));
}

// ── Content: ContentIndex + getContent -> ContentViewModel ───────────────────

/**
 * Resolves the effective content id: the selected item, falling back to the
 * active group's header page when nothing is selected.
 */
export function resolveContentId(selectedId: string | null, activeGroup: string): string {
  return selectedId || activeGroup;
}

/**
 * Builds the content panel's view model. `markdown` is `null` when
 * `getContent` has no body for the resolved id -- the widget is responsible
 * for rendering its own "not found" label in that case.
 *
 * Meta fields (title/subtitle/tags) are only populated from a real selection
 * (`selectedId`), matching the pre-adapter behavior where group-header
 * fallback content never showed a meta header.
 */
export function buildContentViewModel(
  index: ContentIndex,
  getContent: (id: string) => string | null,
  selectedId: string | null,
  activeGroup: string,
): ContentViewModel {
  const id = resolveContentId(selectedId, activeGroup);
  const meta = selectedId ? index[selectedId] : undefined;

  return {
    id,
    markdown: getContent(id),
    title: meta?.title,
    subtitle: meta?.subtitle,
    tags: meta?.tags,
  };
}
