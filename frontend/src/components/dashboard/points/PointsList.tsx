'use client';

/** Points de vente — DB2 (desktop, tableau filtrable) et DM2 (mobile, cartes). Un agent ne voit que ses zones. */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { listTeamPos, type AdminPosRow, type Geography, type PosFilter, type TeamFilter } from '@/lib/api';
import { btn, PageHead, Pill } from '@/components/admin/AdminParts';
import { DataTable, FilterChips, type Column } from '@/components/admin/DataTable';
import { Pager, usePaged } from '@/components/admin/Pager';
import { useApi } from '@/components/admin/useApi';
import { ErrorState, LoadingList } from '@/components/ui/States';
import { openStatusLabel } from '@/shared/format';
import { POS_TYPE_LABEL } from '@/shared/enums';
import { FiltersBar } from '../filters/FiltersBar';

export const STATUS_PILL: Record<string, ['ok' | 'warn' | 'bad' | 'neutral', string]> = {
  PUBLISHED: ['ok', 'Publié'], PENDING: ['warn', 'En attente'], SUSPENDED: ['bad', 'Suspendu'], ARCHIVED: ['neutral', 'Archivé'],
};
const pct = (r: number | null) => (r == null ? '—' : `${Math.round(r * 100)} %`);
const checked = (d: number | null) => (d == null ? 'jamais' : d === 0 ? 'aujourd’hui' : `il y a ${d} j`);

const COLUMNS: Column<AdminPosRow>[] = [
  { key: 'name', label: 'Point de vente', render: (r) => <><b>{r.name}</b><span className="block text-xs text-ardoise">{r.vendorName}</span></> },
  { key: 'type', label: 'Type', render: (r) => POS_TYPE_LABEL[r.type] },
  { key: 'zone', label: 'Zone', render: (r) => `${r.zoneName} · ${r.zoneCategory}` },
  { key: 'status', label: 'Statut', render: (r) => <Pill tone={STATUS_PILL[r.status][0]}>{STATUS_PILL[r.status][1]}</Pill> },
  { key: 'today', label: 'Aujourd’hui', render: (r) => openStatusLabel(r.openStatus).short },
  { key: 'prices', label: 'Prix vérifiés', render: (r) => <span className={(r.pricesStaleDays ?? 99) >= 7 ? 'font-semibold text-attention' : ''}>{checked(r.pricesStaleDays)}</span> },
  { key: 'resp', label: 'Réponse', render: (r) => <span className={r.responseRate != null && r.responseRate < 0.5 ? 'font-semibold text-erreur' : ''}>{pct(r.responseRate)}</span> },
  { key: 'c7', label: 'Contacts 7 j', render: (r) => r.contacts7d },
];

/** `initialRows` lus par la page serveur (déjà filtrés par `f`) : pas de chargement au premier affichage. */
export function PointsList({ initialRows, geo, f }: { initialRows: AdminPosRow[]; geo: Geography; f: TeamFilter }) {
  const router = useRouter();
  const [filter, setFilter] = useState<PosFilter>('all');
  const list = useApi(() => listTeamPos(filter, undefined, undefined, f), [filter], initialRows);
  const { items, pager } = usePaged(list.data ?? []);
  const all = { data: initialRows };
  const n = (f: (r: AdminPosRow) => boolean) => all.data?.filter(f).length ?? 0;

  return (
    <>
      <PageHead title="Points de vente" sub="Tous les points de vente des zones auxquelles tu as accès."
        actions={<><button type="button" className={btn.secondary}>Exporter CSV</button><Link href="/dashboard/points/new" className={btn.primary}>+ Nouveau point de vente</Link></>} />
      <FiltersBar geo={geo} dateHint="Dates : points de vente publiés entre ces deux jours." />
      <FilterChips value={filter} onChange={setFilter} options={[
        ['all', `Tous (${all.data?.length ?? '…'})`], ['pending', `En attente (${n((r) => r.status === 'PENDING')})`],
        ['prices', `Prix à revérifier (${n((r) => (r.pricesStaleDays ?? 99) >= 7)})`], ['lowResponse', `Réponse basse (${n((r) => r.responseRate != null && r.responseRate < 0.5)})`],
        ['suspended', `Suspendus (${n((r) => r.status === 'SUSPENDED')})`], ['potential', 'Fort potentiel'], ['inactive', 'Inactifs']]} />
      {list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : list.loading || !list.data ? <LoadingList count={4} className="h-14" /> : (
        <>
          <div className="hidden lg:block"><DataTable paged={false} columns={COLUMNS} rows={items} onRow={(r) => router.push(`/dashboard/points/${r.id}`)} empty="Aucun point de vente pour ce filtre." /></div>
          <div className="flex flex-col gap-2.5 lg:hidden">{items.map((r) => (
            <Link key={r.id} href={`/dashboard/points/${r.id}`} className="flex flex-col gap-1.5 rounded-2xl border border-[#E7E5E4] bg-white p-3.5 text-charbon no-underline">
              <div className="flex items-start justify-between gap-2"><b>{r.name}</b><Pill tone={STATUS_PILL[r.status][0]}>{STATUS_PILL[r.status][1]}</Pill></div>
              <div className="text-xs text-ardoise">{POS_TYPE_LABEL[r.type]} · {r.zoneName} · {openStatusLabel(r.openStatus).short}</div>
              <div className="flex flex-wrap gap-3 text-xs"><span>Contacts 7 j : <b>{r.contacts7d}</b></span><span>Réponse : <b>{pct(r.responseRate)}</b></span><span>Prix : {checked(r.pricesStaleDays)}</span></div>
            </Link>))}{!list.data.length && <p className="text-sm text-ardoise">Aucun point de vente pour ce filtre.</p>}</div>
          <div className="rounded-2xl border border-[#E7E5E4] bg-white"><Pager {...pager} bordered={false} /></div>
        </>
      )}
    </>
  );
}
