import { VendorsScreen } from '@/components/dashboard/vendors/VendorsScreen';
import { ErrorState } from '@/components/ui/States';
import { getGeography, listVendors } from '@/lib/api';
import { load } from '@/lib/api/server-page';
import { filterFromParams, filterToQuery } from '@/shared/team-filter';

type Search = Promise<Record<string, string | string[] | undefined>>;

/** DB8 — rendu serveur, filtré par l'adresse (lieu des points, période d'arrivée du vendeur). */
export default async function DashboardVendorsPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const f = filterFromParams((k) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined));
  const [rows, geo] = await Promise.all([load(listVendors(f)), load(getGeography())]);
  if (!rows.data || !geo.data) return <ErrorState message={rows.error ?? geo.error ?? ''} />;
  return <VendorsScreen key={filterToQuery(f)} initial={rows.data} geo={geo.data} />;
}
