import { describe, expect, it } from 'vitest';
import { DEFAULT_PRICE_GRID as G } from '../business-rules';
import { periodError, PricingError, quote, quoteOrder } from '../pricing';

describe('quote (11.2)', () => {
  it('exemple de la maquette : 10 350 F', () => {
    const order = quoteOrder([
      { plan: 'PERIOD', zoneDayPrices: [G.A.MAQUIS, G.B.MAQUIS, G.A.MAQUIS], days: 7, isMainPos: true },
      { plan: 'MONTH', zoneDayPrices: [G.C.MAQUIS, G.B.MAQUIS], isMainPos: false },
    ]);
    expect(order.quotes[0].totalXof).toBe(3150);
    expect(order.quotes[1].baseXof).toBe(9000);
    expect(order.quotes[1].totalXof).toBe(7200);
    expect(order.totalXof).toBe(10350);
  });

  it('Un jour = somme des zones, sans remise pour le point principal', () => {
    const q = quote({ plan: 'DAY', zoneDayPrices: [500, 300, 200], isMainPos: true });
    expect(q.baseXof).toBe(1000);
    expect(q.totalXof).toBe(1000);
    expect(quote({ plan: 'DAY', zoneDayPrices: [500, 300, 200], isMainPos: false }).totalXof).toBe(800);
  });

  it('Mois et Premium (tableau 11.2)', () => {
    expect(quote({ plan: 'MONTH', zoneDayPrices: [500], isMainPos: true }).totalXof).toBe(13500);
    expect(quote({ plan: 'MONTH', zoneDayPrices: [500], isMainPos: false }).totalXof).toBe(12000);
    expect(quote({ plan: 'PREMIUM', zoneDayPrices: [500], isMainPos: true }).totalXof).toBe(21380);
    expect(quote({ plan: 'PREMIUM', zoneDayPrices: [500], isMainPos: false }).totalXof).toBe(19130);
  });

  it('limite de zones par formule', () => {
    const z = (n: number) => Array(n).fill(200);
    expect(() => quote({ plan: 'DAY', zoneDayPrices: z(4), isMainPos: true })).toThrow(PricingError);
    expect(() => quote({ plan: 'PERIOD', zoneDayPrices: z(6), days: 3, isMainPos: true })).toThrow(PricingError);
    expect(() => quote({ plan: 'MONTH', zoneDayPrices: z(8), isMainPos: true })).toThrow(PricingError);
    expect(() => quote({ plan: 'PREMIUM', zoneDayPrices: z(16), isMainPos: true })).toThrow(PricingError);
    expect(() => quote({ plan: 'PREMIUM', zoneDayPrices: z(15), isMainPos: true })).not.toThrow();
  });

  it('Période : 2 et 21 jours acceptés, 1 et 22 refusés', () => {
    const p = (days: number) => () => quote({ plan: 'PERIOD', zoneDayPrices: [300], days, isMainPos: true });
    expect(p(2)).not.toThrow();
    expect(p(21)).not.toThrow();
    expect(p(1)).toThrow(PricingError);
    expect(p(22)).toThrow(PricingError);
    expect(periodError(1)).toMatch(/au moins 2 jours/);
    expect(periodError(22)).toMatch(/21 jours au plus/);
    expect(periodError(7)).toBeNull();
  });

  it('arrondi à la dizaine supérieure', () => {
    expect(quote({ plan: 'PERIOD', zoneDayPrices: [300], days: 3, isMainPos: true }).totalXof).toBe(810);
    expect(quote({ plan: 'PERIOD', zoneDayPrices: [100], days: 3, isMainPos: false }).totalXof).toBe(240);
  });
});
