'use client';

/**
 * Écrans 10 / D6 (contact d'un plat : « t'a-t-il répondu ? » seulement) et 10b / D6b (contact du point de vente :
 * puis « Tu as pris quoi ? »). Après « Oui » : avis et favoris ; après « Non » : 2 autres points proches.
 */
import { Heart, Store } from 'lucide-react';
import { useState } from 'react';
import { answerFollowUp, errorMessage, type PendingFollowUp } from '@/lib/api';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { DishImage } from '@/components/ui/DishImage';
import { Sheet } from '@/components/ui/Sheet';
import type { FollowUpAnswer } from '@/shared/enums';
import { formatHour } from '@/shared/format';
import { toLocal } from '@/shared/time';
import { AnswerButtons, DishPicker } from './FollowUpParts';
import { NoAnswerSuggestions } from './NoAnswerSuggestions';
import { ReviewForm } from './ReviewForm';

function whenLabel(iso: string): string {
  const local = toLocal(new Date(iso));
  const today = toLocal(new Date()).date;
  const hm = `${String(Math.floor(local.minutes / 60)).padStart(2, '0')}:${String(local.minutes % 60).padStart(2, '0')}`;
  return `${local.date === today ? "aujourd'hui" : 'le ' + local.date.split('-').reverse().slice(0, 2).join('/')} à ${formatHour(hm)}`;
}

export function FollowUpSheet({ followUp, onClose }: { followUp: PendingFollowUp; onClose: () => void }) {
  const toast = useToast();
  const { isFavorite, toggle } = useFavorites();
  const [answer, setAnswer] = useState<FollowUpAnswer | null>(null);
  const [sent, setSent] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [other, setOther] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const shortName = followUp.posName.split(' · ')[0];
  const fav = isFavorite(followUp.posId);

  async function send(a: FollowUpAnswer, extra: { orderedDishIds?: string[]; other?: boolean } = {}) {
    try {
      await answerFollowUp(followUp.contactId, { answer: a, ...extra });
      setSent(true);
      if (a === 'NOT_YET') {
        toast('D’accord, on te redemandera plus tard.');
        onClose();
      }
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  }

  function choose(a: FollowUpAnswer) {
    setAnswer(a);
    // Contact du point de vente + « Oui » : on attend « Tu as pris quoi ? » avant d'envoyer.
    if (a === 'YES' && followUp.askDish) return;
    void send(a);
  }

  return (
    <Sheet open onClose={onClose} labelledBy="followup-title">
      <div className="flex items-center gap-3 lg:mr-11">
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] ${followUp.dish ? '' : 'bg-piment-soft text-piment'}`}>
          {followUp.dish ? <DishImage illustrationKey={followUp.dish.illustrationKey} alt="" /> : <Store size={24} />}
        </span>
        <div className="text-[13px] leading-snug text-ardoise">
          {followUp.dish ? (
            <>Tu as commandé <b className="text-charbon">{followUp.dish.name}</b><br />chez {followUp.posName}, {whenLabel(followUp.createdAt)}</>
          ) : (
            <>Tu as écrit à <b className="text-charbon">{followUp.posName}</b><br />{whenLabel(followUp.createdAt)}, sans choisir de plat</>
          )}
        </div>
      </div>
      <div>
        <h2 id="followup-title" className="m-0 font-display text-[22px] font-extrabold leading-tight">{shortName} t’a répondu&nbsp;?</h2>
        <p className="m-0 mt-1 text-[13px] text-ardoise">Ta réponse aide tout le monde à trouver des vendeurs sérieux.</p>
      </div>
      <AnswerButtons value={answer} onChoose={choose} disabled={sent} />

      {followUp.dish && !sent && (
        <div className="rounded-xl bg-sable px-3 py-2.5 text-xs text-ardoise">On sait déjà quel plat tu as choisi : pas d’autre question.</div>
      )}
      {followUp.askDish && answer === 'YES' && !sent && (
        <DishPicker menu={followUp.menu} picked={picked} other={other} onToggle={(id) =>
          setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
          onOther={() => setOther((o) => !o)} onSubmit={() => void send('YES', { orderedDishIds: picked, other })} />
      )}
      {sent && answer === 'YES' && !reviewed && <ReviewForm contactId={followUp.contactId} onDone={() => { setReviewed(true); toast('Merci pour ton avis !', 'success'); }} />}
      {sent && answer === 'NO' && <NoAnswerSuggestions excludePosId={followUp.posId} onNavigate={onClose} />}

      <div className="h-px bg-trait" />
      {!fav ? (
        <button type="button" onClick={() => toggle(followUp.posId, shortName)}
          className="flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-piment-soft text-[15px] font-bold text-piment">
          <Heart size={18} /> Ajouter {shortName} aux favoris
        </button>
      ) : (
        <button type="button" onClick={onClose} className="min-h-12 rounded-[14px] border border-bordure text-[15px] font-bold">Fermer</button>
      )}
    </Sheet>
  );
}
