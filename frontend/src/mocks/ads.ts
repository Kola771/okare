/**
 * Pubs (abonnements). Les tables restent vides : aucune pub ne change encore le classement côté client (spec 0ter.2).
 * `AD_SAMPLES` = exemples d'affichage pour le dashboard (DB3 onglet Pubs, DB8 « Mise en avant »), sans paiement réel.
 */
import type { AdPlan } from '@/shared/enums';
import type { Subscription, SubscriptionZone } from '@/shared/types';
import { POS, ZONE } from './ids';

export const SUBSCRIPTIONS_ENABLED = false;

export const SUBSCRIPTIONS: Subscription[] = [];

export const SUBSCRIPTION_ZONES: SubscriptionZone[] = [];

export type AdSampleStatus = 'ACTIVE' | 'PENDING_PAYMENT' | 'EXPIRED';

export interface AdSample {
  id: string; posId: string; plan: AdPlan; status: AdSampleStatus;
  /** Début, en jours par rapport à aujourd'hui (négatif = passé). */
  startOffset: number; days: number; zoneIds: string[]; amountXof: number;
}

export const AD_SAMPLES: AdSample[] = [
  { id: 'ad-1', posId: POS.mamanGanhi, plan: 'MONTH', status: 'ACTIVE', startOffset: -12, days: 30, zoneIds: [ZONE.GANHI, ZONE.HAIE_VIVE, ZONE.MISSEBO], amountXof: 13_500 },
  { id: 'ad-2', posId: POS.mamanGanhi, plan: 'PERIOD', status: 'EXPIRED', startOffset: -40, days: 7, zoneIds: [ZONE.GANHI], amountXof: 3_150 },
  { id: 'ad-3', posId: POS.bonGout, plan: 'PERIOD', status: 'PENDING_PAYMENT', startOffset: 1, days: 5, zoneIds: [ZONE.CADJEHOUN, ZONE.GBEGAMEY], amountXof: 2_250 },
  { id: 'ad-4', posId: POS.palmier, plan: 'DAY', status: 'ACTIVE', startOffset: 0, days: 1, zoneIds: [ZONE.AKPAKPA], amountXof: 300 },
];
