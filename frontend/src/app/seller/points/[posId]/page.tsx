import { ManageOverview } from '@/components/seller/manage/ManageOverview';
import { ErrorState } from '@/components/ui/States';
import { getManagedPos } from '@/lib/api';
import { load } from '@/lib/api/server-page';

/** Écran 15c : gestion d'un point (vue d'ensemble). */
export default async function ManagePage({ params }: { params: Promise<{ posId: string }> }) {
  const { posId } = await params;
  const pos = await load(getManagedPos(posId));
  if (!pos.data) return <ErrorState message={pos.error} />;
  return <ManageOverview pos={pos.data} base={`/seller/points/${posId}`} />;
}
