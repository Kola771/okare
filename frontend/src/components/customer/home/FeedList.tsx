'use client';

/** Liste du fil avec tous ses états : chargement, erreur, hors connexion, vide, pagination. */
import type { FeedItem } from '@/lib/api';
import { useViewer } from '@/components/providers/ViewerProvider';
import { EmptyState, ErrorState, LoadingList } from '@/components/ui/States';
import type { ContactSource } from '@/shared/enums';
import { FavoritesStrip } from './FavoritesStrip';
import { FeedCard, FeedCardFeatured, FeedRow } from './FeedCards';
import type { useFeed } from './useFeed';

interface Props {
  feed: ReturnType<typeof useFeed>;
  hoveredId?: string | null;
  onHover?: (posId: string | null) => void;
  /** Affiche le bloc des favoris dans la liste mobile (accueil). */
  withFavorites?: boolean;
  source?: ContactSource;
  emptyText?: string;
}

export function FeedList({ feed, hoveredId, onHover, withFavorites = false, source = 'HOME', emptyText }: Props) {
  const { openNow, setOpenNow, budgetMin, budgetMax, setBudget, setBudgetRange } = useViewer();
  if (feed.loading) return <LoadingList count={4} className="h-32" />;
  if (feed.error) return <ErrorState message={feed.error} onRetry={feed.reload} />;
  if (!feed.items.length) {
    return (
      <EmptyState
        title="Rien pour l’instant avec ces filtres"
        text={emptyText ?? (openNow ? 'Les points ouverts près de toi n’ont pas de plat dans ce budget. Essaie sans « ouvert maintenant » ou avec un budget plus large.' : 'Essaie un budget plus large ou une autre zone.')}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {openNow && <button onClick={() => setOpenNow(false)} className="min-h-11 rounded-btn bg-charbon px-4 text-sm font-bold text-white">Voir aussi les points fermés</button>}
            {(budgetMax != null || budgetMin != null) && <button onClick={() => { setBudget(null); }} className="min-h-11 rounded-btn border border-bordure px-4 text-sm font-bold">Tous les budgets</button>}
          </div>
        }
      />
    );
  }

  const more = feed.hasMore && (
    <button type="button" onClick={feed.loadMore} disabled={feed.loadingMore}
      className="min-h-12 justify-self-center rounded-[14px] border border-bordure-douce bg-surface px-6 text-sm font-bold disabled:opacity-60">
      {feed.loadingMore ? 'Chargement…' : `Voir ${feed.total - feed.items.length} autres points`}
    </button>
  );

  return (
    <>
      {/* Mobile < 768 px : une grande carte puis des lignes compactes (écran 1). */}
      <div className="flex flex-col gap-3.5 md:hidden">
        {feed.items.map((it: FeedItem, i) => (
          <div key={it.pos.id} className="contents">
            {i === 0 ? <FeedCardFeatured item={it} priority /> : <FeedRow item={it} />}
            {withFavorites && i === Math.min(1, feed.items.length - 1) && <FavoritesStrip />}
          </div>
        ))}
      </div>
      {/* Tablette et desktop : cartes en grille avec boutons liés au plat (D1). */}
      <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {feed.items.map((it, i) => (
          <FeedCard key={it.pos.id} item={it} selected={hoveredId === it.pos.id} onHover={onHover} priority={i === 0} source={source} />
        ))}
      </div>
      {more && <div className="grid">{more}</div>}
    </>
  );
}
