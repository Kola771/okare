'use client';

/** Chargement du fil (accueil, recherche) avec pagination par curseur et états chargement / erreur. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage, getFeed, type FeedItem, type FeedPage, type FeedQuery } from '@/lib/api';
import { useViewer } from '@/components/providers/ViewerProvider';

export interface FeedFilters {
  moment?: FeedQuery['moment'];
  categoryId?: string;
  q?: string;
}

/** `initial` = première page calculée par le serveur : pas de chargement au premier affichage (spec 0ter.9). */
export function useFeed(filters: FeedFilters, limit = 12, initial?: FeedPage) {
  const { zoneId, position, budgetMax, openNow, ready } = useViewer();
  const [items, setItems] = useState<FeedItem[]>(initial?.items ?? []);
  const [total, setTotal] = useState(initial?.total ?? 0);
  const [cursor, setCursor] = useState<string | null>(initial?.nextCursor ?? null);
  const [loading, setLoading] = useState(!initial);
  const skipFirst = useRef(!!initial);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useCallback((c?: string): FeedQuery | null => (zoneId ? {
    zoneId, lat: position?.lat, lng: position?.lng, budgetMax, openNow, limit, cursor: c,
    moment: filters.moment, categoryId: filters.categoryId, q: filters.q || undefined,
  } : null), [zoneId, position, budgetMax, openNow, limit, filters.moment, filters.categoryId, filters.q]);

  const load = useCallback(async () => {
    const q = query();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const page = await getFeed(q);
      setItems(page.items);
      setTotal(page.total);
      setCursor(page.nextCursor);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (ready) void load();
  }, [ready, load]);

  const loadMore = useCallback(async () => {
    const q = cursor ? query(cursor) : null;
    if (!q) return;
    setLoadingMore(true);
    try {
      const page = await getFeed(q);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, query]);

  return { items, total, loading: loading || !ready, loadingMore, error, hasMore: !!cursor, reload: load, loadMore };
}
