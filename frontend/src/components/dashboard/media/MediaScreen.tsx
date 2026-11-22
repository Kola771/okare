'use client';

/**
 * Médiathèque — DB11 : toutes les photos du site (plats, façades, reçues sur WhatsApp). Les photos des vendeurs
 * passent en relecture avant d'être publiées ; celles reçues sur WhatsApp sont à associer à un point de vente.
 */
import { Image as ImageIcon, Inbox, ListChecks } from 'lucide-react';
import { useState } from 'react';
import { getMediaLibrary, listTeamPos, type MediaRow } from '@/lib/api';
import { PageHead, StatCard } from '@/components/admin/AdminParts';
import { Card, Crumbs } from '@/components/admin/Card';
import { FilterChips } from '@/components/admin/DataTable';
import { Pager, usePaged } from '@/components/admin/Pager';
import { useApi } from '@/components/admin/useApi';
import { ErrorState, LoadingList } from '@/components/ui/States';
import { MediaSheet } from './MediaSheet';
import { MediaTile } from './MediaTile';
import { UploadPhotos } from './UploadPhotos';

type F = 'all' | 'DISH' | 'FACADE' | 'TO_REVIEW' | 'UNASSIGNED' | 'REJECTED';
const keep: Record<F, (m: MediaRow) => boolean> = {
  all: () => true, DISH: (m) => m.kind === 'DISH', FACADE: (m) => m.kind === 'FACADE', TO_REVIEW: (m) => m.state === 'TO_REVIEW',
  UNASSIGNED: (m) => m.unassigned, REJECTED: (m) => m.state === 'REJECTED',
};

export function MediaScreen() {
  const lib = useApi(getMediaLibrary, []);
  const pos = useApi(() => listTeamPos('all'), []);
  const [f, setF] = useState<F>('all');
  const [open, setOpen] = useState<MediaRow | null>(null);
  const rows = (lib.data?.items ?? []).filter(keep[f]);
  const { items, pager } = usePaged(rows);
  if (lib.error) return <ErrorState message={lib.error} onRetry={lib.reload} />;
  if (!lib.data) return <LoadingList count={3} className="h-40" />;
  const s = lib.data.stats;
  const reload = () => void lib.reload();

  return (
    <>
      <div className="flex flex-col gap-2">
        <Crumbs items={['Terrain', 'Médiathèque']} />
        <PageHead title="Médiathèque" sub="Toutes les photos du site : plats, façades, photos reçues sur WhatsApp. Les photos des vendeurs passent en relecture avant d’être publiées."
          actions={<UploadPhotos points={pos.data ?? []} onDone={reload} />} />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard icon={ImageIcon} label="Photos publiées" value={s.published.toLocaleString('fr-FR')} delta={`+${s.publishedMonth} ce mois`} />
        <StatCard icon={ListChecks} label="À relire" value={s.toReview} delta="photos de vendeurs" tone="bad" />
        <StatCard icon={Inbox} label="Non associées" value={s.unassigned} delta="reçues sur WhatsApp" tone="bad" />
      </div>
      <Card title="Toutes les photos" flush right={<span className="text-[13px] text-ardoise">WebP · 160, 640 et 1 200 px · métadonnées retirées</span>}>
        <div className="px-5 pb-4">
          <FilterChips value={f} onChange={setF} options={[['all', 'Toutes'], ['DISH', 'Plats'], ['FACADE', 'Façades'], ['TO_REVIEW', `À relire (${s.toReview})`],
            ['UNASSIGNED', `Non associées (${s.unassigned})`], ['REJECTED', 'Refusées']]} />
        </div>
        {items.length ? (
          <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
            {items.map((m) => <MediaTile key={m.id} m={m} onOpen={() => setOpen(m)} />)}
          </div>
        ) : <p className="m-0 px-5 pb-6 text-sm text-ardoise">Aucune photo pour ce filtre.</p>}
        <Pager {...pager} />
      </Card>
      <MediaSheet key={open?.id ?? 'none'} m={open} points={pos.data ?? []} onClose={() => setOpen(null)} onDone={reload} />
    </>
  );
}
