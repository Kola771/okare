'use client';

/** « Signaler une erreur ou une fermeture » (9.7) : un signalement par cible, motif et jour. */
import { useState } from 'react';
import { createReport, errorMessage } from '@/lib/api';
import { useSession } from '@/components/providers/SessionProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Sheet } from '@/components/ui/Sheet';
import { REPORT_REASON_LABEL, type ReportReason } from '@/shared/enums';

const REASONS: ReportReason[] = ['CLOSED_TODAY', 'WRONG_PRICE', 'WRONG_HOURS', 'NO_ANSWER', 'WRONG_INFO', 'CLOSED_PERMANENTLY', 'FOOD_SAFETY', 'FRAUD', 'INAPPROPRIATE', 'OTHER'];

export function ReportLink({ posId, posName, dishId }: { posId: string; posName: string; dishId?: string }) {
  const { requireAuth } = useSession();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!reason) return;
    setBusy(true);
    try {
      await createReport({ targetType: dishId ? 'DISH' : 'POS', posId, dishId, reason, comment: comment.trim() || undefined });
      toast('Merci, l’équipe OKARE va vérifier.', 'success');
      setOpen(false);
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => requireAuth({ title: posName, subtitle: 'Signaler un problème', run: () => setOpen(true) })}
        className="self-center text-[13px] text-ardoise underline">
        Signaler une erreur ou une fermeture
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} labelledBy="report-title">
        <h2 id="report-title" className="m-0 font-display text-[22px] font-extrabold">Qu’est-ce qui ne va pas&nbsp;?</h2>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Motif">
          {REASONS.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={reason === r} onClick={() => setReason(r)}
              className={`min-h-10 rounded-full px-3.5 text-sm font-semibold ${reason === r ? 'bg-charbon text-white' : 'border border-bordure-douce bg-surface'}`}>
              {REPORT_REASON_LABEL[r]}
            </button>
          ))}
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value.slice(0, 500))} rows={3} aria-label="Précisions"
          placeholder="Précisions (facultatif)" className="rounded-xl border border-bordure-douce p-3 text-[15px] outline-none" />
        <button type="button" disabled={!reason || busy} onClick={submit}
          className="min-h-[52px] rounded-btn bg-piment font-bold text-white disabled:opacity-50">
          {busy ? 'Envoi…' : 'Envoyer le signalement'}
        </button>
      </Sheet>
    </>
  );
}
