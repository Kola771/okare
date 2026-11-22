import { DashboardHome } from '@/components/dashboard/home/DashboardHome';
import { ErrorState } from '@/components/ui/States';
import { getAdminDashboard, getGeography } from '@/lib/api';
import { load } from '@/lib/api/server-page';
import { filterFromParams } from '@/shared/team-filter';

type Search = Promise<Record<string, string | string[] | undefined>>;

/** DB1 (desktop) et DM1 (mobile) — rendu serveur, filtré par l'adresse (?country=&city=&zone=&nb=&from=&to=). */
export default async function DashboardPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const f = filterFromParams((k) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined));
  const [d, geo] = await Promise.all([load(getAdminDashboard(f)), load(getGeography())]);
  if (!d.data || !geo.data) return <ErrorState message={d.error ?? geo.error ?? ''} />;
  return <DashboardHome d={d.data} geo={geo.data} />;
}
