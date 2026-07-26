import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GeoFeature } from "./types.ts";

vi.mock("react-leaflet", () => ({
  MapContainer: ({
    children,
    "aria-label": label,
  }: {
    children: React.ReactNode;
    "aria-label"?: string;
  }) => (
    <section data-testid="map-container" aria-label={label}>
      {children}
    </section>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
  Polygon: () => <div data-testid="polygon" />,
  useMap: () => ({ flyTo: vi.fn(), invalidateSize: vi.fn() }),
}));

import { GeoMap } from "./GeoMap.tsx";

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});

const mockFeatures: GeoFeature[] = [
  {
    id: "shang",
    label: "Yinxu (Anyang)",
    title: "Shang Dynasty",
    lat: 36.1,
    lng: 114.3,
  },
];

describe("GeoMap", () => {
  it("map container renders", () => {
    render(<GeoMap selectedId={null} features={[]} />);
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
  });

  it("shows coordinates when the selected feature has a location", () => {
    render(<GeoMap selectedId="shang" features={mockFeatures} />);
    expect(screen.getByText(/36.10/)).toBeInTheDocument();
    expect(screen.getAllByText(/Yinxu/).length).toBeGreaterThanOrEqual(1);
  });

  it("does not render map-info when no feature is selected", () => {
    render(<GeoMap selectedId={null} features={[]} />);
    expect(screen.queryByText(/°N/)).not.toBeInTheDocument();
  });
});
