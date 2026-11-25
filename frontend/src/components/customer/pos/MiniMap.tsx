'use client';

/**
 * Mini-carte du point de vente (repère). Particulier sans lieu public : cercle approximatif, jamais l'adresse.
 */
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Circle, MapContainer, Marker, TileLayer } from 'react-leaflet';

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const pin = L.divIcon({
  className: 'okare-marker',
  html: `<svg width="34" height="44" viewBox="0 0 34 44" style="transform:translate(-50%,-100%)" aria-hidden="true">
    <path d="M17 43s15-14.6 15-26A15 15 0 0 0 2 17c0 11.4 15 26 15 26z" fill="#C2410C" stroke="#fff" stroke-width="2"/>
    <circle cx="17" cy="17" r="6" fill="#fff"/></svg>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

export default function MiniMap({ lat, lng, approximate }: { lat: number; lng: number; approximate: boolean }) {
  return (
    <MapContainer center={[lat, lng]} zoom={approximate ? 15 : 16} className="h-full w-full" zoomControl={false}
      dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} keyboard={false} attributionControl>
      <TileLayer url={TILE_URL} attribution="© contributeurs OpenStreetMap" crossOrigin="" />
      {approximate
        ? <Circle center={[lat, lng]} radius={350} pathOptions={{ color: '#C2410C', weight: 2, fillOpacity: 0.12 }} />
        : <Marker position={[lat, lng]} icon={pin} interactive={false} />}
    </MapContainer>
  );
}
