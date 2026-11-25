import type { Metadata } from 'next';
import { FavoritesScreen } from '@/components/customer/favorites/FavoritesScreen';
import { ClientShell } from '@/components/customer/layout/ClientShell';
import { getFavoritesToday, getMe, getMyContacts } from '@/lib/api';
import { readViewer } from '@/lib/viewer-server';

export const metadata: Metadata = { title: 'Mes favoris', robots: { index: false } };

/** Écran 14 (mobile) et D3 (desktop) — favoris et derniers contacts lus côté serveur. */
export default async function FavoritesPage() {
  const [me, { point }] = await Promise.all([getMe().catch(() => null), readViewer()]);
  const [favorites, contacts] = me
    ? await Promise.all([getFavoritesToday(point).catch(() => null), getMyContacts().catch(() => null)])
    : [null, null];
  return (
    <ClientShell>
      <FavoritesScreen initialFavorites={favorites} initialContacts={contacts} />
    </ClientShell>
  );
}
