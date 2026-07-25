import L from "leaflet";
import { type RefObject, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, Marker, Polygon, Popup, TileLayer, useMap } from "react-leaflet";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import { useTheme } from "../../hooks/useTheme";
import type { ContentIndex } from "../../shared/types.ts";
import "./MapPanel.css";

// Leaflet default icon fix (Vite asset pipeline compatibility)
// biome-ignore lint/suspicious/noExplicitAny: Leaflet internal API requires prototype mutation
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CHINA_CENTER: [number, number] = [35.86, 104.19];
const CHINA_ZOOM = 4;

// OpenStreetMaps are using local language for China, I preferred English.
// It can be a feature in the future to select the style...
const TILE_LIGHT = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

const ACCENT_COLOR = "#c9a84c";

interface FlyToProps {
  position: { lat: number; lng: number } | null;
}

/** Fly the map to the selected item's position */
function FlyTo({ position }: FlyToProps) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 6, { duration: 1.2 });
    } else {
      map.flyTo(CHINA_CENTER, CHINA_ZOOM, { duration: 1.2 });
    }
  }, [position, map]);
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
  index: ContentIndex;
}

export default function MapPanel({ selectedId, index }: MapPanelProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const meta = selectedId ? index[selectedId] : null;
  const location = meta?.location || null;
  const polygon = (meta?.polygon as [number, number][] | undefined) || null;

  const tileUrl = theme === "dark" ? TILE_DARK : TILE_LIGHT;

  return (
    <section className="map-panel" ref={containerRef} aria-label={t("aria.map")}>
      <MapContainer
        center={CHINA_CENTER}
        zoom={CHINA_ZOOM}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
        aria-label={t("aria.mapContainer")}
      >
        <TileLayer key={theme} attribution={TILE_ATTR} url={tileUrl} />

        <FlyTo position={location} />
        <MapResizeWatcher containerRef={containerRef} />

        {location && (
          <Marker position={[location.lat, location.lng]}>
            <Popup>{location.label || meta?.title}</Popup>
          </Marker>
        )}

        {polygon && (
          <Polygon positions={polygon} pathOptions={{ color: ACCENT_COLOR, fillOpacity: 0.1 }} />
        )}
      </MapContainer>

      {location && (
        <div className="map-info">
          📍 <strong>{location.label}</strong>
          &nbsp;—&nbsp;{location.lat.toFixed(2)}°N, {location.lng.toFixed(2)}°E
        </div>
      )}
    </section>
  );
}
