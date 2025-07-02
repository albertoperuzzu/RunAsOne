import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import polyline from "@mapbox/polyline";
import type { LatLngBoundsExpression } from "leaflet";

type Props = {
  encodedPolyline: string;
};

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  if (positions.length > 0) {
    const bounds: LatLngBoundsExpression = positions as LatLngBoundsExpression;
    map.fitBounds(bounds, { padding: [10, 10] });
  }
  return null;
}

export default function MapPreview({ encodedPolyline }: Props) {
  const positions = polyline.decode(encodedPolyline).map(([lat, lng]) => [lat, lng]);
  const center = positions[Math.floor(positions.length / 2)] || [0, 0];

  return (
    <MapContainer
      center={center as [number, number]}
      zoom={12}
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
      doubleClickZoom={false}
      touchZoom={false}
      keyboard={false}
      style={{
        height: "200px",
        width: "100%",
        borderRadius: "12px",
        filter: "brightness(0.8)",
        pointerEvents: "none"
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={positions as [number, number][]} color="blue" weight={4} />
      <FitBounds positions={positions as [number, number][]} />
    </MapContainer>
  );
}