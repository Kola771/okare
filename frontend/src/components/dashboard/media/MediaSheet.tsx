'use client';

/** Détail d'une photo (DB11) : aperçu, informations ; publier, refuser (motif), associer à un point, supprimer. */
import { useState } from 'react';
import { assignMedia, deleteMedia, errorMessage, reviewMedia, type AdminPosRow, type MediaRow } from '@/lib/api';
import { btn, Pill } from '@/components/admin/AdminParts';
import { Field, inputCls } from '@/components/admin/Controls';
import { useToast } from '@/components/providers/ToastProvider';
import { Sheet } from '@/components/ui/Sheet';
import { MediaThumb, STATE } from './MediaTile';

export function MediaSheet({ m, points, onClose, onDone }: { m: MediaRow | null; points: AdminPosRow[]; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [posId, setPosId] = useState('');
  const [kind, setKind] = useState<'FACADE' | 'OTHER'>('FACADE');
  const run = (p: Promise<unknown>, ok: string) => p.then(() => { toast(ok, 'success'); onClose(); onDone(); }).catch((e) => toast(errorMessage(e), 'error'));
  if (!m) return null;
  const reject = () => {
    const reason = window.prompt('Motif du refus (envoyé au vendeur) :', 'Photo floue');
    if (reason) void run(reviewMedia(m.id, 'reject', reason), 'Photo refusée');
  };
  const line = (k: string, v: React.ReactNode) => <div className="flex justify-between gap-3 border-t border-trait py-2 text-sm first:border-0"><span className="text-ardoise">{k}</span><b className="text-right">{v}</b></div>;

  return (
    <Sheet open onClose={onClose} labelledBy="media-title" maxWidth="lg:max-w-[560px]">
      <h2 id="media-title" className="m-0 break-all font-bold">{m.fileName}</h2>
      <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl"><MediaThumb m={m} /></div>
      <div>
        {line('Statut', <Pill tone={STATE[m.state][1]}>{STATE[m.state][0]}</Pill>)}
        {line('Point de vente', m.owner)}
        {line('Type', m.kind === 'DISH' ? 'Plat' : m.kind === 'FACADE' ? 'Façade' : 'Autre photo')}
        {line('Envoyée par', `${m.source === 'WHATSAPP' ? 'WhatsApp · ' : ''}${m.uploadedBy} · ${new Date(m.createdAt).toLocaleDateString('fr-FR')}`)}
        {line('Poids', `${m.sizeKb} Ko`)}
        {m.rejectionReason && line('Motif du refus', m.rejectionReason)}
      </div>
      {m.unassigned ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-surface-inset p-4">
          <b className="text-sm">Associer à un point de vente</b>
          <Field label="Point de vente">
            <select className={inputCls} value={posId} onChange={(e) => setPosId(e.target.value)}>
              <option value="">Choisir…</option>{points.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.zoneName}</option>)}
            </select>
          </Field>
          <div className="flex gap-2">{(['FACADE', 'OTHER'] as const).map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}
              className={`min-h-10 flex-1 rounded-xl text-sm font-bold ${kind === k ? 'bg-inverse text-on-inverse' : 'border border-trait bg-surface'}`}>{k === 'FACADE' ? "Photo de l’entrée" : 'Autre photo'}</button>))}
          </div>
          <button type="button" className={btn.primary} disabled={!posId} onClick={() => run(assignMedia(m.id, posId, kind), 'Photo associée au point de vente')}>Associer</button>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {m.state !== 'PUBLISHED' && <button type="button" className={btn.primary} onClick={() => run(reviewMedia(m.id, 'approve'), 'Photo publiée')}>Publier</button>}
          {m.state !== 'REJECTED' && <button type="button" className={btn.secondary} onClick={reject}>Refuser</button>}
        </div>
      )}
      <button type="button" className="self-center text-[13px] font-semibold text-erreur underline" onClick={() => window.confirm('Supprimer cette photo ?') && run(deleteMedia(m.id), 'Photo supprimée')}>
        Supprimer la photo</button>
    </Sheet>
  );
}
