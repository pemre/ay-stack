import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ContentIndex } from "../../shared/types.ts";

/**
 * SPEC: MapPanel component
 * -----------------------
 * 1. Location info is shown when coordinates are available
 * 2. Map still renders without location info (fallback)
 * 3. MapContainer is rendered
 *
 * NOTE: react-leaflet does not fully render in jsdom;
 * we test basic DOM presence and prop passing.
 */

// react-leaflet mock
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
  useMap: () => ({ flyTo: vi.fn() }),
}));

import MapPanel from "./MapPanel";

const mockIndex: ContentIndex = {
  shang: {
    id: "shang",
    title: "Shang Dynasty",
    location: { lat: 36.1, lng: 114.3, label: "Yinxu (Anyang)" },
    _path: "",
    _isHeader: false,
  },
};

describe("MapPanel", () => {
  it("map container renders", () => {
    render(<MapPanel selectedId={null} index={{}} />);
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
  });

  it("shows coordinates when location info is available", () => {
    render(<MapPanel selectedId="shang" index={mockIndex} />);
    expect(screen.getByText(/36.10/)).toBeInTheDocument();
    expect(screen.getAllByText(/Yinxu/).length).toBeGreaterThanOrEqual(1);
  });

  it("does not render map-info when no location", () => {
    render(<MapPanel selectedId={null} index={{}} />);
    expect(screen.queryByText(/°N/)).not.toBeInTheDocument();
  });
});
