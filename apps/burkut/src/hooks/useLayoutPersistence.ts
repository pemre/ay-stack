import { useEffect, useState } from "react";
import type { Layout, LayoutItem, ResponsiveLayouts } from "react-grid-layout";
import { DEFAULT_LAYOUTS } from "../components/WidgetGrid/defaultLayouts";
import { WIDGET_IDS, WIDGET_REGISTRY } from "../components/WidgetGrid/widgetRegistry";

const LAYOUTS_KEY = "burkut-widget-layouts";
const VISIBILITY_KEY = "burkut-widget-visibility";

type VisibilityState = Record<string, boolean>;

interface UseLayoutPersistenceReturn {
  layouts: ResponsiveLayouts;
  visibilityState: VisibilityState;
  onLayoutChange: (currentLayout: Layout, allLayouts: ResponsiveLayouts) => void;
  setWidgetVisible: (widgetId: string, visible: boolean) => void;
  resetLayout: () => void;
}

const KNOWN_WIDGET_IDS = new Set<string>(Object.values(WIDGET_IDS));

function isValidLayoutItem(item: unknown): item is LayoutItem {
  if (!item || typeof item !== "object") return false;
  const obj = item as Record<string, unknown>;
  if (typeof obj.i !== "string") return false;
  if (!KNOWN_WIDGET_IDS.has(obj.i)) return false;
  if (typeof obj.x !== "number") return false;
  if (typeof obj.y !== "number") return false;
  if (typeof obj.w !== "number" || obj.w < 2) return false;
  if (typeof obj.h !== "number" || obj.h < 2) return false;
  return true;
}

function isValidLayouts(value: unknown): value is ResponsiveLayouts {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj.lg)) return false;
  for (const key of Object.keys(obj)) {
    const arr = obj[key];
    if (!Array.isArray(arr)) return false;
    for (const item of arr) {
      if (!isValidLayoutItem(item)) return false;
    }
  }
  return true;
}

function isValidVisibilityState(value: unknown): value is VisibilityState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (typeof key !== "string") return false;
    if (typeof obj[key] !== "boolean") return false;
  }
  return true;
}

function loadLayouts(): ResponsiveLayouts {
  try {
    const raw = localStorage.getItem(LAYOUTS_KEY);
    if (!raw) return DEFAULT_LAYOUTS;
    const parsed: unknown = JSON.parse(raw);
    if (isValidLayouts(parsed)) return parsed;
    return DEFAULT_LAYOUTS;
  } catch {
    return DEFAULT_LAYOUTS;
  }
}

function loadVisibility(): VisibilityState {
  const defaultVisibility: VisibilityState = Object.fromEntries(
    WIDGET_REGISTRY.map((w) => [w.id, true]),
  );
  try {
    const raw = localStorage.getItem(VISIBILITY_KEY);
    if (!raw) return defaultVisibility;
    const parsed: unknown = JSON.parse(raw);
    if (isValidVisibilityState(parsed)) return parsed;
    return defaultVisibility;
  } catch {
    return defaultVisibility;
  }
}

const LEGACY_KEYS = ["layout-root", "layout-main", "layout-top"];

export function useLayoutPersistence(): UseLayoutPersistenceReturn {
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(loadLayouts);
  const [visibilityState, setVisibilityState] = useState<VisibilityState>(loadVisibility);

  // One-time cleanup of legacy react-resizable-panels localStorage keys
  useEffect(() => {
    for (const key of LEGACY_KEYS) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Silently ignore private browsing / quota errors
      }
    }
  }, []);

  const onLayoutChange = (_currentLayout: Layout, allLayouts: ResponsiveLayouts): void => {
    setLayouts(allLayouts);
    try {
      localStorage.setItem(LAYOUTS_KEY, JSON.stringify(allLayouts));
    } catch {
      // Silently ignore quota/private browsing errors
    }
  };

  const setWidgetVisible = (widgetId: string, visible: boolean): void => {
    setVisibilityState((prev) => {
      const next = { ...prev, [widgetId]: visible };
      try {
        localStorage.setItem(VISIBILITY_KEY, JSON.stringify(next));
      } catch {
        // Silently ignore quota/private browsing errors
      }
      return next;
    });
  };

  const resetLayout = (): void => {
    try {
      localStorage.removeItem(LAYOUTS_KEY);
    } catch {
      // Silently ignore errors
    }
    try {
      localStorage.removeItem(VISIBILITY_KEY);
    } catch {
      // Silently ignore errors
    }
    setLayouts(DEFAULT_LAYOUTS);
    setVisibilityState(Object.fromEntries(WIDGET_REGISTRY.map((w) => [w.id, true])));
  };

  return { layouts, visibilityState, onLayoutChange, setWidgetVisible, resetLayout };
}
