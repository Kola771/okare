import { MenuScreen } from '@/components/seller/menu/MenuScreen';
import { ErrorState } from '@/components/ui/States';
import { getManagedPos, getMenu } from '@/lib/api';
import { load } from '@/lib/api/server-page';

/** Écran 7 (mobile) et VD4 (desktop) : données lues côté serveur. */
export default async function SellerMenuPage({ params }: { params: Promise<{ posId: string }> }) {
  const { posId } = await params;
  const [menu, pos] = await Promise.all([load(getMenu(posId)), load(getManagedPos(posId))]);
  if (!menu.data || !pos.data) return <ErrorState message={menu.error ?? pos.error ?? ''} />;
  return <MenuScreen posId={posId} initialMenu={menu.data} initialPos={pos.data} />;
}
