import { useCallback, useEffect, useMemo, useState } from "react";
import type { ContentIndex } from "../shared/types.ts";

const STORAGE_KEY = "readingProgress";
const SCHEMA_VERSION = 1;

interface ProgressData {
  version: number;
  completedIds: string[];
  knownIds: string[];
}

/**
 * Default shape for persisted progress data.
 */
function defaultData(): ProgressData {
  return { version: SCHEMA_VERSION, completedIds: [], knownIds: [] };
}

/**
 * Read progress data from localStorage (with version guard).
 */
function loadFromStorage(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw) as ProgressData;
    if (parsed.version !== SCHEMA_VERSION) return defaultData();
    return parsed;
  } catch {
    return defaultData();
  }
}

/**
 * Persist progress data to localStorage.
 */
function saveToStorage(data: ProgressData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota exceeded or private browsing — silently ignore */
  }
}

/**
 * Derive all trackable content IDs from the md-loader index.
 * Includes both header pages and sub-content items.
 */
export function getAllContentIds(index: ContentIndex): string[] {
  return Object.keys(index);
}

export interface UseProgressReturn {
  toggleComplete: (id: string) => void;
  isComplete: (id: string) => boolean;
  completedCount: number;
  totalCount: number;
  percentage: number;
  newContentIds: string[];
  acknowledgeNewContent: () => void;
  completedSet: Set<string>;
}

/**
 * useProgress — reading progress tracker hook.
 *
 * Tracks which content items have been marked "read" by the user.
 * Persists to localStorage. Detects newly added content (ids present in
 * the current index but absent from the stored knownIds) and exposes them
 * so the UI can display a "new content" modal.
 */
export function useProgress(index: ContentIndex): UseProgressReturn {
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    const stored = loadFromStorage();
    return new Set(stored.completedIds);
  });

  const [knownIds, setKnownIds] = useState<Set<string>>(() => {
    const stored = loadFromStorage();
    return new Set(stored.knownIds);
  });

  const [newContentIds, setNewContentIds] = useState<string[]>([]);

  // All content IDs derived from the current index
  const allIds = useMemo(() => getAllContentIds(index), [index]);

  // Detect new content & prune stale completed IDs whenever index changes
  useEffect(() => {
    if (allIds.length === 0) return; // index not loaded yet

    const currentSet = new Set(allIds);

    // Prune completedIds that no longer exist in index
    setCompletedIds((prev) => {
      const pruned = new Set([...prev].filter((id) => currentSet.has(id)));
      if (pruned.size !== prev.size) return pruned;
      return prev;
    });

    // Detect new content (ids not in stored knownIds)
    setKnownIds((prevKnown) => {
      if (prevKnown.size === 0) {
        // First launch — everything is "known", no modal
        setNewContentIds([]);
        return currentSet;
      }
      const newIds = allIds.filter((id) => !prevKnown.has(id));
      setNewContentIds(newIds);
      return prevKnown; // Don't update knownIds yet — wait for acknowledge
    });
  }, [allIds]);

  // Persist to localStorage whenever completedIds or knownIds change
  useEffect(() => {
    saveToStorage({
      version: SCHEMA_VERSION,
      completedIds: [...completedIds],
      knownIds: [...knownIds],
    });
  }, [completedIds, knownIds]);

  const toggleComplete = useCallback((id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isComplete = useCallback((id: string) => completedIds.has(id), [completedIds]);

  const totalCount = allIds.length;
  const completedCount = useMemo(
    () => allIds.filter((id) => completedIds.has(id)).length,
    [allIds, completedIds],
  );
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const acknowledgeNewContent = useCallback(() => {
    setKnownIds(new Set(allIds));
    setNewContentIds([]);
  }, [allIds]);

  return {
    toggleComplete,
    isComplete,
    completedCount,
    totalCount,
    percentage,
    newContentIds,
    acknowledgeNewContent,
    completedSet: completedIds,
  };
}
