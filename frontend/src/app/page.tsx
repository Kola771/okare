import { HomeScreen } from '@/components/customer/home/HomeScreen';
import { ClientShell } from '@/components/customer/layout/ClientShell';
import { getDishCategories, getFeed, type FeedPage } from '@/lib/api';
import { readViewer } from '@/lib/viewer-server';
import { mockClock } from '@/lib/clock-server';
import { momentOfDay, toLocal } from '@/shared/time';

/** Écran 1 (mobile) et D1 (desktop) : la première page du fil est calculée sur le serveur. */
export default async function HomePage() {
  const [{ prefs, point }, clock] = await Promise.all([readViewer(), mockClock()]);
  const moment = momentOfDay(clock);
  const empty: FeedPage = { items: [], total: 0, nextCursor: null };
  const [feed, categories] = await Promise.all([
    prefs.zoneId ? getFeed({ zoneId: prefs.zoneId, lat: point?.lat, lng: point?.lng, budgetMin: prefs.budgetMin, budgetMax: prefs.budgetMax, openNow: prefs.openNow, moment, limit: 12 })
      .catch(() => empty) : empty,
    getDishCategories().catch(() => []),
  ]);
  return (
    <ClientShell>
      {/* Tuiles de la carte : connexion ouverte à l'avance (affichage plus rapide de la carte). */}
      <link rel="preconnect" href="https://a.tile.openstreetmap.org" crossOrigin="" />
      <HomeScreen initialFeed={feed} initialMoment={moment} weekday={toLocal(clock).weekday} categories={categories} />
    </ClientShell>
  );
}
