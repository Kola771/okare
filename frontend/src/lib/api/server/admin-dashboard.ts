/**
 * Tableau de bord (DB1, DM1) — GET /admin/dashboard?country=&city=&zone=&nb=&from=&to=.
 * Période par défaut : les 30 derniers jours ; comparaison avec la période de même durée juste avant.
 */
import 'server-only';
import { db } from '@/mocks';
import { addDays, businessDate, daysInclusive } from '@/shared/time';
import type { TeamFilter } from '@/shared/team-filter';
import { placeLabel, posInPlace, zonesOf } from './mock/filters';
import { contactsBetween } from './mock/manage';
import { mockNow, simulate } from './mock/runtime';
import { inScope, requireTeam } from './mock/team';

export interface AdminDashboard {
  greetName: string;
  place: string;
  period: { from: string; to: string; days: number };
  contacts30: number;
  contactsPrev30: number;
  confirmed30: number;
  confirmedPrev30: number;
  rating: { avg: number; count: number } | null;
  publishedPos: number;
  newPos7d: number;
  objectivePos: number;
  byDay: { date: string; contacts: number }[];
  topDishes: { name: string; contacts: number }[];
  watchlist: { posId: string; name: string; type: string; zone: string; problem: string }[];
  activity: { id: string; who: string; what: string; at: string }[];
}

const OBJECTIVE_POS = 340;

export function getAdminDashboard(f: TeamFilter = {}): Promise<AdminDashboard> {
  return simulate(() => {
    const { user, zoneIds } = requireTeam('pos.update');
    const now = mockNow();
    const today = businessDate(now);
    const to = f.to ?? addDays(today, -1);
    const from = f.from && f.from <= to ? f.from : addDays(to, -29);
    const days = daysInclusive(from, to);
    const prevTo = addDays(from, -1);
    const prevFrom = addDays(prevTo, -(days - 1));
    const zones = zonesOf(f);
    const pos = db.pointsOfSale.filter((p) => !p.deletedAt && inScope(zoneIds, p.zoneId) && posInPlace(p, f, zones));
    const ids = new Set(pos.map((p) => p.id));
    const sum = (from: string, to: string) => pos.reduce((n, p) => n + contactsBetween(p.id, from, to), 0);
    const confirmed = (from: string, to: string) => db.posDailyStats
      .filter((s) => ids.has(s.posId) && s.businessDate >= from && s.businessDate <= to).reduce((n, s) => n + s.confirmedOrders, 0);
    const reviews = db.reviews.filter((r) => ids.has(r.posId) && r.status === 'PUBLISHED');
    const dishTotals = new Map<string, number>();
    for (const s of db.posDishDailyStats) {
      if (s.businessDate < from || s.businessDate > to || !ids.has(s.posId)) continue;
      const cat = db.dishCategories.find((c) => c.id === db.dishes.find((d) => d.id === s.dishId)?.categoryId)?.name ?? 'Autre';
      dishTotals.set(cat, (dishTotals.get(cat) ?? 0) + s.contacts);
    }
    const zoneName = (id: string) => db.zones.find((z) => z.id === id)?.name ?? '';
    const watchlist = pos.flatMap((p) => {
      const stale = p.pricesCheckedAt ? Math.floor((now.getTime() - new Date(p.pricesCheckedAt).getTime()) / 86_400_000) : 99;
      const reports = db.reports.filter((r) => r.posId === p.id && r.status === 'OPEN').length;
      const problem = p.responseRate != null && p.responseRate < 0.5 ? `Réponse ${Math.round(p.responseRate * 100)} %`
        : reports ? `${reports} signalement${reports > 1 ? 's' : ''}` : stale > 14 ? `Prix non vérifiés depuis ${stale} j` : null;
      return problem ? [{ posId: p.id, name: p.name, type: p.type, zone: zoneName(p.zoneId), problem }] : [];
    });
    return {
      greetName: user.fullName?.split(' ')[0] ?? '', place: placeLabel(f), period: { from, to, days },
      contacts30: sum(from, to), contactsPrev30: sum(prevFrom, prevTo),
      confirmed30: confirmed(from, to), confirmedPrev30: confirmed(prevFrom, prevTo),
      rating: reviews.length ? { avg: Math.round((reviews.reduce((n, r) => n + r.rating, 0) / reviews.length) * 10) / 10, count: reviews.length } : null,
      publishedPos: pos.filter((p) => p.status === 'PUBLISHED').length,
      newPos7d: pos.filter((p) => p.publishedAt && now.getTime() - new Date(p.publishedAt).getTime() < 7 * 86_400_000).length,
      objectivePos: OBJECTIVE_POS,
      byDay: Array.from({ length: Math.min(days, 31) }, (_, i) => { const d = addDays(to, i - Math.min(days, 31) + 1); return { date: d, contacts: sum(d, d) }; }),
      topDishes: [...dishTotals.entries()].map(([name, contacts]) => ({ name, contacts })).sort((a, b) => b.contacts - a.contacts).slice(0, 5),
      watchlist: watchlist.slice(0, 6),
      activity: db.auditLogs.filter((a) => !a.action.startsWith('payment') && !a.action.startsWith('subscription')).slice(0, 6).map((a) => ({
        id: a.id, at: a.createdAt, what: a.action, who: a.actorId ? db.users.find((u) => u.id === a.actorId)?.fullName ?? 'Équipe' : 'Système' })),
    };
  });
}
