'use client';

/** Avis : note et avis visibles seulement à partir de 5 avis publiés (9.6) ; « Tous les avis » charge la suite. */
import { Star } from 'lucide-react';
import { useState } from 'react';
import { getReviews, type ReviewView } from '@/lib/api';

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} className={n <= Math.round(value) ? 'fill-mais text-mais' : 'text-bordure'} />)}
    </span>
  );
}

interface Props {
  slug: string;
  rating: { avg: number; count: number } | null;
  initial: ReviewView[];
}

export function ReviewsBlock({ slug, rating, initial }: Props) {
  const [all, setAll] = useState<ReviewView[] | null>(null);
  const list = all ?? initial;
  return (
    <section className="flex flex-col gap-3 rounded-[20px] border border-trait bg-white px-5 py-4" aria-labelledby="reviews-title">
      <div className="flex items-baseline justify-between">
        <b id="reviews-title" className="text-[17px]">Avis des clients</b>
        {rating && (
          <span className="flex items-center gap-1.5 text-sm font-bold">
            <Star size={16} className="fill-mais text-mais" /> {rating.avg.toFixed(1).replace('.', ',')}
            <span className="font-normal text-ardoise">({rating.count} avis)</span>
          </span>
        )}
      </div>
      {!rating ? (
        <p className="m-0 text-sm text-ardoise">Pas encore assez d’avis. Seuls les clients qui ont commandé peuvent en laisser un.</p>
      ) : (
        <>
          {list.map((r) => (
            <article key={r.id} className="flex flex-col gap-1 border-t border-trait pt-3 first:border-0 first:pt-0">
              <div className="flex items-center gap-2 text-[13px]"><b>{r.authorName}</b><Stars value={r.rating} />
                {r.dishName && <span className="truncate text-ardoise">· {r.dishName}</span>}
              </div>
              {r.comment && <p className="m-0 text-sm leading-normal text-encre">{r.comment}</p>}
              {r.vendorReply && <p className="m-0 rounded-xl bg-sable px-3 py-2 text-[13px] text-ardoise"><b>Réponse du vendeur :</b> {r.vendorReply}</p>}
            </article>
          ))}
          {!all && rating.count > initial.length && (
            <button type="button" onClick={() => getReviews(slug).then(setAll).catch(() => undefined)}
              className="self-start text-sm font-bold text-piment">Tous les avis ({rating.count})</button>
          )}
        </>
      )}
    </section>
  );
}
