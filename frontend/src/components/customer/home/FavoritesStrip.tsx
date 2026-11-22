'use client';

/** Bloc « Chez tes favoris aujourd'hui » (13.1) : plats du jour des favoris ouverts maintenant. */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getFavoritesToday, type FavoriteToday } from '@/lib/api';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useSession } from '@/components/providers/SessionProvider';
import { useViewerPoint } from '@/components/providers/ViewerProvider';
import { Price } from '@/components/ui/Badges';
import { isOpenNow } from '@/shared/open-status';

export function FavoritesStrip() {
  const { me } = useSession();
  const { version } = useFavorites();
  const point = useViewerPoint();
  const [items, setItems] = useState<FavoriteToday[]>([]);

  useEffect(() => {
    if (!me) {
      setItems([]);
      return;
    }
    getFavoritesToday(point)
      .then((list) => setItems(list.filter((f) => f.special && isOpenNow(f.pos.openStatus.state))))
      .catch(() => setItems([]));
  }, [me, point, version]);

  if (!items.length) return null;
  return (
    <section className="flex flex-col gap-2 rounded-card bg-piment-soft px-3.5 py-3" aria-labelledby="fav-strip">
      <div className="flex items-baseline justify-between">
        <h2 id="fav-strip" className="m-0 text-[15px] font-bold text-piment-ink">Chez tes favoris aujourd’hui</h2>
        <Link href="/favorites" className="text-[13px] font-semibold">Tout voir</Link>
      </div>
      <div className="flex gap-2">
        {items.slice(0, 2).map((f) => (
          <Link key={f.pos.id} href={`/p/${f.pos.slug}/dish/${f.special!.slug}`}
            className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl bg-white px-2.5 py-2 text-charbon no-underline">
            <b className="truncate text-[13px]">{f.pos.name}</b>
            <span className="truncate text-xs text-ardoise">{f.special!.name}</span>
            <Price xof={f.special!.priceXof} className="text-[13px]" />
          </Link>
        ))}
      </div>
    </section>
  );
}
