/**
 * Classe de visibilité d'un point de vente dans une zone, un jour donné — `getVisibilityClass` (OKARE_SPEC.md 11.0 f, 8.2).
 */
import type { AdPlan, SubscriptionStatus } from './enums';
import { businessDate } from './time';
import type { BusinessDate, IsoDateTime, Uuid } from './types';

export type VisibilityClass = 'PREMIUM' | 'PROMOTED' | 'STANDARD' | 'REDUCED';

/** Pub du point avec ses zones ciblées (Subscription + SubscriptionZone). */
export interface PosAd {
  plan: AdPlan;
  status: SubscriptionStatus;
  startDate: BusinessDate;
  endDate: BusinessDate;
  zoneIds: Uuid[];
}

export interface VisibilityInput {
  /** Setting subscriptions.enabled */
  subscriptionsEnabled: boolean;
  vendor: { subscriptionRequiredFrom: IsoDateTime | null };
  ads: PosAd[];
  /** Inscription active (WAITING / OFFERED) en liste d'attente faute de place. */
  onActiveWaitlist: boolean;
}

const runsOn = (ad: PosAd, date: BusinessDate) => ad.status === 'PAID' && ad.startDate <= date && date <= ad.endDate;

export function getVisibilityClass(input: VisibilityInput, zoneId: Uuid, now: Date): VisibilityClass {
  const date = businessDate(now);
  const running = input.ads.filter((a) => runsOn(a, date));
  const inZone = running.filter((a) => a.zoneIds.includes(zoneId));
  if (inZone.some((a) => a.plan === 'PREMIUM')) return 'PREMIUM';
  if (inZone.length > 0) return 'PROMOTED';
  if (!input.subscriptionsEnabled) return 'STANDARD';
  const from = input.vendor.subscriptionRequiredFrom;
  if (!from || new Date(from) > now) return 'STANDARD';
  if (input.onActiveWaitlist) return 'STANDARD';
  if (running.length > 0) return 'STANDARD';
  return 'REDUCED';
}

/** Ordre des paliers dans une zone (8.2) : plus petit = plus haut. `nearby` = point d'une autre zone. */
export function tierOf(cls: VisibilityClass, nearby: boolean): number {
  if (cls === 'PREMIUM') return 1;
  if (cls === 'PROMOTED') return 2;
  if (cls === 'STANDARD') return nearby ? 4 : 3;
  return 5;
}

/** Badge « Mis en avant » : paliers 1 et 2 seulement. Jamais de marquage négatif pour REDUCED (11.8). */
export const isPromoted = (cls: VisibilityClass) => cls === 'PREMIUM' || cls === 'PROMOTED';
