import L from "leaflet";
import { type RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Polygon, Popup, TileLayer, useMap } from "react-leaflet";
import type { GeoMapConfig, GeoMapLabels, GeoMapProps } from "./types.ts";
import { DEFAULT_GEOMAP_LABELS } from "./types.ts";
import "leaflet/dist/leaflet.css";
import "./GeoMap.css";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';
const DEFAULT_CENTER: [number, number] = [35.86, 104.19];
const DEFAULT_ZOOM = 4;
const DEFAULT_TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const DEFAULT_ACCENT_COLOR = "#c9a84c";

interface MergedConfig {
  labels: Required<GeoMapLabels>;
  center: [number, number];
  zoom: number;
  tileUrl: string;
  accentColor: string;
}

function mergeConfig(user?: GeoMapConfig): MergedConfig {
  return {
    labels: { ...DEFAULT_GEOMAP_LABELS, ...user?.labels },
    center: user?.center ?? DEFAULT_CENTER,
    zoom: user?.zoom ?? DEFAULT_ZOOM,
    tileUrl: user?.tileUrl ?? DEFAULT_TILE_URL,
    accentColor: user?.accentColor ?? DEFAULT_ACCENT_COLOR,
  };
}

function FlyTo({
  position,
  fallbackCenter,
  fallbackZoom,
}: {
  position: { lat: number; lng: number } | null;
  fallbackCenter: [number, number];
  fallbackZoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(
      position ? [position.lat, position.lng] : fallbackCenter,
      position ? 6 : fallbackZoom,
      {
        duration: 1.2,
      },
    );
  }, [position, fallbackCenter, fallbackZoom, map]);
  return null;
}

function MapResizeWatcher({ containerRef }: { containerRef: RefObject<HTMLDivElement | null> }) {
  const map = useMap();
  const handleResize = useCallback(() => map.invalidateSize(), [map]);
  useEffect(() => {
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef, handleResize]);
  return null;
}

export default function GeoMapClient({ selectedId, features, config }: GeoMapProps) {
  const cfg = useMemo(() => mergeConfig(config), [config]);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = selectedId ? features.find((feature) => feature.id === selectedId) : undefined;
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
          📍 <strong>{selected.label}</strong>&nbsp;—&nbsp;{selected.lat.toFixed(2)}°N,{" "}
          {selected.lng.toFixed(2)}°E
        </div>
      )}
    </section>
  );
}
