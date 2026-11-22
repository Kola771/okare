import { HoursEditor } from '@/components/seller/hours/HoursEditor';
import { ErrorState } from '@/components/ui/States';
import { getManagedPos } from '@/lib/api';
import { load } from '@/lib/api/server-page';

/** Écran 19 (mobile) et VD3 (desktop) : horaires jour par jour et fermetures. */
export default async function HoursPage({ params }: { params: Promise<{ posId: string }> }) {
  const { posId } = await params;
  const pos = await load(getManagedPos(posId));
  if (!pos.data) return <ErrorState message={pos.error} />;
  return <HoursEditor pos={pos.data} />;
}
