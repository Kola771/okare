'use client';

/**
 * Contexte du client qui regarde : zone choisie, position GPS, budget, « ouvert maintenant » (7.3, 8.1).
 * Mémorisé dans un cookie (préférences d'affichage) pour que le serveur rende directement les pages.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { locate, type ZoneOption } from '@/lib/api';
import { writeViewerCookie, type ViewerPrefs } from '@/lib/viewer';

type Prefs = ViewerPrefs;

interface ViewerValue extends Prefs {
  zones: ZoneOption[];
  zone: ZoneOption | null;
  setZone: (zoneId: string) => void;
  setBudget: (b: number | null) => void;
  /** Filtre par fourchette de prix autour d'un montant (±30 %). */
  setBudgetRange: (min: number | null, max: number | null) => void;
  setOpenNow: (v: boolean) => void;
  /** Demande la position ; renvoie un message à afficher (hors zones, refus…) ou null. */
  locateMe: () => Promise<string | null>;
  ready: boolean;
}

const ViewerContext = createContext<ViewerValue | null>(null);

/** Préférences et zones lues côté serveur (cookie) : aucun chargement au démarrage. */
export function ViewerProvider({ children, initialPrefs, zones }: { children: React.ReactNode; initialPrefs: ViewerPrefs; zones: ZoneOption[] }) {
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs);
  const ready = true;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    writeViewerCookie(prefs);
  }, [prefs]);

  const setZone = useCallback((zoneId: string) => setPrefs((p) => ({ ...p, zoneId, position: null })), []);
  const setBudget = useCallback((budgetMax: number | null) => setPrefs((p) => ({ ...p, budgetMin: null, budgetMax })), []);
  const setBudgetRange = useCallback((budgetMin: number | null, budgetMax: number | null) => setPrefs((p) => ({ ...p, budgetMin, budgetMax })), []);
  const setOpenNow = useCallback((openNow: boolean) => setPrefs((p) => ({ ...p, openNow })), []);

  const locateMe = useCallback(async (): Promise<string | null> => {
    if (!('geolocation' in navigator)) return "Ton appareil ne donne pas sa position. Choisis ta zone.";
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10_000 }));
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      const found = await locate(lat, lng);
      setPrefs((p) => ({ ...p, zoneId: found.zoneId, position: { lat, lng, accuracy } }));
      return found.outside ? `Tu es hors des zones couvertes : on te montre ${found.zoneName}, la plus proche.` : null;
    } catch {
      return "Position refusée ou indisponible. Choisis ta zone dans la liste.";
    }
  }, []);

  const value = useMemo<ViewerValue>(() => ({
    ...prefs, zones, zone: zones.find((z) => z.id === prefs.zoneId) ?? null,
    setZone, setBudget, setBudgetRange, setOpenNow, locateMe, ready,
  }), [prefs, zones, setZone, setBudget, setBudgetRange, setOpenNow, locateMe, ready]);

  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>;
}

export function useViewer(): ViewerValue {
  const ctx = useContext(ViewerContext);
  if (!ctx) throw new Error('useViewer doit être utilisé sous <ViewerProvider>');
  return ctx;
}

/** Point de référence pour les distances : position GPS, sinon centre de la zone. */
export function useViewerPoint(): { lat: number; lng: number } | null {
  const { position, zone } = useViewer();
  return position ?? zone?.center ?? null;
}
