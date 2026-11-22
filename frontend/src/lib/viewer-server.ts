import 'server-only';
import { cookies } from 'next/headers';
import { getZones, type ZoneOption } from '@/lib/api';
import { parseViewer, VIEWER_COOKIE, type ViewerPrefs } from './viewer';

/** Préférences du client lues côté serveur, avec la zone par défaut (première zone active) si aucune n'est choisie. */
export async function readViewer(): Promise<{ prefs: ViewerPrefs; zones: ZoneOption[]; point: { lat: number; lng: number } | null }> {
  const [jar, zones] = await Promise.all([cookies(), getZones().catch(() => [] as ZoneOption[])]);
  const prefs = parseViewer(jar.get(VIEWER_COOKIE)?.value);
  const zoneId = prefs.zoneId && zones.some((z) => z.id === prefs.zoneId) ? prefs.zoneId : zones[0]?.id ?? null;
  const zone = zones.find((z) => z.id === zoneId);
  return { prefs: { ...prefs, zoneId }, zones, point: prefs.position ?? zone?.center ?? null };
}
