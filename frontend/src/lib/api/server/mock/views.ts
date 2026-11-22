/** Construction des vues (DTO) à partir des tables fictives — ce que fera le serveur en phase 2. */
import 'server-only';
import { db } from '@/mocks';
import { getOpenStatus } from '@/shared/open-status';
import { businessDate } from '@/shared/time';
import type { Dish, GeoPoint, PointOfSale } from '@/shared/types';
import { getVisibilityClass, type PosAd } from '@/shared/visibility';
import type { DishCard, PosSummary } from '../../dto';

/** Distance en mètres (formule de haversine). */
export function distanceM(a: GeoPoint, b: GeoPoint): number {
  const R = 6_371_000;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** Position publique : décalée pour un Particulier sans lieu public (12.5). */
export const publicPointOf = (pos: PointOfSale): GeoPoint => (!pos.hasPublicPlace && pos.publicPoint) || pos.location;

export function openStatusOf(pos: PointOfSale, now: Date) {
  const today = businessDate(now);
  return getOpenStatus({
    openingHours: pos.openingHours,
    holidayPolicy: pos.holidayPolicy,
    overrides: db.posDayOverrides.filter((o) => o.posId === pos.id),
    holidays: db.holidays.map((h) => h.date),
    closedReportsToday: db.reports.filter((r) => r.posId === pos.id && r.reason === 'CLOSED_TODAY' && r.businessDate === today).length,
    confirmedOpenToday: db.dailySpecials.some((s) => s.posId === pos.id && s.businessDate === today),
  }, now);
}

export function posAds(posId: string): PosAd[] {
  return db.subscriptions
    .filter((s) => s.posId === posId)
    .map((s) => ({
      plan: s.plan, status: s.status, startDate: s.startDate, endDate: s.endDate,
      zoneIds: db.subscriptionZones.filter((z) => z.subscriptionId === s.id).map((z) => z.zoneId),
    }));
}

export function visibilityOf(pos: PointOfSale, zoneId: string, now: Date) {
  const vendor = db.vendors.find((v) => v.id === pos.vendorId)!;
  return getVisibilityClass({
    subscriptionsEnabled: db.settings['subscriptions.enabled'] === true,
    vendor,
    ads: posAds(pos.id),
    onActiveWaitlist: db.waitlist.some((w) => w.posId === pos.id && (w.status === 'WAITING' || w.status === 'OFFERED')),
  }, zoneId, now);
}

export function posSummary(pos: PointOfSale, now: Date, viewer?: GeoPoint | null): PosSummary {
  const zone = db.zones.find((z) => z.id === pos.zoneId)!;
  const nb = db.neighborhoods.find((n) => n.id === pos.neighborhoodId);
  return {
    id: pos.id, slug: pos.slug, name: pos.name, type: pos.type, zoneName: zone.name, neighborhoodName: nb?.name ?? null,
    distanceM: viewer ? distanceM(viewer, publicPointOf(pos)) : null,
    openStatus: openStatusOf(pos, now),
    servesOnSite: pos.servesOnSite, servesTakeaway: pos.servesTakeaway, delivers: pos.delivers,
    acceptsCash: pos.acceptsCash, acceptsMomo: pos.acceptsMomo, hasPublicPlace: pos.hasPublicPlace,
  };
}

export function dishCard(dish: Dish, now: Date): DishCard {
  const today = businessDate(now);
  const special = db.dailySpecials.find((s) => s.dishId === dish.id && s.businessDate === today);
  const cat = db.dishCategories.find((c) => c.id === dish.categoryId);
  const photo = db.media.find((m) => m.ownerType === 'DISH' && m.ownerId === dish.id && m.status === 'READY' && m.review === 'DONE' && !m.deletedAt);
  return {
    id: dish.id, slug: dish.slug, name: dish.name, description: dish.description,
    priceXof: special?.priceTodayXof ?? dish.priceXof, moment: dish.moment, categoryId: dish.categoryId,
    isSpecial: !!special, isSoldOut: dish.soldOutOn === today,
    imageUrl: photo?.variants.card ?? null, illustrationKey: cat?.illustrationKey ?? null,
  };
}

/** Plats visibles par les clients : publiés, non supprimés. */
export const visibleDishes = (posId: string) =>
  db.dishes.filter((d) => d.posId === posId && d.status === 'PUBLISHED' && !d.deletedAt);

/** Points visibles par les clients. */
export const visiblePos = () => db.pointsOfSale.filter((p) => p.status === 'PUBLISHED' && !p.deletedAt);

export const findPosBySlug = (slug: string) => visiblePos().find((p) => p.slug === slug);

/** Note affichée seulement à partir de 5 avis publiés (9.6). */
export function ratingOf(posId: string, dishId?: string) {
  const list = db.reviews.filter((r) => r.posId === posId && r.status === 'PUBLISHED' && (!dishId || r.dishId === dishId));
  if (list.length < 5) return null;
  const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
  return { avg: Math.round(avg * 10) / 10, count: list.length };
}
