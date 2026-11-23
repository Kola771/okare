/**
 * Constantes métier (OKARE_SPEC.md section 23). Surchargeables par la table Setting sans redéploiement :
 * le serveur fusionne `withSettings(overrides)` au démarrage et à chaque modification.
 */
import type { AdPlan, PosType } from './enums';
import type { ZoneCategoryCode } from './types';

export const TIMEZONE = 'Africa/Porto-Novo';
/** UTC+1, sans heure d'été. */
export const TZ_OFFSET_MINUTES = 60;

export const PHONE_REGEX = /^\+2290[1-9]\d{8}$/;

export const BUSINESS_RULES = {
  vendorSelfService: true,
  subscriptions: { enabled: false, minVendorAgeDays: 30, noticeDays: 7, allowComplimentary: true, complimentaryMaxDays: 7 },
  ads: {
    maxZones: { DAY: 3, PERIOD: 5, MONTH: 7, PREMIUM: 15 } as Record<AdPlan, number>,
    periodMinDays: 2,
    periodMaxDays: 21,
    monthDays: 30,
    premiumDays: 30,
    discounts: {
      main: { DAY: 0, PERIOD: 10, MONTH: 10, PREMIUM: 5 } as Record<AdPlan, number>,
      other: { DAY: 20, PERIOD: 20, MONTH: 20, PREMIUM: 15 } as Record<AdPlan, number>,
    },
    premiumCoefficient: 1.5,
    mainPosWindowDays: 30,
    maxStartAheadDays: 60,
    sameDayCutoffHour: 15,
  },
  payments: { holdMinutes: 30, linkHoldHours: 24 },
  reviews: { minToDisplay: 5, windowDays: 14, maxCommentLength: 500 },
  contact: { dedupeMinutes: 30, maxCountedPerUserPerDay: 20 },
  followup: { minDelayMin: 10, maxDelayHours: 48, retryAfterHours: 3 },
  response: { window: 10, windowDays: 60, minSamples: 5, lowThreshold: 0.5 },
  freshness: { warnDays: 7, penaltyDays: 14, inactiveDays: 45 },
  special: { maxPerPosPerDay: 3 },
  hours: { closingSoonMinutes: 30, closedTodayReportThreshold: 2, reconfirmAfterDays: 60 },
  search: { nearbyRadiusMeters: 1500 },
  whatsappMessageTemplate:
    "Bonjour {posName}, je vous ai trouvé sur OKARE. {dishLine}Qu'est-ce que vous avez aujourd'hui ?\n\n{link}\n{siteUrl}",
};

export type BusinessRules = typeof BUSINESS_RULES;

/** Grille des prix d'un jour par zone (11.2), modifiable dans DB5. */
export const DEFAULT_PRICE_GRID: Record<ZoneCategoryCode, Record<PosType, number>> = {
  A: { PARTICULIER: 300, MAQUIS: 500, RESTAURANT: 800 },
  B: { PARTICULIER: 200, MAQUIS: 300, RESTAURANT: 500 },
  C: { PARTICULIER: 100, MAQUIS: 200, RESTAURANT: 300 },
};

/** Places de pub par zone et par jour, par catégorie (11.4). */
export const DEFAULT_DAILY_SLOTS: Record<ZoneCategoryCode, number> = { A: 20, B: 30, C: 60 };

/** Budgets proposés à l'accueil (pastilles « Mon budget »). `null` = sans limite. */
export const BUDGET_STEPS: (number | null)[] = [500, 1000, 2000, null];

/** Fusion profonde des valeurs de la table Setting sur les défauts. */
export function withSettings(overrides: Record<string, unknown>): BusinessRules {
  const rules = structuredClone(BUSINESS_RULES) as Record<string, unknown>;
  for (const [key, value] of Object.entries(overrides)) {
    const path = key.split('.');
    let node = rules;
    for (const part of path.slice(0, -1)) {
      if (typeof node[part] !== 'object' || node[part] === null) node[part] = {};
      node = node[part] as Record<string, unknown>;
    }
    node[path[path.length - 1]] = value;
  }
  return rules as BusinessRules;
}
