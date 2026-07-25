import type { ContentFilter, ContentIndex, WidgetConfig } from "../shared/types.ts";

/**
 * Determines the effective content filter for a widget instance.
 *
 * If the instance config has non-empty filter criteria (sidebar: non-empty tags
 * or non-null contentType), returns the instance-level filter derived from the config.
 * Otherwise, returns the dashboard-level filter.
 *
 * Only sidebar configs carry content-filter fields; other widget types always
 * fall back to the dashboard-level filter.
 */
export function resolveFilter(
  dashboardFilter: ContentFilter,
  instanceConfig: WidgetConfig,
): ContentFilter {
  if (instanceConfig.type === "sidebar") {
    const hasTags = instanceConfig.tags.length > 0;
    const hasContentType = instanceConfig.contentType != null;

    if (hasTags || hasContentType) {
      return {
        tags: instanceConfig.tags,
        contentType: instanceConfig.contentType,
      };
    }
  }

  return dashboardFilter;
}

/**
 * Filters a ContentIndex by the given ContentFilter criteria.
 *
 * - contentType: if set, only include entries whose `type` matches.
 * - tags: if non-empty, only include entries that have ALL specified tags.
 * - sourceDirectory: if set, only include entries whose `_path` starts with the directory.
 *
 * Empty/undefined filter criteria means no filtering on that dimension.
 * Returns a new ContentIndex with only matching entries.
 */
export function applyFilter(index: ContentIndex, filter: ContentFilter): ContentIndex {
  // Fast path: empty filter means no filtering — return the original index
  const hasContentType = filter.contentType != null;
  const hasTags = filter.tags != null && filter.tags.length > 0;
  const hasSourceDir = filter.sourceDirectory != null;
  if (!hasContentType && !hasTags && !hasSourceDir) {
    return index;
  }

  const result: ContentIndex = {};

  for (const [id, entry] of Object.entries(index)) {
    if (filter.contentType != null && entry.type !== filter.contentType) {
      continue;
    }

    if (filter.tags && filter.tags.length > 0) {
      const entryTags = entry.tags ?? [];
      const hasAllTags = filter.tags.every((tag) => entryTags.includes(tag));
      if (!hasAllTags) {
        continue;
      }
    }

    if (filter.sourceDirectory != null && !entry._path.startsWith(filter.sourceDirectory)) {
      continue;
    }

    result[id] = entry;
  }

  return result;
}
