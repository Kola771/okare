'use client';

/**
 * Carte Leaflet + tuiles OpenStreetMap (8.3). Chargée sans rendu serveur (voir LazyMap).
 * Même résultat et même ordre que la liste : on lui passe les marqueurs calculés par l'API.
 */
import 'leaflet/dist/leaflet.css';
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import { useEffect, useMemo } from 'react';
import type { MapMarker } from '@/lib/api';
import { clusterIcon, markerIcon, viewerIcon } from './markerIcon';

export interface MapViewProps {
  markers: MapMarker[];
  selectedId: string | null;
  onSelect: (posId: string | null) => void;
  center: { lat: number; lng: number };
  viewer?: { lat: number; lng: number; accuracy: number } | null;
  onMoved?: (bbox: [number, number, number, number]) => void;
  /** Recentrage demandé (bouton « Me localiser »). */
  focus?: { lat: number; lng: number; n: number } | null;
  /** Boutons + / − (desktop seulement : sur téléphone on pince pour zoomer). */
  showZoom?: boolean;
}

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

function Events({ onSelect, onMoved }: Pick<MapViewProps, 'onSelect' | 'onMoved'>) {
  useMapEvents({
    click: () => onSelect(null),
    moveend: (e) => {
      const b = e.target.getBounds();
      onMoved?.([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    },
  });
  return null;
}

function Focus({ focus }: { focus: MapViewProps['focus'] }) {
  const map = useMap();
  useEffect(() => {
    if (!focus || !Number.isFinite(focus.lat) || !Number.isFinite(focus.lng)) return;
    // Conteneur pas encore mesuré : pas d'animation (sinon Leaflet calcule des coordonnées NaN).
    if (map.getSize().x === 0) map.setView([focus.lat, focus.lng], 15);
    else map.flyTo([focus.lat, focus.lng], 15, { duration: 0.6 });
  }, [focus, map]);
  return null;
}

/** Regroupe les marqueurs proches quand il y en a plus de 30 (grille simple, à zoom constant). */
function cluster(markers: MapMarker[]) {
  if (markers.length <= 30) return { single: markers, groups: [] as { lat: number; lng: number; count: number }[] };
  const cells = new Map<string, MapMarker[]>();
  for (const m of markers) {
    const key = `${Math.round(m.lat * 200)}:${Math.round(m.lng * 200)}`;
    cells.set(key, [...(cells.get(key) ?? []), m]);
  }
  const single: MapMarker[] = [];
  const groups: { lat: number; lng: number; count: number }[] = [];
  for (const list of cells.values()) {
    if (list.length === 1) single.push(list[0]);
    else groups.push({ lat: list[0].lat, lng: list[0].lng, count: list.length });
  }
  return { single, groups };
}

export default function MapView({ markers, selectedId, onSelect, center, viewer, onMoved, focus, showZoom = false }: MapViewProps) {
  const { single, groups } = useMemo(() => cluster(markers), [markers]);
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={15} className="h-full w-full" zoomControl={false} attributionControl>
      {/* crossOrigin : tuiles en CORS, donc réutilisables hors ligne par le service worker (sinon réponses opaques). */}
      <TileLayer url={TILE_URL} attribution="© contributeurs OpenStreetMap" crossOrigin="" />
      {showZoom && <ZoomControl position="bottomright" />}
      <Events onSelect={onSelect} onMoved={onMoved} />
      <Focus focus={focus} />
      {viewer && (
        <>
          <Circle center={[viewer.lat, viewer.lng]} radius={Math.min(viewer.accuracy, 300)}
            pathOptions={{ color: '#2563EB', weight: 0, fillOpacity: 0.14 }} />
          <Marker position={[viewer.lat, viewer.lng]} icon={viewerIcon} interactive={false} />
        </>
      )}
      {single.map((m) => (
        <span key={m.posId}>
          {m.isApproximate && (
            <Circle center={[m.lat, m.lng]} radius={300} pathOptions={{ color: '#C2410C', weight: 1, fillOpacity: 0.06 }} />
          )}
          <Marker position={[m.lat, m.lng]} icon={markerIcon(m, m.posId === selectedId)}
            zIndexOffset={m.posId === selectedId ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(m.posId) }} keyboard title={`${m.label} · ${m.posName}`} />
        </span>
      ))}
      {groups.map((g, i) => (
        <Marker key={`g${i}`} position={[g.lat, g.lng]} icon={clusterIcon(g.count)} />
      ))}
    </MapContainer>
  );
}
