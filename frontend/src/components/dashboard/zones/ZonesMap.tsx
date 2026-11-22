'use client';

import 'leaflet/dist/leaflet.css';

/** Carte des zones (DB5) : un contour par zone, couleur selon la catégorie (A piment, B vert, C gris, comme la maquette). */
import { MapContainer, Rectangle, TileLayer, Tooltip } from 'react-leaflet';

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const COLOR = { A: '#C2410C', B: '#15803D', C: '#78716C' };
const D = 0.006;

interface MapZone { id: string; name: string; center: { lat: number; lng: number }; category: 'A' | 'B' | 'C' }

export default function ZonesMap({ zones, center }: { zones: MapZone[]; center?: { lat: number; lng: number } }) {
  return (
    <MapContainer center={center ? [center.lat, center.lng] : [6.3654, 2.41]} zoom={13} className="h-full w-full" scrollWheelZoom={false}>
      <TileLayer url={TILE_URL} attribution="© contributeurs OpenStreetMap" />
      {zones.map((z) => (
        <Rectangle key={z.id} bounds={[[z.center.lat - D, z.center.lng - D], [z.center.lat + D, z.center.lng + D]]}
          pathOptions={{ color: COLOR[z.category], weight: 1.5, fillColor: COLOR[z.category], fillOpacity: 0.22 }}>
          <Tooltip permanent direction="center" className="okare-zone-label">{z.name} · {z.category}</Tooltip>
        </Rectangle>
      ))}
    </MapContainer>
  );
}
