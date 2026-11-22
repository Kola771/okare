'use client';

/** Tableau « Mes points de vente » (VD2, desktop), paginé, avec le bouton « Gestion » par ligne. */
import Link from 'next/link';
import type { VendorHome } from '@/lib/api';
import { btn, Pill } from '@/components/admin/AdminParts';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { formatPrice, openStatusLabel } from '@/shared/format';
import { POS_TYPE_LABEL } from '@/shared/enums';

type Row = VendorHome['points'][number];
const live = (p: Row) => p.status === 'PUBLISHED';

const COLS: Column<Row>[] = [
  { key: 'n', label: 'Point de vente', render: (p) => <><b>{p.name}</b><span className="block text-xs text-ardoise">{POS_TYPE_LABEL[p.type]} · {p.zoneName}</span></> },
  { key: 's', label: 'Statut', render: (p) => <Pill tone={live(p) ? 'ok' : 'warn'}>{live(p) ? 'Publié' : 'En attente'}</Pill> },
  { key: 't', label: 'Aujourd’hui', render: (p) => (live(p) ? openStatusLabel(p.openStatus).text : '—') },
  { key: 'd', label: 'Plat du jour', render: (p) => (p.special ? `${p.special.name} · ${formatPrice(p.special.priceXof)}` : live(p) ? <span className="text-ardoise">Pas encore publié</span> : '—') },
  { key: 'c', label: 'Contacts (30 j)', render: (p) => <b>{live(p) ? p.contacts30 : '—'}</b> },
  { key: 'g', label: '', className: 'text-right', render: (p) => <Link href={`/seller/points/${p.id}`} className={btn.dark}>Gestion</Link> },
];

export function PointsTable({ points }: { points: Row[] }) {
  return <DataTable columns={COLS} rows={points} empty="Aucun point de vente." />;
}
