import { lazy, Suspense } from "react";
import type { GeoMapProps } from "./types.ts";

const GeoMapClient = lazy(() => import("./GeoMapClient.tsx"));

export function PublicGeoMap(props: GeoMapProps) {
  return (
    <Suspense
      fallback={<section className="map-panel" aria-label={props.config?.labels?.ariaLabel} />}
    >
      <GeoMapClient {...props} />
    </Suspense>
  );
}
