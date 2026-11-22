/**
 * Statistiques fictives (PosDailyStat, PosDishDailyStat) des 60 derniers jours, générées de façon stable
 * (même résultat à chaque chargement) à partir de l'identifiant du point de vente.
 */
import { addDays, businessDate } from '@/shared/time';
import type { PosDailyStat, PosDishDailyStat } from '@/shared/types';
import { DISHES } from './dishes';
import { POINTS_OF_SALE } from './points-of-sale';

/** Pseudo-hasard déterministe (mulberry32). */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seedOf = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 17);
const today = businessDate(new Date());
const DAYS = 400; // un peu plus d’un an : filtres année et mois de l’accueil vendeur

/** Popularité relative des points (Chez Maman Ganhi est le plus contacté). */
const WEIGHT: Record<string, number> = { 'chez-maman-ganhi': 9, 'chez-maman-akpakpa': 2.2, 'maquis-le-bon-gout': 5, 'restaurant-le-palmier': 4 };

export const POS_DAILY_STATS: PosDailyStat[] = POINTS_OF_SALE.flatMap((pos) => {
  const r = rng(seedOf(pos.id));
  const w = WEIGHT[pos.slug] ?? 1.5;
  return Array.from({ length: DAYS }, (_, i) => {
    const d = addDays(today, -i - 1);
    const wa = Math.round(w * (0.6 + r()));
    const calls = Math.round(wa * 0.25 * r());
    return {
      posId: pos.id, businessDate: d,
      impressions: Math.round(wa * (18 + 10 * r())), promotedImpressions: pos.slug === 'maquis-le-bon-gout' ? Math.round(wa * 8) : 0,
      views: Math.round(wa * (3 + r())), dishViews: Math.round(wa * (2 + r())), qrScans: Math.round(w * 0.5 * r()),
      whatsappContacts: wa, callContacts: calls, uniqueClients: Math.round((wa + calls) * 0.75),
      confirmedOrders: Math.round((wa + calls) * (0.45 + 0.15 * r())),
    };
  });
});

export const POS_DISH_DAILY_STATS: PosDishDailyStat[] = POS_DAILY_STATS.flatMap((s) => {
  const dishes = DISHES.filter((d) => d.posId === s.posId);
  const total = s.whatsappContacts + s.callContacts;
  // Le premier plat (souvent le plat du jour) concentre la majorité des contacts ; une part reste « non précisée ».
  const shares = dishes.map((_, i) => (i === 0 ? 0.6 : 0.27 / Math.max(1, dishes.length - 1)));
  return dishes.map((d, i) => {
    const contacts = Math.round(total * shares[i]);
    return { posId: s.posId, dishId: d.id, businessDate: s.businessDate, views: contacts * 3, contacts, confirmed: Math.round(contacts * 0.55) };
  });
});
