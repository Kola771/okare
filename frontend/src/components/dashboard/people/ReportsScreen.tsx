'use client';

/** Signalements — DB9 : fraude, santé, contenu choquant = masquage immédiat ; autres motifs = vérification (9.7). */
import { useState } from 'react';
import { errorMessage, listReports, resolveReport, type AdminReportRow } from '@/lib/api';
import { btn, PageHead, Panel, Pill } from '@/components/admin/AdminParts';
import { DataTable, FilterChips, type Column } from '@/components/admin/DataTable';
import { useApi } from '@/components/admin/useApi';
import { useToast } from '@/components/providers/ToastProvider';
import { ErrorState, LoadingList } from '@/components/ui/States';
import { REPORT_REASON_LABEL, POS_TYPE_LABEL, type PosType } from '@/shared/enums';

type F = 'open' | 'FRAUD' | 'FOOD_SAFETY' | 'CLOSED_TODAY' | 'WRONG_PRICE' | 'NO_ANSWER' | 'done';
const urgent = (r: AdminReportRow) => r.reason === 'FRAUD' || r.reason === 'FOOD_SAFETY' || r.reason === 'INAPPROPRIATE';

export function ReportsScreen() {
  const toast = useToast();
  const list = useApi(listReports, []);
  const [f, setF] = useState<F>('open');
  const [sel, setSel] = useState<AdminReportRow | null>(null);
  const [note, setNote] = useState('');
  if (list.error) return <ErrorState message={list.error} onRetry={list.reload} />;
  if (list.loading || !list.data) return <LoadingList count={4} className="h-14" />;
  const rows = list.data.filter((r) => (f === 'open' ? r.status === 'OPEN' : f === 'done' ? r.status !== 'OPEN' : r.reason === f && r.status === 'OPEN'));
  const cols: Column<AdminReportRow>[] = [
    { key: 'p', label: 'Point de vente', render: (r) => <><b>{r.posName}</b><span className="block text-xs text-ardoise">{POS_TYPE_LABEL[r.posType as PosType] ?? ''} · {r.zone}</span></> },
    { key: 'm', label: 'Motif', render: (r) => <Pill tone={urgent(r) ? 'bad' : 'warn'}>{REPORT_REASON_LABEL[r.reason]}</Pill> },
    { key: 'd', label: 'Détail', render: (r) => <span className="text-ardoise">{r.comment ? `« ${r.comment.slice(0, 50)} »` : '—'}</span> },
    { key: 'r', label: 'Reçu', render: (r) => new Date(r.at).toLocaleDateString('fr-FR') },
    { key: 'e', label: 'Effet', render: (r) => (r.status === 'OPEN' ? r.effect : r.status === 'RESOLVED' ? 'Résolu' : 'Rejeté') },
  ];
  async function close(status: 'RESOLVED' | 'REJECTED') {
    if (!sel) return;
    await resolveReport(sel.id, status, note || (status === 'RESOLVED' ? 'Traité' : 'Non fondé')).then(() => { toast('Signalement traité, le client est prévenu.', 'success'); setSel(null); setNote(''); void list.reload(); })
      .catch((e) => toast(errorMessage(e), 'error'));
  }
  return (
    <>
      <PageHead title="Signalements" sub="Fraude et santé : masquage immédiat. Autres motifs : vérification par l’équipe." />
      <FilterChips value={f} onChange={setF} options={[['open', `Ouverts (${list.data.filter((r) => r.status === 'OPEN').length})`], ['FRAUD', 'Fraude'], ['FOOD_SAFETY', 'Santé'],
        ['CLOSED_TODAY', 'Fermé aujourd’hui'], ['WRONG_PRICE', 'Prix'], ['NO_ANSWER', 'Pas de réponse'], ['done', 'Traités']]} />
      <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
        {/* Mobile : cartes */}
        <div className="flex flex-col gap-3 md:hidden">
          {rows.length ? rows.map((r) => (
            <button key={r.id} type="button" onClick={() => setSel(r)}
              className={`flex flex-col gap-2 rounded-2xl border p-4 text-left ${sel?.id === r.id ? 'border-piment bg-[#FFF8F5]' : 'border-trait bg-surface'}`}>
              <div className="flex items-start justify-between gap-2">
                <div><b className="block text-sm">{r.posName}</b><span className="text-xs text-ardoise">{POS_TYPE_LABEL[r.posType as PosType] ?? ''} · {r.zone}</span></div>
                <Pill tone={urgent(r) ? 'bad' : 'warn'}>{REPORT_REASON_LABEL[r.reason]}</Pill>
              </div>
              {r.comment && <p className="m-0 text-xs text-ardoise">« {r.comment.slice(0, 80)} »</p>}
              <div className="flex items-center justify-between text-xs text-ardoise">
                <span>{new Date(r.at).toLocaleDateString('fr-FR')}</span>
                <span>{r.status === 'OPEN' ? r.effect : r.status === 'RESOLVED' ? 'Résolu' : 'Rejeté'}</span>
              </div>
            </button>
          )) : <p className="py-6 text-center text-sm text-ardoise">Rien à traiter.</p>}
        </div>
        {/* Desktop : tableau */}
        <div className="hidden md:block">
          <DataTable columns={cols} rows={rows} onRow={setSel} empty="Rien à traiter." />
        </div>
        {sel ? (
          <Panel title={`${REPORT_REASON_LABEL[sel.reason]} · ${sel.posName}`} sub={`Signalé par un client · ${new Date(sel.at).toLocaleString('fr-FR')}`}>
            {sel.comment && <p className="m-0 rounded-xl bg-argile p-3 text-sm">« {sel.comment} »</p>}
            {urgent(sel) && <p className="m-0 text-sm font-semibold text-erreur">Action automatique : point de vente masqué. Règle : appel de l’agent sous 24 h.</p>}
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Note de traitement" aria-label="Note de traitement" className="rounded-xl border border-trait p-3 text-sm" />
            <div className="flex flex-wrap gap-2"><button type="button" className={btn.primary} onClick={() => close('RESOLVED')}>Résolu</button>
              <button type="button" className={btn.secondary} onClick={() => close('REJECTED')}>Rejeter</button></div>
          </Panel>
        ) : <Panel><p className="m-0 text-sm text-ardoise">Choisis un signalement pour le traiter.</p></Panel>}
      </div>
    </>
  );
}
