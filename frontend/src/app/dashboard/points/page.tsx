import { PointsList } from '@/components/dashboard/points/PointsList';
import { ErrorState } from '@/components/ui/States';
import { getGeography, listTeamPos } from '@/lib/api';
import { load } from '@/lib/api/server-page';
import { filterFromParams, filterToQuery } from '@/shared/team-filter';

type Search = Promise<Record<string, string | string[] | undefined>>;

/** DB2 (desktop) et DM2 (mobile) — liste lue côté serveur, filtrée par l'adresse (lieu et période de création). */
export default async function DashboardPointsPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const f = filterFromParams((k) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined));
  const [rows, geo] = await Promise.all([load(listTeamPos('all', undefined, undefined, f)), load(getGeography())]);
  if (!rows.data || !geo.data) return <ErrorState message={rows.error ?? geo.error ?? ''} />;
  return <PointsList key={filterToQuery(f)} initialRows={rows.data} geo={geo.data} f={f} />;
}
