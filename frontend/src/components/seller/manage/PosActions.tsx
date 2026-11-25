'use client';

/** Actions d'un point : « Mettre en attente » / « Remettre en ligne » et « Supprimer » (suppression douce, 12.7). */
import { PauseCircle, PlayCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deletePos, errorMessage, moderatePos } from '@/lib/api';
import { useToast } from '@/components/providers/ToastProvider';
import { Sheet } from '@/components/ui/Sheet';

export function PosActions({ posId, status, compact = false }: { posId: string; status: string; compact?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const pending = status === 'PENDING';

  async function run(fn: () => Promise<unknown>, ok: string, after?: string) {
    setBusy(true);
    try {
      await fn();
      toast(ok, 'success');
      if (after) router.push(after);
      router.refresh();
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  const base = `inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold disabled:opacity-60 ${compact ? '' : 'w-full'}`;
  return (
    <>
      <div className={compact ? 'flex flex-wrap gap-2' : 'flex flex-col gap-2'}>
        <button type="button" disabled={busy} className={`${base} border border-trait bg-surface text-charbon`}
          onClick={() => run(() => moderatePos(posId, pending ? 'publish' : 'hold'), pending ? 'Point remis en ligne' : 'Point mis en attente : masqué aux clients')}>
          {pending ? <PlayCircle size={16} /> : <PauseCircle size={16} />}{pending ? 'Remettre en ligne' : 'Mettre en attente'}</button>
        <button type="button" disabled={busy} onClick={() => setConfirm(true)} className={`${base} border border-[#FECACA] bg-surface font-bold text-erreur hover:bg-erreur-soft`}>
          <Trash2 size={16} />{compact ? 'Supprimer' : 'Supprimer ce point de vente'}</button>
      </div>
      <Sheet open={confirm} onClose={() => setConfirm(false)} labelledBy="delete-pos-title" maxWidth="lg:max-w-[420px]">
        <h2 id="delete-pos-title" className="m-0 font-display text-[22px] font-extrabold">Supprimer ce point de vente&nbsp;?</h2>
        <p className="m-0 text-[15px] text-ardoise">Il disparaît pour les clients. L’équipe OKARE peut le restaurer pendant 30 jours. Tes statistiques sont gardées.</p>
        <div className="flex gap-2.5">
          <button type="button" onClick={() => setConfirm(false)} className="min-h-[50px] flex-1 rounded-[14px] border border-bordure font-bold">Annuler</button>
          <button type="button" disabled={busy} onClick={() => run(() => deletePos(posId), 'Point de vente supprimé', '/seller/points')}
            className="min-h-[50px] flex-1 rounded-[14px] bg-erreur font-bold text-white">Supprimer</button>
        </div>
      </Sheet>
    </>
  );
}
