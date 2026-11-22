/**
 * Préférences d'affichage du client (zone, position, budget, « ouvert maintenant »), gardées dans un cookie
 * pour que le serveur calcule directement la page (spec 0ter.9). Pas des données métier.
 */
export interface ViewerPrefs {
  zoneId: string | null;
  position: { lat: number; lng: number; accuracy: number } | null;
  budgetMax: number | null;
  openNow: boolean;
}

export const VIEWER_COOKIE = 'okare_viewer';
export const DEFAULT_VIEWER: ViewerPrefs = { zoneId: null, position: null, budgetMax: 1000, openNow: true };

export function parseViewer(raw: string | undefined | null): ViewerPrefs {
  if (!raw) return DEFAULT_VIEWER;
  try {
    return { ...DEFAULT_VIEWER, ...(JSON.parse(decodeURIComponent(raw)) as Partial<ViewerPrefs>) };
  } catch {
    return DEFAULT_VIEWER;
  }
}

export function writeViewerCookie(p: ViewerPrefs): void {
  document.cookie = `${VIEWER_COOKIE}=${encodeURIComponent(JSON.stringify(p))}; path=/; max-age=${365 * 86_400}; samesite=lax`;
}
