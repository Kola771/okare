/** Application des filtres du dashboard (pays, ville, zone, quartier, période) sur la base fictive. */
import 'server-only';
import { db } from '@/mocks';
import { businessDate } from '@/shared/time';
import type { TeamFilter } from '@/shared/team-filter';
import type { PointOfSale } from '@/shared/types';

/** Zones couvertes par le filtre géographique (null = toutes). */
export function zonesOf(f: TeamFilter): Set<string> | null {
  if (f.neighborhoodId) {
    const n = db.neighborhoods.find((x) => x.id === f.neighborhoodId);
    return new Set(n ? [n.zoneId] : []);
  }
  if (f.zoneId) return new Set([f.zoneId]);
  if (f.cityId) return new Set(db.zones.filter((z) => z.cityId === f.cityId).map((z) => z.id));
  if (f.countryId) {
    const cities = new Set(db.cities.filter((c) => c.countryId === f.countryId).map((c) => c.id));
    return new Set(db.zones.filter((z) => cities.has(z.cityId)).map((z) => z.id));
  }
  return null;
}

export function posInPlace(p: Pick<PointOfSale, 'zoneId' | 'neighborhoodId'>, f: TeamFilter, zones = zonesOf(f)): boolean {
  if (zones && !zones.has(p.zoneId)) return false;
  return !f.neighborhoodId || p.neighborhoodId === f.neighborhoodId;
}

/** La date (ISO) tombe-t-elle dans la période du filtre ? Sans période : toujours vrai. */
export function inPeriod(iso: string | null | undefined, f: TeamFilter): boolean {
  if (!f.from && !f.to) return true;
  if (!iso) return false;
  const d = businessDate(new Date(iso));
  return (!f.from || d >= f.from) && (!f.to || d <= f.to);
}

/** « Bénin › Cotonou › Ganhi » ou « Tous les pays ». */
export function placeLabel(f: TeamFilter): string {
  const nb = db.neighborhoods.find((n) => n.id === f.neighborhoodId);
  const zone = db.zones.find((z) => z.id === (f.zoneId ?? nb?.zoneId));
  const city = db.cities.find((c) => c.id === (f.cityId ?? zone?.cityId));
  const country = db.countries.find((c) => c.id === (f.countryId ?? city?.countryId));
  const parts = [country?.name, city?.name, zone?.name, nb?.name].filter(Boolean);
  return parts.length ? parts.join(' › ') : 'Tous les pays';
}
