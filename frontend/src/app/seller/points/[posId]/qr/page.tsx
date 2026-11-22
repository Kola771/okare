import { QrPanel } from '@/components/seller/points/QrPanel';
import { ErrorState } from '@/components/ui/States';
import { getManagedPos } from '@/lib/api';
import { load } from '@/lib/api/server-page';

/** Écran 18 (mobile) et VD3 (desktop) : QR code et affiche. */
export default async function QrPage({ params }: { params: Promise<{ posId: string }> }) {
  const { posId } = await params;
  const pos = await load(getManagedPos(posId));
  if (!pos.data) return <ErrorState message={pos.error} />;
  return <QrPanel pos={pos.data} />;
}
