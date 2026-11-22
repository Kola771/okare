/** Vues et contrôles de périmètre pour la gestion des points de vente (vendeur, agent de la zone, admin) — 5.3. */
import 'server-only';
import { db } from '@/mocks';
import type { Permission } from '@/shared/permissions';
import { addDays, businessDate } from '@/shared/time';
import type { PointOfSale, User } from '@/shared/types';
import type { ManagedPos } from '../../seller-dto';
import { ApiError, ERR } from '../../errors';
import { demoUser, newId, requireUser } from './runtime';
import { openStatusOf } from './views';

export function actorScope(user: User) {
  return { id: user.id, roles: user.roles, agentZoneIds: db.agentZones.filter((a) => a.userId === user.id).map((a) => a.zoneId) };
}

/** ScopeService.assertPos : 404 si le point n'existe pas, 403 hors périmètre. */
export function assertPos(posId: string, perm: Permission): { user: User; pos: PointOfSale } {
  void perm; // Accès libre en phase 1 : périmètre (canOnPos) appliqué avec le backend.
  const user = requireUser();
  const pos = db.pointsOfSale.find((p) => p.id === posId && !p.deletedAt);
  if (!pos) throw new ApiError(ERR.NOT_FOUND, 'Point de vente introuvable.', 404);
  return { user, pos };
}

const DEMO_VENDOR_USER = '0193a200-0000-7000-8000-00000000000a';

/** Le vendeur du compte connecté (ou, en accès libre, la vendeuse de démonstration). */
export function currentVendor() {
  const user = requireUser();
  // Accès libre en phase 1 : un compte sans point de vente voit la vendeuse de démonstration (Chez Maman).
  const vendor = db.vendors.find((v) => v.userId === user.id && !v.deletedAt)
    ?? db.vendors.find((v) => v.userId === DEMO_VENDOR_USER)!;
  return { user: vendor.userId === user.id ? user : demoUser(DEMO_VENDOR_USER), vendor };
}

export function contactsBetween(posId: string, from: string, to: string) {
  return db.posDailyStats
    .filter((s) => s.posId === posId && s.businessDate >= from && s.businessDate <= to)
    .reduce((n, s) => n + s.whatsappContacts + s.callContacts, 0);
}

/** Note de tous les avis publiés (le vendeur voit sa note même avant 5 avis). */
export function reviewsSummary(posId: string): { avg: number; count: number } | null {
  const list = db.reviews.filter((r) => r.posId === posId && r.status === 'PUBLISHED');
  return list.length ? { avg: Math.round((list.reduce((n, r) => n + r.rating, 0) / list.length) * 10) / 10, count: list.length } : null;
}

export function managedPos(pos: PointOfSale, now: Date): ManagedPos {
  const today = businessDate(now);
  const zone = db.zones.find((z) => z.id === pos.zoneId)!;
  const cat = db.zoneCategories.find((c) => c.id === zone.categoryId)!;
  const vendor = db.vendors.find((v) => v.id === pos.vendorId)!;
  const special = db.dailySpecials.find((s) => s.posId === pos.id && s.businessDate === today);
  const dish = special && db.dishes.find((d) => d.id === special.dishId);
  const override = db.posDayOverrides.find((o) => o.posId === pos.id && o.businessDate === today);
  return {
    id: pos.id, slug: pos.slug, name: pos.name, type: pos.type, status: pos.status, zoneId: zone.id, zoneName: zone.name,
    zoneCategory: cat.code, neighborhoodId: pos.neighborhoodId, isMainPos: vendor.mainPosId === pos.id, openStatus: openStatusOf(pos, now),
    openingHours: pos.openingHours, holidayPolicy: pos.holidayPolicy,
    todayOverride: override ? { isClosed: override.isClosed, ranges: override.ranges } : null,
    special: dish ? { dishId: dish.id, name: dish.name, priceXof: special!.priceTodayXof ?? dish.priceXof } : null,
    delivers: pos.delivers, qrCode: pos.qrCode, pricesCheckedAt: pos.pricesCheckedAt, hoursConfirmedAt: pos.hoursConfirmedAt,
    contacts7d: contactsBetween(pos.id, addDays(today, -7), addDays(today, -1)),
    contacts30: contactsBetween(pos.id, addDays(today, -30), addDays(today, -1)),
    qrScans7d: db.posDailyStats.filter((s) => s.posId === pos.id && s.businessDate >= addDays(today, -7)).reduce((n, s) => n + s.qrScans, 0),
    // Contacts venus d'un scan (source = QR) : « commandes après un scan » (12.6).
    qrOrders7d: db.contacts.filter((c) => c.posId === pos.id && c.source === 'QR' && now.getTime() - new Date(c.createdAt).getTime() < 7 * 86_400_000).length,
    dishCount: db.dishes.filter((d) => d.posId === pos.id && !d.deletedAt).length,
    rating: reviewsSummary(pos.id),
    responseRate: pos.responseRate, version: pos.version,
  };
}

/** Écrit une ligne du journal d'audit (17) et marque l'auteur de la modification. */
export function audit(user: User, action: string, entityType: string, entityId: string, before: unknown, after: unknown) {
  db.auditLogs.unshift({
    id: newId(), actorId: user.id, actorRole: user.roles[user.roles.length - 1] ?? null, action, entityType, entityId,
    before: before ?? null, after: after ?? null, ipHash: null, createdAt: new Date().toISOString(),
  });
}

/** Toute modification de plat ou de prix met à jour `pricesCheckedAt` et la version (12.3, 5.3). */
export function touchPos(pos: PointOfSale, user: User, prices = false) {
  pos.version += 1;
  pos.updatedById = user.id;
  pos.updatedAt = new Date().toISOString();
  if (prices) pos.pricesCheckedAt = pos.updatedAt;
}
