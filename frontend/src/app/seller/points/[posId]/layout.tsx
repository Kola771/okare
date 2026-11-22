import { ManageNav } from '@/components/seller/manage/ManageNav';
import { ErrorState } from '@/components/ui/States';
import { getManagedPos } from '@/lib/api';
import { load } from '@/lib/api/server-page';
import { openStatusLabel } from '@/shared/format';
import { POS_TYPE_LABEL } from '@/shared/enums';

/** Gestion d'un point (15c ; onglets VD3–VD5) : en-tête commun, rendu serveur. */
export default async function ManageLayout({ children, params }: { children: React.ReactNode; params: Promise<{ posId: string }> }) {
  const { posId } = await params;
  const pos = await load(getManagedPos(posId));
  if (!pos.data) return <ErrorState message={pos.error} />;
  const p = pos.data;
  const label = openStatusLabel(p.openStatus);
  return (
    <>
      <ManageNav base={`/seller/points/${posId}`} pos={{ id: p.id, slug: p.slug, name: p.name, status: p.status, typeLabel: POS_TYPE_LABEL[p.type],
        openText: label.text, isOpen: label.tone === 'open' || label.tone === 'soon' }} />
      {children}
    </>
  );
}
