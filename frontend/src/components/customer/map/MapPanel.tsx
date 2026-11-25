'use client';

/**
 * Carte des points (écran 11 en plein écran mobile ; colonne de droite de D1 sur desktop).
 * Mêmes filtres que la liste ; option « Rechercher quand je déplace la carte » (activée par défaut sur desktop).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage, getMap, type MapMarker } from '@/lib/api';
import { useToast } from '@/components/providers/ToastProvider';
import { useViewer } from '@/components/providers/ViewerProvider';
import type { FeedFilters } from '@/components/customer/home/useFeed';
import type { OpenState } from '@/shared/open-status';
import { LazyMap } from './LazyMap';
import { LocateButton, MapLegend, MapSummary } from './MapOverlays';

const STATE_TEXT: Partial<Record<OpenState, string>> = { OPEN: 'Ouvert', CLOSING_SOON: 'Ferme bientôt', OPENS_LATER_TODAY: 'Ouvre plus tard' };

interface Props {
  filters: FeedFilters;
  selectedId: string | null;
  onSelect: (posId: string | null) => void;
  variant: 'desktop' | 'mobile';
  /** Décalage du bas pour la carte résumé mobile (navigation basse). */
  summaryBottom?: string;
}

export function MapPanel({ filters, selectedId, onSelect, variant, summaryBottom = 'bottom-3' }: Props) {
  const { zoneId, zone, position, budgetMin, budgetMax, openNow, locateMe } = useViewer();
  const toast = useToast();
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [searchOnMove, setSearchOnMove] = useState(variant === 'desktop');
  const [bbox, setBbox] = useState<[number, number, number, number] | undefined>();
  const [focus, setFocus] = useState<{ lat: number; lng: number; n: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (!zoneId) return;
    getMap({ zoneId, lat: position?.lat, lng: position?.lng, budgetMin, budgetMax, openNow, ...filters, bbox: searchOnMove ? bbox : undefined })
      .then(setMarkers)
      .catch((e) => toast(errorMessage(e), 'error'));
  }, [zoneId, position, budgetMin, budgetMax, openNow, filters, bbox, searchOnMove, toast]);

  const onMoved = useCallback((b: [number, number, number, number]) => {
    if (first.current) {
      first.current = false;
      return;
    }
    setBbox(b);
  }, []);

  useEffect(() => {
    const target = position ?? zone?.center;
    if (target) setFocus({ lat: target.lat, lng: target.lng, n: Date.now() });
  }, [zone, position]);

  const selected = markers.find((m) => m.posId === selectedId) ?? null;
  const center = position ?? zone?.center ?? { lat: 6.3654, lng: 2.4183 };

  async function locate() {
    setLocating(true);
    const msg = await locateMe();
    setLocating(false);
    if (msg) toast(msg);
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <LazyMap markers={markers} selectedId={selectedId} onSelect={onSelect} center={center} viewer={position} onMoved={onMoved} focus={focus} showZoom={variant === 'desktop'} />
      {variant === 'desktop' ? (
        <>
          <label className="absolute left-4 top-4 z-[400] flex min-h-11 items-center gap-2 rounded-xl bg-surface px-3.5 text-[13px] font-semibold shadow-[0_1px_4px_rgba(28,25,23,0.25)]">
            <input type="checkbox" checked={searchOnMove} onChange={(e) => setSearchOnMove(e.target.checked)} className="h-[18px] w-[18px] accent-piment" />
            Rechercher quand je déplace la carte
          </label>
          <LocateButton onClick={locate} busy={locating} label className="absolute right-4 top-4 z-[400]" />
          <MapLegend className="absolute bottom-4 left-4 z-[400]" />
          {selected && <MapSummary marker={selected} statusText={STATE_TEXT[selected.openState]} className="absolute right-4 top-[72px] z-[450] w-[300px]" />}
        </>
      ) : (
        <>
          {!searchOnMove && bbox && (
            <button type="button" onClick={() => setSearchOnMove(true)}
              className="absolute left-1/2 top-[124px] z-[400] min-h-10 -translate-x-1/2 rounded-full bg-charbon px-4 text-[13px] font-bold text-white shadow">
              Rechercher dans cette zone
            </button>
          )}
          <LocateButton onClick={locate} busy={locating} className={`absolute right-4 z-[400] ${selected ? 'bottom-[130px]' : 'bottom-4'}`} />
          {selected && (
            <MapSummary marker={selected} statusText={STATE_TEXT[selected.openState]} className={`absolute inset-x-3 z-[450] ${summaryBottom}`} />
          )}
        </>
      )}
    </div>
  );
}
