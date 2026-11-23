'use client';

/**
 * Demandes de rattachement (section 14) : un vendeur sans code demande à récupérer la fiche créée par l'équipe.
 * L'admin compare le téléphone du compte à celui de la fiche, puis accepte ou refuse.
 */
import Link from 'next/link';
import { useState } from 'react';
import { errorMessage, listClaims, reviewClaim, type AdminClaimRow } from '@/lib/api';
import { PageHead, Pill } from '@/components/admin/AdminParts';
import { Card, Crumbs } from '@/components/admin/Card';
import { DataTable, FilterChips, type Column } from '@/components/admin/DataTable';
import { useApi } from '@/components/admin/useApi';
import { useToast } from '@/components/providers/ToastProvider';
import { ErrorState, LoadingList } from '@/components/ui/States';
import { ago } from '../people/UsersScreen';

type F = 'PENDING' | 'done' | 'all';
const STATUS: Record<AdminClaimRow['status'], [string, 'warn' | 'ok' | 'bad' | 'neutral']> = {
  PENDING: ['En attente', 'warn'], APPROVED: ['Acceptée', 'ok'], REJECTED: ['Refusée', 'bad'], EXPIRED: ['Expirée', 'neutral'],
};

export function ClaimsScreen() {
  const toast = useToast();
  const list = useApi(listClaims, []);
  const [f, setF] = useState<F>('PENDING');
  if (list.error) return <ErrorState message={list.error} onRetry={list.reload} />;
  if (!list.data) return <LoadingList count={3} className="h-16" />;
  const pending = list.data.filter((c) => c.status === 'PENDING').length;
  const rows = list.data.filter((c) => (f === 'all' ? true : f === 'PENDING' ? c.status === 'PENDING' : c.status !== 'PENDING'));
  const decide = (c: AdminClaimRow, d: 'approve' | 'reject') => {
    if (d === 'approve' && !c.samePhone && !window.confirm('Les numéros sont différents. As-tu vérifié par téléphone que c’est bien le vendeur ?')) return;
    void reviewClaim(c.id, d).then(() => { toast(d === 'approve' ? 'Fiche rattachée au compte' : 'Demande refusée', 'success'); void list.reload(); })
      .catch((e) => toast(errorMessage(e), 'error'));
  };

  const cols: Column<AdminClaimRow>[] = [
    { key: 'v', label: 'Fiche vendeur', render: (c) => <><Link href={`/dashboard/vendors/${c.vendor.id}`} className="font-bold text-charbon">{c.vendor.contactName ?? c.vendor.name}</Link>
      <span className="block text-xs text-ardoise">{c.vendor.points.join(', ')} · {c.vendor.phone}</span></> },
    { key: 'u', label: 'Compte demandeur', render: (c) => <><b className="block">{c.requester.name}</b><span className="text-xs text-ardoise">{c.requester.phone}</span></> },
    { key: 'm', label: 'Vérification', render: (c) => (c.byCode ? <Pill tone="ok">code de l’agent</Pill>
      : c.samePhone ? <Pill tone="ok">même numéro</Pill> : <Pill tone="bad">numéro différent</Pill>) },
    { key: 'd', label: 'Demande', render: (c) => ago(c.createdAt) },
    { key: 's', label: 'Statut', render: (c) => <span className="flex flex-col gap-0.5"><Pill tone={STATUS[c.status][1]}>{STATUS[c.status][0]}</Pill>
      {c.reviewedBy && c.status !== 'PENDING' && <span className="text-xs text-ardoise">par {c.reviewedBy}</span>}</span> },
    { key: 'a', label: '', render: (c) => (c.status === 'PENDING' ? <span className="flex gap-3 whitespace-nowrap">
      <button type="button" className="text-sm font-bold text-feuille underline" onClick={() => decide(c, 'approve')}>Accepter</button>
      <button type="button" className="text-sm font-semibold text-ardoise underline" onClick={() => decide(c, 'reject')}>Refuser</button></span> : null) },
  ];

  return (
    <>
      <div className="flex flex-col gap-2">
        <Crumbs items={['Terrain', 'Rattachements']} />
        <PageHead title="Demandes de rattachement"
          sub="Un vendeur créé par un agent récupère sa fiche : avec le code de l’agent (immédiat) ou par une demande depuis son compte, à accepter ici." />
      </div>
      <Card title="Demandes" flush right={<span className="text-[13px] text-ardoise">{pending} en attente</span>}>
        <div className="px-5 pb-4">
          <FilterChips value={f} onChange={setF} options={[['PENDING', `En attente (${pending})`], ['done', 'Traitées'], ['all', 'Toutes']]} />
        </div>
        {/* Mobile : cartes */}
        <div className="flex flex-col gap-3 px-4 md:hidden">
          {rows.length ? rows.map((c) => (
            <div key={c.id} className="flex flex-col gap-2 rounded-2xl border border-[#E7E5E4] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/dashboard/vendors/${c.vendor.id}`} className="block font-bold text-charbon">{c.vendor.contactName ?? c.vendor.name}</Link>
                  <span className="text-xs text-ardoise">{c.vendor.points.join(', ')} · {c.vendor.phone}</span>
                </div>
                <Pill tone={STATUS[c.status][1]}>{STATUS[c.status][0]}</Pill>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div><b className="block text-xs">{c.requester.name}</b><span className="text-xs text-ardoise">{c.requester.phone}</span></div>
                {c.byCode ? <Pill tone="ok">code agent</Pill> : c.samePhone ? <Pill tone="ok">même n°</Pill> : <Pill tone="bad">n° différent</Pill>}
              </div>
              <div className="flex items-center justify-between text-xs text-ardoise">
                <span>{ago(c.createdAt)}</span>
                {c.status === 'PENDING' && <span className="flex gap-3">
                  <button type="button" className="font-bold text-feuille underline" onClick={() => decide(c, 'approve')}>Accepter</button>
                  <button type="button" className="font-semibold text-ardoise underline" onClick={() => decide(c, 'reject')}>Refuser</button>
                </span>}
              </div>
            </div>
          )) : <p className="py-6 text-center text-sm text-ardoise">Aucune demande.</p>}
        </div>
        {/* Desktop : tableau */}
        <div className="hidden md:block">
          <DataTable bare columns={cols} rows={rows} empty="Aucune demande." />
        </div>
        <p className="m-0 border-t border-[#E7E5E4] px-5 py-4 text-[13px] text-ardoise">
          Accepte si le numéro du compte est celui de la fiche. Sinon, appelle le numéro de la fiche avant d’accepter, ou envoie plutôt un code depuis la fiche du vendeur.
        </p>
      </Card>
    </>
  );
}
