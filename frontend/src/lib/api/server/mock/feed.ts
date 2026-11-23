/**
 * Moteur de l'accueil, de la recherche et de la carte (8.1, 8.2) — version en mémoire.
 * Une entrée = un plat avec son point de vente ; un point apparaît au plus une fois.
 */
import 'server-only';
import { db, mockExtras } from '@/mocks';
import { BUSINESS_RULES } from '@/shared/business-rules';
import { isOpenNow } from '@/shared/open-status';
import { tierOf, isPromoted } from '@/shared/visibility';
import type { Dish, PointOfSale } from '@/shared/types';
import type { FeedItem, FeedQuery } from '../../dto';
import { dishCard, distanceM, posSummary, publicPointOf, visibilityOf, visibleDishes, visiblePos } from './views';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Similarité simple par trigrammes (remplace pg_trgm en phase 1). */
function similarity(a: string, b: string): number {
  const grams = (s: string) => {
    const t = `  ${norm(s)} `;
    return new Set(Array.from({ length: t.length - 2 }, (_, i) => t.slice(i, i + 3)));
  };
  const A = grams(a);
  const B = grams(b);
  const common = [...A].filter((g) => B.has(g)).length;
  return common / (A.size + B.size - common || 1);
}

function textMatches(q: string, pos: PointOfSale, dish: Dish): boolean {
  const needle = norm(q.trim());
  const cat = db.dishCategories.find((c) => c.id === dish.categoryId);
  const nb = db.neighborhoods.find((n) => n.id === pos.neighborhoodId);
  const hay = [pos.name, dish.name, cat?.name, ...(cat?.aliases ?? []), nb?.name, ...(nb?.aliases ?? [])]
    .filter(Boolean).map((s) => norm(s as string));
  return hay.some((h) => h.includes(needle)) || similarity(q, pos.name) >= 0.4;
}

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

function score(pos: PointOfSale, dist: number | null, hasSpecial: boolean, now: Date): number {
  const proximity = dist == null ? 0.5 : 1 - Math.min(dist, 3000) / 3000;
  const checkedDays = pos.pricesCheckedAt ? (now.getTime() - new Date(pos.pricesCheckedAt).getTime()) / 86_400_000 : 99;
  const freshness = checkedDays < 3 ? 1 : Math.max(0, 1 - (checkedDays - 3) / 11);
  const response = pos.responseRate ?? 0.7;
  const completeness = (pos.landmark ? 0.5 : 0) + (Object.keys(pos.openingHours).length ? 0.5 : 0);
  let s = 0.4 * proximity + 0.2 * freshness + 0.15 * response + 0.15 * (hasSpecial ? 1 : 0) + 0.1 * completeness;
  if (checkedDays > BUSINESS_RULES.freshness.penaltyDays) s *= 0.5;
  if (pos.responseRate != null && pos.responseRate < BUSINESS_RULES.response.lowThreshold) s *= 0.6;
  return s;
}

export function computeFeed(query: FeedQuery, now: Date): FeedItem[] {
  const viewer = query.lat != null && query.lng != null
    ? { lat: query.lat, lng: query.lng }
    : mockExtras.zoneCenters[query.zoneId] ?? null;
  const catKey = query.categoryId ? db.dishCategories.find((c) => c.id === query.categoryId)?.illustrationKey : undefined;
  const radius = BUSINESS_RULES.search.nearbyRadiusMeters;
  const rows: (FeedItem & { tier: number; sortKey: number; unknown: boolean })[] = [];

  for (const pos of visiblePos()) {
    if (query.type && pos.type !== query.type) continue;
    const inZone = pos.zoneId === query.zoneId;
    const cls = visibilityOf(pos, query.zoneId, now);
    const dist = viewer ? distanceM(viewer, publicPointOf(pos)) : null;
    const pt = publicPointOf(pos);
    const inBox = query.bbox && pt.lng >= query.bbox[0] && pt.lat >= query.bbox[1] && pt.lng <= query.bbox[2] && pt.lat <= query.bbox[3];
    const inPerimeter = query.bbox ? !!inBox : inZone || isPromoted(cls) || (dist != null && dist <= radius) || !!query.q;
    if (!inPerimeter) continue;

    const status = posSummary(pos, now, viewer);
    const unknown = status.openStatus.state === 'UNKNOWN';
    if (query.openNow !== false && !isOpenNow(status.openStatus.state) && !unknown) continue;

    const dishes = visibleDishes(pos.id)
      .map((d) => ({ d, card: dishCard(d, now) }))
      .filter(({ d, card }) =>
        !card.isSoldOut
        && (query.budgetMin == null || card.priceXof >= query.budgetMin)
        && (query.budgetMax == null || card.priceXof <= query.budgetMax)
        && (!query.moment || d.moment === query.moment || d.moment === 'ALL_DAY')
        && (!catKey || card.illustrationKey === catKey)
        && (!query.q || textMatches(query.q, pos, d)));
    if (!dishes.length) continue;
    const best = dishes.find((x) => x.card.isSpecial) ?? dishes.sort((a, b) => a.card.priceXof - b.card.priceXof)[0];

    const nameHit = !!query.q && similarity(query.q, pos.name) >= 0.6;
    const tier = cls === 'REDUCED' && nameHit ? (inZone ? 3 : 4) : tierOf(cls, !inZone);
    const sortKey = tier <= 2
      ? hash(`${pos.id}${now.toISOString().slice(0, 10)}${query.zoneId}`)
      : -score(pos, dist, best.card.isSpecial, now);
    rows.push({
      pos: status, dish: best.card, visibilityClass: cls, isPromoted: isPromoted(cls),
      point: publicPointOf(pos), isApproximate: !pos.hasPublicPlace, tier, sortKey, unknown,
    });
  }

  rows.sort((a, b) => a.tier - b.tier || Number(a.unknown) - Number(b.unknown) || a.sortKey - b.sortKey);
  return rows.map(({ tier: _t, sortKey: _s, unknown: _u, ...item }) => item);
}
