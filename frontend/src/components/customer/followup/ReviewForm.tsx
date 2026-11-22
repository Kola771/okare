'use client';

/** Invitation à laisser un avis après un « Oui » (9.6) : note 1 à 5 obligatoire, commentaire facultatif. */
import { Star } from 'lucide-react';
import { useState } from 'react';
import { createReview, errorMessage } from '@/lib/api';

export function ReviewForm({ contactId, onDone }: { contactId: string; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!rating) {
      setError('Choisis une note de 1 à 5 étoiles.');
      return;
    }
    setBusy(true);
    try {
      await createReview({ contactId, rating, comment: comment.trim() || undefined });
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-[14px] bg-sable p-3.5">
      <div className="text-sm font-bold">Ton avis aide les autres clients</div>
      <div className="flex gap-1" role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
            onClick={() => { setRating(n); setError(null); }} className="flex h-11 w-11 items-center justify-center">
            <Star size={28} className={n <= rating ? 'fill-mais text-mais' : 'text-bordure'} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value.slice(0, 500))} rows={2}
        placeholder="Un mot sur le plat ou l'accueil (facultatif)" aria-label="Commentaire"
        className="rounded-xl border border-bordure-douce bg-white p-3 text-[15px] outline-none" />
      {error && <div role="alert" className="text-[13px] font-semibold text-erreur">{error}</div>}
      <button type="button" onClick={submit} disabled={busy} className="min-h-12 rounded-[14px] bg-charbon font-bold text-white disabled:opacity-60">
        {busy ? 'Envoi…' : 'Publier mon avis'}
      </button>
    </div>
  );
}
