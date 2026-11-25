'use client';

/** Colonne de droite de DB3 : Aujourd'hui (fermer pour la journée), QR code, Gestion (vendeur, agent, statut). */
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { errorMessage, moderatePos, setDayStatus, type ManagedPos, type ModerationAction, type PosSheet } from '@/lib/api';
import { Pill } from '@/components/admin/AdminParts';
import { Card } from '@/components/admin/Card';
import { useToast } from '@/components/providers/ToastProvider';
import { OpenBadge } from '@/components/ui/Badges';
import { qrBase, qrUrl } from '@/components/seller/points/QrPanel';

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Porto-Novo' }).replace(':', 'h');
const linkCls = 'text-left text-[13px] font-semibold text-piment underline';

export function SheetSide({ pos, sheet, onChange }: { pos: ManagedPos; sheet: PosSheet; onChange: () => void }) {
  const toast = useToast();
  const closed = !!pos.todayOverride?.isClosed;
  const day = () => setDayStatus(pos.id, closed ? null : { isClosed: true })
    .then(() => { toast(closed ? 'Rouvert pour aujourd’hui' : 'Marqué fermé aujourd’hui', 'success'); onChange(); }).catch((e) => toast(errorMessage(e), 'error'));
  const act = (a: ModerationAction) => {
    const reason = a === 'suspend' ? window.prompt('Motif de la suspension (obligatoire) :') ?? '' : undefined;
    if (a === 'suspend' && !reason) return;
    void moderatePos(pos.id, a, reason).then(() => { toast('Statut mis à jour', 'success'); onChange(); }).catch((e) => toast(errorMessage(e), 'error'));
  };

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <Card title="Aujourd’hui">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <OpenBadge status={pos.openStatus} />
          <span className="text-[13px] text-ardoise">{sheet.specialPublishedAt ? `plat du jour publié ${hhmm(sheet.specialPublishedAt)}` : 'pas de plat du jour'}</span>
        </div>
        <button type="button" onClick={day}
          className={`mt-4 min-h-11 w-full rounded-xl border text-sm font-bold ${closed ? 'border-trait text-charbon' : 'border-[#FECACA] text-erreur'}`}>
          {closed ? 'Rouvrir aujourd’hui' : 'Marquer fermé aujourd’hui'}</button>
      </Card>
      <Card title="QR code">
        <div className="flex items-center gap-4">
          <span className="rounded-xl border border-trait p-2"><QRCodeSVG value={qrUrl(pos.qrCode)} size={100} marginSize={0} /></span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <b className="text-[13px]">{qrBase()}{pos.qrCode}</b>
            <span className="text-[13px] text-ardoise">{pos.qrScans7d} scans cette semaine</span>
            <Link href={`/dashboard/points/${pos.id}?tab=qr`} className={linkCls}>Télécharger l’affiche A5</Link>
            <button type="button" className={linkCls} onClick={() => toast('Demande de réimpression envoyée à l’agent de la zone.', 'success')}>Réimprimer l’autocollant</button>
          </div>
        </div>
      </Card>
      <Card title="Gestion">
        <div className="flex flex-col gap-2.5 text-sm">
          <div className="flex flex-wrap items-center gap-2">Vendeur : <Link href={`/dashboard/vendors/${sheet.vendor.id}`} className="font-bold text-charbon">{sheet.vendor.name}</Link>
            <Pill tone={sheet.vendor.hasAccount ? 'ok' : 'neutral'}>{sheet.vendor.hasAccount ? 'a un compte' : 'sans compte'}</Pill></div>
          <div>Agent référent : <b>{sheet.agentName ?? '—'}</b></div>
          <p className="m-0 text-[13px] leading-snug text-ardoise">Le vendeur et les agents de la zone peuvent modifier ce point. Chaque modification est signée dans l’historique.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-trait pt-3">
            {pos.status === 'PUBLISHED' && <button type="button" className={linkCls} onClick={() => act('hold')}>Mettre en attente</button>}
            {pos.status === 'PENDING' && <button type="button" className={linkCls} onClick={() => act('publish')}>Remettre en ligne</button>}
            {pos.status === 'PUBLISHED' && <button type="button" className={linkCls} onClick={() => act('suspend')}>Suspendre</button>}
            {pos.status === 'SUSPENDED' && <button type="button" className={linkCls} onClick={() => act('reactivate')}>Réactiver</button>}
            {pos.status !== 'ARCHIVED' && <button type="button" className="text-[13px] font-semibold text-ardoise underline" onClick={() => act('archive')}>Archiver</button>}
          </div>
        </div>
      </Card>
    </div>
  );
}
