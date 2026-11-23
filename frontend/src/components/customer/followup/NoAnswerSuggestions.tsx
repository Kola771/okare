'use client';

/** Après « Non » : 2 autres points proches, dans le même budget (9.5 a). */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getFeed, type FeedItem } from '@/lib/api';
import { useViewer } from '@/components/providers/ViewerProvider';
import { DishImage } from '@/components/ui/DishImage';
import { Price } from '@/components/ui/Badges';
import { formatDistance } from '@/shared/format';

export function NoAnswerSuggestions({ excludePosId, onNavigate }: { excludePosId: string; onNavigate: () => void }) {
  const { zoneId, budgetMin, budgetMax, position } = useViewer();
  const [items, setItems] = useState<FeedItem[] | null>(null);

  useEffect(() => {
    if (!zoneId) return;
    getFeed({ zoneId, budgetMin, budgetMax, lat: position?.lat, lng: position?.lng, limit: 6 })
      .then((p) => setItems(p.items.filter((i) => i.pos.id !== excludePosId).slice(0, 2)))
      .catch(() => setItems([]));
  }, [zoneId, budgetMin, budgetMax, position, excludePosId]);

  if (!items?.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-bold">Désolé. Essaie plutôt :</div>
      {items.map((it) => (
        <Link key={it.pos.id} href={`/p/${it.pos.slug}/dish/${it.dish.slug}`} onClick={onNavigate}
          className="flex items-center gap-3 rounded-[14px] border border-trait p-2 text-charbon no-underline">
          <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-[10px]">
            <DishImage imageUrl={it.dish.imageUrl} illustrationKey={it.dish.illustrationKey} alt="" />
          </span>
          <span className="min-w-0 flex-1">
            <b className="block truncate text-sm">{it.dish.name}</b>
            <span className="text-xs text-ardoise">{it.pos.name}{it.pos.distanceM != null && ` · ${formatDistance(it.pos.distanceM)}`}</span>
          </span>
          <Price xof={it.dish.priceXof} className="text-sm" />
        </Link>
      ))}
    </div>
  );
}
