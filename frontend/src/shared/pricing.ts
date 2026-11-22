/**
 * Prix d'une pub — fonction unique `quote()` (OKARE_SPEC.md 11.1 et 11.2), utilisée telle quelle par le front et l'API.
 *   DAY     = Σ prix d'un jour des zones
 *   PERIOD  = zone la plus chère × jours (2 à 21)
 *   MONTH   = zone la plus chère × 30
 *   PREMIUM = zone la plus chère × 30 × 1,5
 *   total   = arrondi à la dizaine supérieure de base × (1 − remise)
 */
import { BUSINESS_RULES, DEFAULT_PRICE_GRID, type BusinessRules } from './business-rules';
import type { AdPlan, PosType } from './enums';
import type { Zone, ZoneCategoryCode } from './types';

export class PricingError extends Error {
  constructor(public code: 'TOO_MANY_ZONES' | 'NO_ZONE' | 'PERIOD_OUT_OF_RANGE', message: string) {
    super(message);
  }
}

/** Arrondi à la dizaine supérieure (3.0 Conventions). */
export const roundUp10 = (x: number) => Math.ceil(Math.round(x * 100) / 100 / 10) * 10;

/** Prix d'un jour d'une zone pour un type de point de vente (override de la zone, sinon la grille). */
export function zoneDayPrice(
  zone: Pick<Zone, 'priceOverride'>,
  categoryCode: ZoneCategoryCode,
  posType: PosType,
  grid: Record<ZoneCategoryCode, Record<PosType, number>> = DEFAULT_PRICE_GRID,
): number {
  return zone.priceOverride?.[posType] ?? grid[categoryCode][posType];
}

export interface QuoteInput {
  plan: AdPlan;
  /** Prix d'un jour de chaque zone choisie, dans l'ordre du choix. */
  zoneDayPrices: number[];
  /** Nombre de jours (Période seulement ; ignoré sinon). */
  days?: number;
  isMainPos: boolean;
}

export interface Quote {
  plan: AdPlan;
  days: number;
  zonePrices: number[];
  /** Prix d'un jour de la zone la plus chère. */
  topDayPrice: number;
  baseXof: number;
  discountPct: number;
  discountXof: number;
  totalXof: number;
}

export function planDays(plan: AdPlan, days: number | undefined, rules: BusinessRules = BUSINESS_RULES): number {
  if (plan === 'DAY') return 1;
  if (plan === 'MONTH') return rules.ads.monthDays;
  if (plan === 'PREMIUM') return rules.ads.premiumDays;
  return days ?? 0;
}

export function quote(input: QuoteInput, rules: BusinessRules = BUSINESS_RULES): Quote {
  const { plan, zoneDayPrices, isMainPos } = input;
  const max = rules.ads.maxZones[plan];
  if (zoneDayPrices.length < 1) throw new PricingError('NO_ZONE', 'Choisis au moins une zone.');
  if (zoneDayPrices.length > max) throw new PricingError('TOO_MANY_ZONES', `${max} zones au plus pour cette formule.`);
  const days = planDays(plan, input.days, rules);
  if (plan === 'PERIOD' && (days < rules.ads.periodMinDays || days > rules.ads.periodMaxDays)) {
    throw new PricingError('PERIOD_OUT_OF_RANGE', `Une période dure de ${rules.ads.periodMinDays} à ${rules.ads.periodMaxDays} jours.`);
  }
  const top = Math.max(...zoneDayPrices);
  const baseXof =
    plan === 'DAY' ? zoneDayPrices.reduce((a, b) => a + b, 0)
    : plan === 'PREMIUM' ? Math.round(top * days * rules.ads.premiumCoefficient)
    : top * days;
  const discountPct = rules.ads.discounts[isMainPos ? 'main' : 'other'][plan];
  // Calcul en entiers (base × (100 − remise) / 1000) pour éviter les erreurs de virgule flottante.
  const totalXof = discountPct ? Math.ceil((baseXof * (100 - discountPct)) / 1000) * 10 : baseXof;
  return {
    plan, days, zonePrices: [...zoneDayPrices], topDayPrice: top,
    baseXof, discountPct, discountXof: baseXof - totalXof, totalXof,
  };
}

/** Total d'une commande de plusieurs lignes (un seul paiement FedaPay). */
export function quoteOrder(lines: QuoteInput[], rules: BusinessRules = BUSINESS_RULES) {
  const quotes = lines.map((l) => quote(l, rules));
  const subtotalXof = quotes.reduce((s, q) => s + q.baseXof, 0);
  const totalXof = quotes.reduce((s, q) => s + q.totalXof, 0);
  return { quotes, subtotalXof, discountXof: subtotalXof - totalXof, totalXof };
}

/** Contrôle des dates d'une Période (11.1) : message affiché à l'écran, ou null si valide. */
export function periodError(days: number, rules: BusinessRules = BUSINESS_RULES): string | null {
  if (days < rules.ads.periodMinDays) return 'Une période dure au moins 2 jours, sinon prends Un jour.';
  if (days > rules.ads.periodMaxDays) {
    return `Une période dure ${rules.ads.periodMaxDays} jours au plus. Choisis une date de fin plus tôt, ou prends Un mois.`;
  }
  return null;
}
