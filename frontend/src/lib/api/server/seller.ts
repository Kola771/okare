/**
 * Espace vendeur — GET /vendor/me · GET /pos/:id/stats · POST /pos/:id/share-link.
 */
import 'server-only';
import { db, mockExtras } from '@/mocks';
import { addDays, businessDate, daysInclusive } from '@/shared/time';
import type { StatsReport, VendorHome } from '../seller-dto';
import { ApiError, ERR } from '../errors';
import { assertPos, contactsBetween, currentVendor, managedPos } from './mock/manage';
import { mockNow, newId, persist, simulate } from './mock/runtime';

export function getVendorMe(): Promise<VendorHome> {
  return simulate(() => {
    const { vendor } = currentVendor();
    const now = mockNow();
    const today = businessDate(now);
    const points = db.pointsOfSale.filter((p) => p.vendorId === vendor.id && !p.deletedAt && p.status !== 'ARCHIVED');
    const sum = (d: string) => points.reduce((n, p) => n + contactsBetween(p.id, d, d), 0);
    const agent = db.users.find((u) => u.id === vendor.followedById);
    return {
      vendorId: vendor.id, displayName: vendor.displayName, contactName: vendor.contactName, agentName: agent?.fullName ?? null,
      vendorAgeDays: vendor.firstPublishedAt ? daysInclusive(businessDate(new Date(vendor.firstPublishedAt)), today) - 1 : 0,
      // Jour en cours : compteur temps réel (Redis en phase 2) ; en démo, la veille sert d'ordre de grandeur.
      contactsToday: sum(addDays(today, -1)), contactsYesterday: sum(addDays(today, -2)),
      points: points.map((p) => managedPos(p, now)),
      isParticulier: points.some((p) => p.type === 'PARTICULIER'),
      zones: [...new Set(points.map((p) => p.zoneId))].map((zoneId) => {
        const z = db.zones.find((x) => x.id === zoneId)!;
        return {
          id: z.id, name: z.name, category: db.zoneCategories.find((c) => c.id === z.categoryId)!.code,
          center: mockExtras.zoneCenters[z.id] ?? null,
          neighborhoods: [...new Set(points.filter((p) => p.zoneId === z.id).map((p) => db.neighborhoods.find((n) => n.id === p.neighborhoodId)?.name).filter((n): n is string => !!n))],
          points: points.filter((p) => p.zoneId === z.id).map((p) => p.name),
        };
      }),
    };
  });
}

/**
 * Rapport de statistiques d'un point (`posId`) ou de tous les points du vendeur (`'all'`), sur les `days` derniers jours
 * ou sur la période `range` (jours AAAA-MM-JJ inclus). Comparaison avec la période de même durée juste avant.
 */
export function getPosStats(posId: string | 'all', days = 30, range?: { from: string; to: string }): Promise<StatsReport> {
  return simulate(() => {
    const ids = posId === 'all'
      ? db.pointsOfSale.filter((p) => p.vendorId === currentVendor().vendor.id).map((p) => p.id)
      : [assertPos(posId, 'pos.stats.read').pos.id];
    const today = businessDate(mockNow());
    const to = range?.to ?? addDays(today, -1);
    const from = range?.from ?? addDays(today, -days);
    const len = daysInclusive(from, to);
    const prevFrom = addDays(from, -len);
    const rows = db.posDailyStats.filter((s) => ids.includes(s.posId) && s.businessDate >= from && s.businessDate <= to);
    const total = (k: keyof (typeof rows)[number]) => rows.reduce((n, r) => n + Number(r[k]), 0);
    const contacts = total('whatsappContacts') + total('callContacts');
    const dishRows = db.posDishDailyStats.filter((s) => ids.includes(s.posId) && s.businessDate >= from && s.businessDate <= to);
    const byDishMap = new Map<string, { contacts: number; confirmed: number }>();
    for (const r of dishRows) {
      const name = db.dishes.find((d) => d.id === r.dishId)?.name ?? 'Plat supprimé';
      const cur = byDishMap.get(name) ?? { contacts: 0, confirmed: 0 };
      byDishMap.set(name, { contacts: cur.contacts + r.contacts, confirmed: cur.confirmed + r.confirmed });
    }
    const byDish = [...byDishMap.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.contacts - a.contacts);
    const precise = byDish.reduce((n, d) => n + d.contacts, 0);
    if (contacts > precise) byDish.push({ name: 'Plat non précisé', contacts: contacts - precise, confirmed: 0 });
    const pos = ids.map((id) => db.pointsOfSale.find((p) => p.id === id)!);
    return {
      from, to, contacts, previousContacts: ids.reduce((n, id) => n + contactsBetween(id, prevFrom, addDays(from, -1)), 0),
      uniqueClients: total('uniqueClients'), confirmedOrders: total('confirmedOrders'), views: total('views'),
      whatsapp: total('whatsappContacts'), calls: total('callContacts'), qrScans: total('qrScans'),
      responseRate: pos.length === 1 ? pos[0].responseRate : null,
      byDay: Array.from({ length: Math.min(len, range ? 31 : 14) }, (_, i) => {
        const d = addDays(to, -(Math.min(len, range ? 31 : 14) - 1 - i));
        return { date: d, contacts: ids.reduce((n, id) => n + contactsBetween(id, d, d), 0) };
      }),
      byDish,
      byPos: pos.map((p) => ({
        posId: p.id, name: p.name, contacts: contactsBetween(p.id, from, to), responseRate: p.responseRate,
        openDays: rows.filter((r) => r.posId === p.id && r.whatsappContacts + r.callContacts > 0).length, days: len,
      })),
    };
  });
}

/** Lien de rapport partagé, valable 30 jours (10). */
export function createShareLink(posId: string): Promise<{ url: string; token: string }> {
  return simulate(() => {
    const { user, pos } = assertPos(posId, 'stats.share');
    const token = `${pos.slug}-${newId().slice(-8)}`;
    db.statsShareLinks.push({ token, posId: pos.id, createdById: user.id, expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      revokedAt: null, createdAt: new Date().toISOString() });
    persist();
    return { token, url: `/r/${token}` };
  });
}

/** Rapport public (GET /r/:token), sans connexion. */
export function getSharedReport(token: string): Promise<{ posName: string; report: StatsReport }> {
  return simulate(() => {
    const link = db.statsShareLinks.find((l) => l.token === token && !l.revokedAt);
    const slug = link ? null : token.replace(/^demo-/, '');
    const pos = link ? db.pointsOfSale.find((p) => p.id === link.posId) : db.pointsOfSale.find((p) => p.slug === slug);
    if (!pos) throw new ApiError(ERR.NOT_FOUND, 'Ce lien de rapport n’existe plus.', 404);
    const report = buildPublicReport(pos.id);
    return { posName: pos.name, report };
  });
}

function buildPublicReport(posId: string): StatsReport {
  const today = businessDate(mockNow());
  const from = addDays(today, -30);
  const to = addDays(today, -1);
  const rows = db.posDailyStats.filter((s) => s.posId === posId && s.businessDate >= from && s.businessDate <= to);
  const sum = (f: (r: (typeof rows)[number]) => number) => rows.reduce((n, r) => n + f(r), 0);
  const contacts = sum((r) => r.whatsappContacts + r.callContacts);
  return {
    from, to, contacts, previousContacts: contactsBetween(posId, addDays(from, -30), addDays(from, -1)),
    uniqueClients: sum((r) => r.uniqueClients), confirmedOrders: sum((r) => r.confirmedOrders), views: sum((r) => r.views),
    whatsapp: sum((r) => r.whatsappContacts), calls: sum((r) => r.callContacts), qrScans: sum((r) => r.qrScans),
    responseRate: db.pointsOfSale.find((p) => p.id === posId)?.responseRate ?? null,
    byDay: Array.from({ length: 14 }, (_, i) => { const d = addDays(to, i - 13); return { date: d, contacts: contactsBetween(posId, d, d) }; }),
    byDish: [], byPos: [],
  };
}

