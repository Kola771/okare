'use client';

/** Carte pour placer l'épingle sur l'entrée du point de vente (épingle déplaçable ou clic sur la carte). */
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const pin = L.divIcon({
  className: 'okare-marker',
  html: `<svg width="34" height="44" viewBox="0 0 34 44" style="transform:translate(-50%,-100%)" aria-hidden="true">
    <path d="M17 43s15-14.6 15-26A15 15 0 0 0 2 17c0 11.4 15 26 15 26z" fill="#C2410C" stroke="#fff" stroke-width="2"/>
    <circle cx="17" cy="17" r="6" fill="#fff"/></svg>`,
  iconSize: [0, 0], iconAnchor: [0, 0],
});

function Click({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Follow({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (map.getSize().x) map.panTo([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function PinPicker({ lat, lng, onPick }: { lat: number; lng: number; onPick: (lat: number, lng: number) => void }) {
  return (
    <MapContainer center={[lat, lng]} zoom={16} className="h-full w-full">
      <TileLayer url={TILE_URL} attribution="© contributeurs OpenStreetMap" />
      <Click onPick={onPick} />
      <Follow lat={lat} lng={lng} />
      <Marker position={[lat, lng]} icon={pin} draggable
        eventHandlers={{ dragend: (e) => { const p = (e.target as L.Marker).getLatLng(); onPick(p.lat, p.lng); } }} />
    </MapContainer>
  );
}
