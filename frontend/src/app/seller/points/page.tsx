import { FiltersBar } from '@/components/dashboard/filters/FiltersBar';
import { PointsList } from '@/components/seller/points/PointsList';
import { ErrorState } from '@/components/ui/States';
import { getGeography, getVendorMe, type Geography } from '@/lib/api';
import { load } from '@/lib/api/server-page';
import { filterFromParams, type TeamFilter } from '@/shared/team-filter';

type Search = Promise<Record<string, string | string[] | undefined>>;

/** Géographie réduite aux lieux où le vendeur a des points (les listes du filtre ne proposent que ceux-là). */
function ownGeo(geo: Geography, zoneIds: Set<string>): Geography {
  const zones = geo.zones.filter((z) => zoneIds.has(z.id));
  const cities = geo.cities.filter((c) => zones.some((z) => z.cityId === c.id));
  return { countries: geo.countries.filter((c) => cities.some((x) => x.countryId === c.id)), cities, zones,
    neighborhoods: geo.neighborhoods.filter((n) => zoneIds.has(n.zoneId)) };
}

/** Écran 15b (mobile) et VD2 (desktop) — rendu serveur, filtré par lieu (?country=&city=&zone=&nb=). */
export default async function SellerPointsPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const f: TeamFilter = filterFromParams((k) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined));
  const [home, geoAll] = await Promise.all([load(getVendorMe()), load(getGeography())]);
  if (!home.data || !geoAll.data) return <ErrorState message={home.error ?? geoAll.error ?? ''} />;
  const geo = ownGeo(geoAll.data, new Set(home.data.points.map((p) => p.zoneId)));
  const cityOf = (zoneId: string) => geo.zones.find((z) => z.id === zoneId)?.cityId;
  const countryOf = (zoneId: string) => geo.cities.find((c) => c.id === cityOf(zoneId))?.countryId;
  const points = home.data.points.filter((p) => (!f.neighborhoodId || p.neighborhoodId === f.neighborhoodId)
    && (!f.zoneId || p.zoneId === f.zoneId) && (!f.cityId || cityOf(p.zoneId) === f.cityId) && (!f.countryId || countryOf(p.zoneId) === f.countryId));
  return <PointsList home={{ ...home.data, points }} filters={<FiltersBar geo={geo} dates={false} />} />;
}
