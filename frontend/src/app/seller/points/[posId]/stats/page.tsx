import { StatsView } from '@/components/seller/stats/StatsView';
import { ErrorState } from '@/components/ui/States';
import { getPosStats } from '@/lib/api';
import { load } from '@/lib/api/server-page';

/** Écran 4 (mobile) et VD5 (desktop) : statistiques du point, par plat — rendu serveur. */
export default async function StatsPage({ params }: { params: Promise<{ posId: string }> }) {
  const { posId } = await params;
  const stats = await load(getPosStats(posId, 30));
  if (!stats.data) return <ErrorState message={stats.error} />;
  return <StatsView report={stats.data} periodLabel="Ces 30 jours" />;
}
