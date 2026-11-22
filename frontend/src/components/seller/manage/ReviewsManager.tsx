'use client';

/** Avis du point : lecture et réponse publique, modifiable (9.6). Le vendeur ne peut pas supprimer un avis. */
import { Star } from 'lucide-react';
import { useState } from 'react';
import { errorMessage, replyReview, type ManagedReview } from '@/lib/api';
import { btn, Panel } from '@/components/admin/AdminParts';
import { useToast } from '@/components/providers/ToastProvider';
import { EmptyState } from '@/components/ui/States';

function Item({ posId, review }: { posId: string; review: ManagedReview }) {
  const toast = useToast();
  const [reply, setReply] = useState(review.reply ?? '');
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(review.reply);
  return (
    <article className="flex flex-col gap-2 border-t border-trait pt-3 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-2 text-sm"><b>{review.author}</b>
        <span className="inline-flex" aria-label={`${review.rating} sur 5`}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} className={n <= review.rating ? 'fill-mais text-mais' : 'text-bordure'} />)}</span>
        {review.dishName && <span className="text-ardoise">· {review.dishName}</span>}
        <span className="text-xs text-pierre">{new Date(review.createdAt).toLocaleDateString('fr-FR')}</span></div>
      {review.comment && <p className="m-0 text-sm text-encre">{review.comment}</p>}
      {saved && !editing ? (
        <div className="rounded-xl bg-[#F7F6F3] px-3 py-2 text-[13px]"><b>Ta réponse :</b> {saved}
          <button type="button" onClick={() => setEditing(true)} className="ml-2 font-semibold text-piment">Modifier</button></div>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea value={reply} onChange={(e) => setReply(e.target.value.slice(0, 500))} rows={2} placeholder="Répondre publiquement (merci, précision…)"
            aria-label={`Répondre à ${review.author}`} className="rounded-xl border border-[#E7E5E4] p-3 text-sm" />
          <button type="button" disabled={!reply.trim()} className={`${btn.secondary} self-start`}
            onClick={() => replyReview(posId, review.id, reply).then(() => { setSaved(reply.trim()); setEditing(false); toast('Réponse publiée', 'success'); })
              .catch((e) => toast(errorMessage(e), 'error'))}>Publier la réponse</button>
        </div>
      )}
    </article>
  );
}

export function ReviewsManager({ posId, reviews }: { posId: string; reviews: ManagedReview[] }) {
  if (!reviews.length) return <EmptyState title="Pas encore d’avis" text="Seuls les clients qui t’ont contacté et ont confirmé ta réponse peuvent laisser un avis." />;
  const avg = Math.round((reviews.reduce((n, r) => n + r.rating, 0) / reviews.length) * 10) / 10;
  return (
    <Panel title={`${reviews.length} avis · ${String(avg).replace('.', ',')} / 5`}
      sub={reviews.length < 5 ? 'La note sera affichée aux clients à partir de 5 avis.' : 'Ta note est affichée sur ta page.'}>
      {reviews.map((r) => <Item key={r.id} posId={posId} review={r} />)}
    </Panel>
  );
}
