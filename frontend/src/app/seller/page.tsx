import { SellerHome } from '@/components/seller/home/SellerHome';
import { ErrorState } from '@/components/ui/States';
import { getPosStats, getVendorMe } from '@/lib/api';
import { load } from '@/lib/api/server-page';
import { mockClock } from '@/lib/clock-server';
import { periodFromParams } from '@/shared/period';
import { businessDate } from '@/shared/time';

type Search = Promise<Record<string, string | string[] | undefined>>;

/** Écran 15 (mobile) et VD1 (desktop) — rendu serveur. `?pos=` : un seul point ; période : ?year=&month= ou ?from=&to=. */
export default async function SellerHomePage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined);
  const today = businessDate(await mockClock());
  const period = periodFromParams(get, today);
  const home = await load(getVendorMe());
  if (!home.data) return <ErrorState message={home.error ?? ''} />;
  const pos = home.data.points.find((p) => p.id === get('pos')) ?? null;
  const stats = await load(getPosStats(pos?.id ?? 'all', 30, { from: period.from, to: period.to }));
  if (!stats.data) return <ErrorState message={stats.error ?? ''} />;
  const y = Number(today.slice(0, 4));
  return <SellerHome home={home.data} stats={stats.data} period={period} years={[y, y - 1, y - 2]} posName={pos?.name ?? null} />;
}
