/**
 * API publique (client et visiteur) — section 21 :
 *   GET /geo/zones · GET /geo/locate · GET /feed · GET /search · GET /map · GET /pos/:slug
 *   GET /pos/:slug/dishes/:dishSlug · GET /pos/:slug/reviews
 * Phase 1 : lit les mocks. Phase 3 : remplacer le corps par des appels HTTP, sans changer les signatures.
 */
import 'server-only';
import { db, mockExtras } from '@/mocks';
import type { DishCategory } from '@/shared/types';
import type { DishPage, FeedPage, FeedQuery, MapMarker, PosPage, ReviewView, ZoneOption } from '../dto';
import { ApiError, ERR } from '../errors';
import { coverOf } from './admin-media';
import { computeFeed } from './mock/feed';
import { deviceId, hydrate, mockNow, simulate } from './mock/runtime';
import { businessDate } from '@/shared/time';
import { dishCard, distanceM, findPosBySlug, posSummary, publicPointOf, ratingOf, visibleDishes } from './mock/views';

const PAGE = 12;

export function getZones(_city = 'cotonou'): Promise<ZoneOption[]> {
  return simulate(() => db.zones.filter((z) => z.isActive).map((z) => ({
    id: z.id, name: z.name, code: z.code, center: mockExtras.zoneCenters[z.id],
    neighborhoods: db.neighborhoods.filter((n) => n.zoneId === z.id).map((n) => n.name),
  })));
}

/** Zone qui couvre la position ; hors zones → zone la plus proche (`outside = true`). */
export function locate(lat: number, lng: number): Promise<{ zoneId: string; zoneName: string; outside: boolean }> {
  return simulate(() => {
    // Phase 1 : contours rectangulaires → test de boîte englobante (ST_Covers en phase 2).
    const inside = db.zones.find((z) => {
      const ring = z.boundary?.[0][0];
      if (!ring) return false;
      const lngs = ring.map((p) => p[0]);
      const lats = ring.map((p) => p[1]);
      return lng >= Math.min(...lngs) && lng <= Math.max(...lngs) && lat >= Math.min(...lats) && lat <= Math.max(...lats);
    });
    const nearest = [...db.zones].sort((a, b) =>
      distanceM({ lat, lng }, mockExtras.zoneCenters[a.id]) - distanceM({ lat, lng }, mockExtras.zoneCenters[b.id]))[0];
    const zone = inside ?? nearest;
    return { zoneId: zone.id, zoneName: zone.name, outside: !inside };
  });
}

export function getDishCategories(): Promise<DishCategory[]> {
  return simulate(() => db.dishCategories.filter((c) => c.isActive));
}

function paginate(query: FeedQuery): FeedPage {
  hydrate();
  const all = computeFeed(query, mockNow());
  const start = query.cursor ? Number(query.cursor) : 0;
  const size = query.limit ?? PAGE;
  const items = all.slice(start, start + size);
  return { items, total: all.length, nextCursor: start + size < all.length ? String(start + size) : null };
}

export const getFeed = (query: FeedQuery) => simulate(() => paginate(query));

export const search = (query: FeedQuery & { q: string }) => simulate(() => paginate(query));

/** Carte : même moteur et même ordre que la liste, limité à 200 points. */
export function getMap(query: FeedQuery): Promise<MapMarker[]> {
  return simulate(() => computeFeed(query, mockNow()).slice(0, 200).map((it) => ({
    posId: it.pos.id, dishId: it.dish.id, slug: it.pos.slug, dishSlug: it.dish.slug,
    lat: it.point.lat, lng: it.point.lng, price: it.dish.priceXof, label: it.dish.name, posName: it.pos.name,
    distanceM: it.pos.distanceM, visibilityClass: it.visibilityClass, openState: it.pos.openStatus.state,
    isApproximate: it.isApproximate, illustrationKey: it.dish.illustrationKey,
  })));
}

function reviewViews(posId: string, dishId?: string, limit = 3): ReviewView[] {
  if (!ratingOf(posId, dishId)) return [];
  return db.reviews
    .filter((r) => r.posId === posId && r.status === 'PUBLISHED' && (!dishId || r.dishId === dishId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((r, i) => ({
      id: r.id, rating: r.rating, comment: r.comment, createdAt: r.createdAt, vendorReply: r.vendorReply,
      authorName: mockExtras.reviewAuthors[i % mockExtras.reviewAuthors.length],
      dishName: db.dishes.find((d) => d.id === r.dishId)?.name ?? null,
    }));
}

/** Page du point de vente (écran 2, D2) — la seule page avec l'emplacement. */
export function getPos(slug: string, viewer?: { lat: number; lng: number } | null): Promise<PosPage> {
  return simulate(() => {
    const pos = findPosBySlug(slug);
    if (!pos) throw new ApiError(ERR.NOT_FOUND, "Ce point de vente n'existe pas ou n'est plus en ligne.", 404);
    const now = mockNow();
    const menu = visibleDishes(pos.id).map((d) => dishCard(d, now))
      .sort((a, b) => Number(b.isSpecial) - Number(a.isSpecial) || Number(a.isSoldOut) - Number(b.isSoldOut));
    return {
      pos: {
        ...posSummary(pos, now, viewer ?? mockExtras.zoneCenters[pos.zoneId]),
        description: pos.description, landmark: pos.hasPublicPlace ? pos.landmark : null,
        point: publicPointOf(pos), isApproximate: !pos.hasPublicPlace, openingHours: pos.openingHours,
        pricesCheckedAt: pos.pricesCheckedAt, identityChecked: !!pos.identityCheckedAt,
        rating: ratingOf(pos.id), qrCode: pos.qrCode,
        coverUrl: (() => { const c = coverOf(pos.id); return c && !c.pending ? c.src : null; })(),
      },
      menu,
      recentReviews: reviewViews(pos.id),
    };
  });
}

/** Page du plat (écran 22, D8) : jamais d'adresse ni de coordonnées. */
export function getDish(slug: string, dishSlug: string, viewer?: { lat: number; lng: number } | null): Promise<DishPage> {
  return simulate(() => {
    const pos = findPosBySlug(slug);
    const dish = pos && visibleDishes(pos.id).find((d) => d.slug === dishSlug);
    if (!pos || !dish) throw new ApiError(ERR.NOT_FOUND, "Ce plat n'est plus au menu.", 404);
    const now = mockNow();
    const s = posSummary(pos, now, viewer ?? null);
    const card = dishCard(dish, now);
    return {
      dish: { ...card, photos: card.imageUrl ? [card.imageUrl] : [] },
      pos: {
        id: s.id, slug: s.slug, name: s.name, type: s.type, distanceM: s.distanceM, openStatus: s.openStatus,
        servesOnSite: s.servesOnSite, servesTakeaway: s.servesTakeaway, delivers: s.delivers,
        acceptsCash: s.acceptsCash, acceptsMomo: s.acceptsMomo, hasPublicPlace: s.hasPublicPlace,
      },
      others: visibleDishes(pos.id).filter((d) => d.id !== dish.id).map((d) => dishCard(d, now)),
      pricesCheckedAt: pos.pricesCheckedAt,
      rating: ratingOf(pos.id, dish.id),
    };
  });
}

export function getReviews(slug: string, opts: { dishId?: string; cursor?: string } = {}): Promise<ReviewView[]> {
  return simulate(() => {
    const pos = findPosBySlug(slug);
    if (!pos) throw new ApiError(ERR.NOT_FOUND, 'Point de vente introuvable.', 404);
    return reviewViews(pos.id, opts.dishId, 50);
  });
}

/** Scans déjà comptés (appareil|point|heure) : un scan par appareil et par heure (12.6). */
const scanned = new Set<string>();

/** Événement `qr_scan` → PosDailyStat.qrScans du jour. */
function countScan(posId: string) {
  const now = mockNow();
  const key = `${deviceId()}|${posId}|${now.toISOString().slice(0, 13)}`;
  if (scanned.has(key)) return;
  scanned.add(key);
  const day = businessDate(now);
  let row = db.posDailyStats.find((s) => s.posId === posId && s.businessDate === day);
  if (!row) {
    row = { posId, businessDate: day, impressions: 0, promotedImpressions: 0, views: 0, dishViews: 0, qrScans: 0,
      whatsappContacts: 0, callContacts: 0, uniqueClients: 0, confirmedOrders: 0 };
    db.posDailyStats.push(row);
  }
  row.qrScans += 1;
}

/** GET /q/:code — redirection QR (12.6) : slug du point, `revoked` si le code n'est plus valide. */
export function resolveQrCode(code: string): Promise<{ slug: string | null; unavailable: boolean }> {
  return simulate(() => {
    const pos = db.pointsOfSale.find((p) => p.qrCode === code.toUpperCase() && !p.deletedAt);
    if (!pos) return { slug: null, unavailable: false };
    if (pos.status === 'PUBLISHED') countScan(pos.id);
    return { slug: pos.slug, unavailable: pos.status !== 'PUBLISHED' };
  });
}
