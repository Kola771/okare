import 'server-only';

/**
 * Base fictive en mémoire — mêmes tables et mêmes champs que la vraie base (section 4).
 * Seule la couche `src/lib/api/server` (côté serveur) lit et modifie cet objet : les écrans ne l'importent jamais.
 */
import { AD_SAMPLES, SUBSCRIPTIONS, SUBSCRIPTIONS_ENABLED, SUBSCRIPTION_ZONES } from './ads';
import { SAMPLE_AUDIT, SAMPLE_REPORTS } from './admin-samples';
import { CLAIM_CODES, CLAIM_REQUESTS, CLAIM_USERS } from './claims';
import { CONTACTS, FAVORITES, FOLLOW_UPS, REVIEWS, REVIEW_AUTHORS } from './clients';
import { DISH_CATEGORIES } from './dish-categories';
import { DAILY_SPECIALS, DISHES } from './dishes';
import { CITY, COUNTRY, HOLIDAYS, NEIGHBORHOODS, PRICE_GRID, ZONES, ZONE_CATEGORIES, ZONE_CENTERS } from './geo';
import { MEDIA } from './media';
import { POINTS_OF_SALE } from './points-of-sale';
import { QR_CONTACTS } from './qr-contacts';
import { AGENT_ZONES, USERS } from './users';
import { POS_DAILY_STATS, POS_DISH_DAILY_STATS } from './stats';
import { VENDORS } from './vendors';
import type {
  AuditLog, ContactOrderItem, Notification, Payment, PosDayOverride, Report, StatsShareLink, SubscriptionOrder,
  VendorNotice, WaitlistEntry, ZoneDaySlot,
} from '@/shared/types';

function createDb() {
  return {
  countries: [COUNTRY],
  cities: [CITY],
  zoneCategories: ZONE_CATEGORIES,
  zones: ZONES,
  neighborhoods: NEIGHBORHOODS,
  holidays: HOLIDAYS,
  priceGrid: PRICE_GRID,
  users: [...USERS, ...CLAIM_USERS],
  agentZones: AGENT_ZONES,
  vendors: VENDORS,
  claimRequests: CLAIM_REQUESTS,
  claimCodes: CLAIM_CODES,
  pointsOfSale: POINTS_OF_SALE,
  posDayOverrides: [] as PosDayOverride[],
  media: MEDIA,
  dishCategories: DISH_CATEGORIES,
  dishes: DISHES,
  dailySpecials: DAILY_SPECIALS,
  favorites: FAVORITES,
  contacts: [...CONTACTS, ...QR_CONTACTS],
  followUps: FOLLOW_UPS,
  orderItems: [] as ContactOrderItem[],
  reviews: REVIEWS,
  reports: SAMPLE_REPORTS as Report[],
  notifications: [] as Notification[],
  subscriptions: SUBSCRIPTIONS,
  subscriptionZones: SUBSCRIPTION_ZONES,
  adSamples: AD_SAMPLES,
  waitlist: [] as WaitlistEntry[],
  posDailyStats: POS_DAILY_STATS,
  posDishDailyStats: POS_DISH_DAILY_STATS,
  subscriptionOrders: [] as SubscriptionOrder[],
  payments: [] as Payment[],
  zoneDaySlots: [] as ZoneDaySlot[],
  statsShareLinks: [] as StatsShareLink[],
  vendorNotices: [] as VendorNotice[],
  auditLogs: SAMPLE_AUDIT as AuditLog[],
  settings: { 'subscriptions.enabled': SUBSCRIPTIONS_ENABLED } as Record<string, unknown>,
  };
}

/** Une seule base fictive par processus serveur (survit au rechargement à chaud des modules en dev). */
const holder = globalThis as unknown as { __okareDb?: ReturnType<typeof createDb> };
export const db = (holder.__okareDb ??= createDb());

export type MockDb = typeof db;

/** Données d'affichage annexes (pas des tables). */
export const mockExtras = { zoneCenters: ZONE_CENTERS, reviewAuthors: REVIEW_AUTHORS };

export { DEMO_PASSWORD } from './users';
