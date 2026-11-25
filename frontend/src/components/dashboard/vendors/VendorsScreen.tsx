'use client';

/** Vendeurs — DB8 (liste) et écran 9 « Un vendeur et ses points » (détail, vue mobile terrain). */
import { Phone, SquareCheck, Star, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { createShareLink, errorMessage, listTeamPos, listVendors, type AdminVendorRow, type Geography } from '@/lib/api';
import { btn, PageHead, Panel, Pill, StatCard } from '@/components/admin/AdminParts';
import { Avatar, Card, Crumbs } from '@/components/admin/Card';
import { FiltersBar } from '../filters/FiltersBar';
import { ClaimCodeButton } from './ClaimCodeButton';
import { ImportVendorsButton } from './ImportVendorsSheet';
import { DataTable, FilterChips, type Column } from '@/components/admin/DataTable';
import { useApi } from '@/components/admin/useApi';
import { useToast } from '@/components/providers/ToastProvider';
import { ErrorState, LoadingList } from '@/components/ui/States';
import { displayPhone, maskPhone, openStatusLabel } from '@/shared/format';

type F = 'all' | 'account' | 'noAccount' | 'new' | 'multi';
const COLS: Column<AdminVendorRow>[] = [
  { key: 'n', label: 'Vendeur', render: (v) => <span className="flex items-center gap-3"><Avatar name={v.contactName ?? v.name} round />
    <span><b className="block">{v.contactName ?? v.name}</b><span className="whitespace-nowrap text-xs text-ardoise">{maskPhone(v.phone)}</span></span></span> },
  { key: 'p', label: 'Points', render: (v) => v.points.length },
  { key: 'c', label: 'Compte', render: (v) => <Pill tone={v.hasAccount ? 'ok' : 'neutral'}>{v.hasAccount ? 'a un compte' : 'sans compte'}</Pill> },
  { key: 'a', label: 'Agent référent', render: (v) => <span className="whitespace-nowrap">{v.agentName ?? '—'}</span> },
  { key: 'g', label: 'Ancienneté', render: (v) => <Pill tone={v.ageDays >= 30 ? 'ok' : 'warn'}>{v.ageDays >= 30 ? 'Ancien' : 'Nouveau'} · {v.ageDays} j</Pill> },
  { key: 'm', label: 'Mise en avant', render: (v) => v.adLabel },
  { key: 'k', label: 'Contacts 30 j', render: (v) => v.contacts30 },
  { key: 'o', label: '', render: (v) => <Link href={`/dashboard/vendors/${v.id}`} className="text-sm font-semibold text-piment underline">Ouvrir</Link> },
];

/** `initial` lu par la page serveur, déjà filtré (lieu, période) : pas de chargement au premier affichage. */
export function VendorsScreen({ initial, geo }: { initial: AdminVendorRow[]; geo: Geography }) {
  const toast = useToast();
  const [f, setF] = useState<F>('all');
  const v = initial;
  const rows = v.filter((x) => (f === 'account' ? x.hasAccount : f === 'noAccount' ? !x.hasAccount : f === 'new' ? x.ageDays < 30 : f === 'multi' ? x.points.length > 1 : true));
  const withAccount = v.filter((x) => x.hasAccount).length;
  return (
    <>
      <div className="flex flex-col gap-2">
        <Crumbs items={['Terrain', 'Vendeurs']} />
        <PageHead title="Vendeurs" sub="Un vendeur peut avoir plusieurs points de vente. L’ancienneté décide s’il peut payer une mise en avant."
          actions={<>
            <button type="button" className={btn.secondary} onClick={() => toast('Export CSV : branché avec le backend.')}>Exporter</button>
            <ImportVendorsButton />
          </>} />
      </div>
      <FiltersBar geo={geo} dateHint="Dates : vendeurs arrivés (premier point publié) entre ces deux jours." />
      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard icon={Users} label="Vendeurs" value={v.length} delta={`+${v.filter((x) => x.ageDays < 30).length} ce mois`} />
        <StatCard icon={SquareCheck} label="Avec un compte OKARE" value={withAccount} delta={`${Math.round((withAccount / (v.length || 1)) * 100)} %`} />
        <StatCard icon={Star} label="Éligibles à la mise en avant" value={v.filter((x) => x.ageDays >= 30).length} delta="ancienneté ≥ 30 j" />
      </div>
      <Card title="Liste" flush right={<span className="text-[13px] text-ardoise">Données d’exemple</span>}>
        <div className="px-5 pb-4">
          <FilterChips value={f} onChange={setF} options={[['all', 'Tous'], ['account', 'Avec compte'], ['noAccount', 'Sans compte'], ['new', 'Nouveaux (< 30 j)'], ['multi', 'Plusieurs points']]} />
        </div>
        <DataTable bare columns={COLS} rows={rows} />
      </Card>
    </>
  );
}

export function VendorDetail({ vendorId }: { vendorId: string }) {
  const toast = useToast();
  const list = useApi(listVendors, []);
  const pos = useApi(() => listTeamPos('all'), []);
  const v = list.data?.find((x) => x.id === vendorId);
  if (list.error) return <ErrorState message={list.error} onRetry={list.reload} />;
  if (!list.data || !pos.data) return <LoadingList count={3} className="h-24" />;
  if (!v) return <ErrorState message="Vendeur introuvable." />;
  const points = pos.data.filter((p) => p.vendorId === v.id);
  return (
    <>
      <PageHead kicker={<Link href="/dashboard/vendors">← Vendeurs</Link>} title={v.contactName ?? v.name} sub={`${v.name} · ${displayPhone(v.phone)} · agent : ${v.agentName ?? '—'}`}
        actions={<><a href={`tel:${v.phone}`} className={btn.secondary}><Phone size={16} /> Appeler</a>
          {!v.hasAccount && <ClaimCodeButton vendorId={v.id} vendorName={v.contactName ?? v.name} />}
          <button type="button" className={btn.primary} onClick={() => points[0] && createShareLink(points[0].id).then((r) =>
            window.open(`https://wa.me/${v.phone.replace('+', '')}?text=${encodeURIComponent(`Tes chiffres OKARE : ${window.location.origin}${r.url}`)}`, '_blank', 'noopener')).catch((e) => toast(errorMessage(e), 'error'))}>
            Envoyer le rapport</button></>} />
      {points.map((p) => (
        <Panel key={p.id} title={p.name} sub={`${p.zoneName} (${p.zoneCategory}) · ${openStatusLabel(p.openStatus).short}`}
          actions={<span className="flex gap-1.5">{p.isMainPos && <Pill tone="piment">principal</Pill>}<Pill tone={p.status === 'PUBLISHED' ? 'ok' : 'warn'}>{p.status === 'PUBLISHED' ? 'Publié' : p.status}</Pill></span>}>
          <div className="flex flex-wrap gap-4 text-sm"><span>Contacts 7 j : <b>{p.contacts7d}</b></span><span>Réponse : <b>{p.responseRate != null ? `${Math.round(p.responseRate * 100)} %` : '—'}</b></span>
            <span>Prix vérifiés : <b>{p.pricesStaleDays == null ? 'jamais' : `il y a ${p.pricesStaleDays} j`}</b></span></div>
          <div className="flex flex-wrap gap-2"><Link href={`/dashboard/points/${p.id}?tab=menu`} className={btn.secondary}>Menu</Link>
            <Link href={`/dashboard/points/${p.id}?tab=stats`} className={btn.secondary}>Stats</Link></div>
        </Panel>
      ))}
      <Link href="/dashboard/points/new" className="flex min-h-[50px] items-center justify-center rounded-btn border-2 border-dashed border-[#A8A29E] font-bold text-charbon no-underline">+ Ajouter un point de vente</Link>
    </>
  );
}
