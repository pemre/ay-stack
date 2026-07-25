import L from "leaflet";
import { type RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Polygon, Popup, TileLayer, useMap } from "react-leaflet";
import type { GeoFeature } from "../../adapters/viewModels.ts";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import "./MapPanel.css";

// Leaflet default icon fix (Vite asset pipeline compatibility)
// biome-ignore lint/suspicious/noExplicitAny: Leaflet internal API requires prototype mutation
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

// ── Labels ────────────────────────────────────────────────────────────────

export interface MapPanelLabels {
  /** aria-label for the root section element (default: "Map panel"). */
  ariaLabel?: string;
  /** aria-label for the Leaflet map container (default: "Map"). */
  mapContainerAriaLabel?: string;
}

export const DEFAULT_MAP_PANEL_LABELS: Required<MapPanelLabels> = {
  ariaLabel: "Map panel",
  mapContainerAriaLabel: "Map",
};

// ── Config ────────────────────────────────────────────────────────────────

export interface MapPanelConfig {
  labels?: MapPanelLabels;
  /** Map center when no feature is selected (default: [35.86, 104.19] -- China). */
  center?: [number, number];
  /** Zoom level when no feature is selected (default: 4). */
  zoom?: number;
  /** Tile layer URL template (default: light Carto Voyager tiles). */
  tileUrl?: string;
  /** Stroke/fill color for polygon overlays (default: "#c9a84c"). */
  accentColor?: string;
}

const DEFAULT_CENTER: [number, number] = [35.86, 104.19];
const DEFAULT_ZOOM = 4;
const DEFAULT_TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const DEFAULT_ACCENT_COLOR = "#c9a84c";

interface MergedConfig {
  labels: Required<MapPanelLabels>;
  center: [number, number];
  zoom: number;
  tileUrl: string;
  accentColor: string;
}

function mergeConfig(user?: MapPanelConfig): MergedConfig {
  return {
    labels: { ...DEFAULT_MAP_PANEL_LABELS, ...user?.labels },
    center: user?.center ?? DEFAULT_CENTER,
    zoom: user?.zoom ?? DEFAULT_ZOOM,
    tileUrl: user?.tileUrl ?? DEFAULT_TILE_URL,
    accentColor: user?.accentColor ?? DEFAULT_ACCENT_COLOR,
  };
}

// ── Component ─────────────────────────────────────────────────────────────

interface FlyToProps {
  position: { lat: number; lng: number } | null;
  fallbackCenter: [number, number];
  fallbackZoom: number;
}

/** Fly the map to the selected feature's position, or back to the fallback view. */
function FlyTo({ position, fallbackCenter, fallbackZoom }: FlyToProps) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 6, { duration: 1.2 });
    } else {
      map.flyTo(fallbackCenter, fallbackZoom, { duration: 1.2 });
    }
  }, [position, fallbackCenter, fallbackZoom, map]);
  return null;
}

/** Watches the map container for size changes and calls invalidateSize */
function MapResizeWatcher({ containerRef }: { containerRef: RefObject<HTMLDivElement | null> }) {
  const map = useMap();
  const handleResize = useCallback(() => {
    map.invalidateSize();
  }, [map]);
  useResizeObserver(containerRef, handleResize);
  return null;
}

interface MapPanelProps {
  selectedId: string | null;
  features: GeoFeature[];
  config?: MapPanelConfig;
}

export default function MapPanel({ selectedId, features, config }: MapPanelProps) {
  const cfg = useMemo(() => mergeConfig(config), [config]);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = selectedId ? features.find((f) => f.id === selectedId) : undefined;
  const location = selected ? { lat: selected.lat, lng: selected.lng } : null;
  const polygon = selected?.polygon ?? null;

  return (
    <section className="map-panel" ref={containerRef} aria-label={cfg.labels.ariaLabel}>
      <MapContainer
        center={cfg.center}
        zoom={cfg.zoom}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
        aria-label={cfg.labels.mapContainerAriaLabel}
      >
        <TileLayer key={cfg.tileUrl} attribution={TILE_ATTR} url={cfg.tileUrl} />

        <FlyTo position={location} fallbackCenter={cfg.center} fallbackZoom={cfg.zoom} />
        <MapResizeWatcher containerRef={containerRef} />

        {selected && (
          <Marker position={[selected.lat, selected.lng]}>
            <Popup>{selected.label || selected.title}</Popup>
          </Marker>
        )}

        {polygon && (
          <Polygon positions={polygon} pathOptions={{ color: cfg.accentColor, fillOpacity: 0.1 }} />
        )}
      </MapContainer>

      {selected && (
        <div className="map-info">
          📍 <strong>{selected.label}</strong>
          &nbsp;—&nbsp;{selected.lat.toFixed(2)}°N, {selected.lng.toFixed(2)}°E
        </div>
      )}
    </section>
  );
}
