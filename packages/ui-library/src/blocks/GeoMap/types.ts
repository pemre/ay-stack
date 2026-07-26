export interface GeoFeature {
  id: string;
  /** Explicit location label, if any (e.g. "Yinxu (Anyang)"). */
  label?: string;
  /** Fallback display title, used when label is absent. */
  title?: string;
  lat: number;
  lng: number;
  polygon?: [number, number][];
}

export interface GeoMapLabels {
  /** aria-label for the root section element (default: "Map panel"). */
  ariaLabel?: string;
  /** aria-label for the Leaflet map container (default: "Map"). */
  mapContainerAriaLabel?: string;
}

export const DEFAULT_GEOMAP_LABELS: Required<GeoMapLabels> = {
  ariaLabel: "Map panel",
  mapContainerAriaLabel: "Map",
};

export interface GeoMapConfig {
  labels?: GeoMapLabels;
  /** Map center when no feature is selected (default: [35.86, 104.19] -- China). */
  center?: [number, number];
  /** Zoom level when no feature is selected (default: 4). */
  zoom?: number;
  /** Tile layer URL template (default: light Carto Voyager tiles). */
  tileUrl?: string;
  /** Stroke/fill color for polygon overlays (default: "#c9a84c"). */
  accentColor?: string;
}

export interface GeoMapProps {
  selectedId: string | null;
  features: GeoFeature[];
  config?: GeoMapConfig;
}
