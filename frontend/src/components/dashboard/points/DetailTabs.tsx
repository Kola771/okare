'use client';

/** Onglets « Pubs » et « Historique » de la fiche DB3. Pubs : exemples d'affichage, aucun paiement réel en phase 1. */
import { getPosAds, getPosHistory, type AdRow } from '@/lib/api';
import { btn, Panel, Pill } from '@/components/admin/AdminParts';
import { Card } from '@/components/admin/Card';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { useApi } from '@/components/admin/useApi';
import { useToast } from '@/components/providers/ToastProvider';
import { LoadingList } from '@/components/ui/States';
import { shortDate } from './SheetInfo';

const PLAN: Record<AdRow['plan'], string> = { DAY: 'Un jour', PERIOD: 'Période', MONTH: 'Un mois', PREMIUM: 'Premium' };
const STATUS: Record<AdRow['status'], [string, 'ok' | 'warn' | 'neutral']> = {
  ACTIVE: ['En cours', 'ok'], PENDING_PAYMENT: ['Paiement à confirmer', 'warn'], EXPIRED: ['Terminée', 'neutral'],
};
const fcfa = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n).replace(/ /g, ' ')} F`;

const COLS: Column<AdRow>[] = [
  { key: 'p', label: 'Formule', render: (a) => <b>{PLAN[a.plan]}</b> },
  { key: 'd', label: 'Dates', render: (a) => (a.start === a.end ? shortDate(a.start) : `${shortDate(a.start)} → ${shortDate(a.end)}`) },
  { key: 'z', label: 'Zones ciblées', render: (a) => a.zones.join(', ') },
  { key: 'm', label: 'Montant', render: (a) => <b className="text-feuille">{fcfa(a.amountXof)}</b> },
  { key: 's', label: 'Statut', render: (a) => <Pill tone={STATUS[a.status][1]}>{STATUS[a.status][0]}</Pill> },
];

export function AdsTab({ posId }: { posId: string }) {
  const toast = useToast();
  const ads = useApi(() => getPosAds(posId), [posId]);
  if (!ads.data) return <LoadingList count={2} className="h-24" />;
  const send = () => toast('Lien de paiement FedaPay : branché avec le backend.', 'success');
  return (
    <div className="flex flex-col gap-5">
      <Card title="Mise en avant" right={<span className="flex flex-wrap gap-2">
        <button type="button" className={btn.secondary} onClick={send}>Envoyer un lien de paiement</button>
        <button type="button" className={btn.primary} onClick={send}>+ Nouvelle pub</button></span>}>
        <p className="m-0 text-sm text-ardoise">Le point remonte en tête des listes dans les zones ciblées, pendant les jours payés. Places limitées par zone et par jour.</p>
      </Card>
      <Card title="Pubs de ce point" flush>
        <DataTable bare columns={COLS} rows={ads.data} empty="Aucune pub pour ce point." />
      </Card>
    </div>
  );
}

export function HistoryTab({ posId }: { posId: string }) {
  const h = useApi(() => getPosHistory(posId), [posId]);
  return (
    <Panel title="Historique" sub="Journal d’audit de ce point et de ses plats (lecture seule).">
      {!h.data?.length ? <p className="m-0 text-sm text-ardoise">Aucune modification enregistrée.</p> : (
        <ul className="m-0 flex list-none flex-col divide-y divide-trait p-0">{h.data.map((e) => (
          <li key={e.id} className="flex justify-between gap-3 py-2.5 text-sm"><span><b>{e.who}</b> · {e.action}</span><span className="text-ardoise">{new Date(e.at).toLocaleString('fr-FR')}</span></li>))}</ul>
      )}
    </Panel>
  );
}
