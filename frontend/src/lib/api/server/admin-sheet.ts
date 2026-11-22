/**
 * Fiche d'un point côté équipe (DB3) — GET /team/pos/:id/sheet · GET /team/pos/:id/ads · GET /team/ads.
 * Les pubs sont des exemples d'affichage (aucun paiement en phase 1).
 */
import 'server-only';
import { db } from '@/mocks';
import type { AdSampleStatus } from '@/mocks/ads';
import { addDays, businessDate } from '@/shared/time';
import type { AdPlan } from '@/shared/enums';
import { posInfoOf, type PosInfo } from './pos-manage';
import { assertPos } from './mock/manage';
import { mockNow, simulate } from './mock/runtime';
import { requireTeam } from './mock/team';

export interface PosSheet {
  info: PosInfo;
  location: { lat: number; lng: number }; accuracyM: number | null;
  whatsappVerifiedAt: string | null; consentAt: string;
  vendor: { id: string; name: string; hasAccount: boolean }; agentName: string | null;
  featuredUntil: string | null; specialPublishedAt: string | null;
}

export interface AdRow { id: string; plan: AdPlan; status: AdSampleStatus; start: string; end: string; zones: string[]; amountXof: number }

function adRows(posId: string): AdRow[] {
  const today = businessDate(mockNow());
  return db.adSamples.filter((a) => a.posId === posId).map((a) => ({
    id: a.id, plan: a.plan, status: a.status, amountXof: a.amountXof,
    start: addDays(today, a.startOffset), end: addDays(today, a.startOffset + a.days - 1),
    zones: a.zoneIds.map((z) => db.zones.find((x) => x.id === z)?.name ?? '—'),
  }));
}

/** Date de fin de la mise en avant en cours (null si aucune). */
export function featuredUntil(posId: string): string | null {
  return adRows(posId).find((a) => a.status === 'ACTIVE')?.end ?? null;
}

export function getPosSheet(posId: string): Promise<PosSheet> {
  return simulate(() => {
    const { pos } = assertPos(posId, 'pos.update');
    const vendor = db.vendors.find((v) => v.id === pos.vendorId)!;
    const today = businessDate(mockNow());
    const special = db.dailySpecials.filter((s) => s.posId === pos.id && s.businessDate === today).sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    return {
      info: posInfoOf(pos), location: pos.location, accuracyM: pos.locationAccuracyM,
      whatsappVerifiedAt: pos.whatsappVerifiedAt, consentAt: pos.consentAt,
      vendor: { id: vendor.id, name: vendor.contactName ?? vendor.displayName, hasAccount: !!vendor.userId },
      agentName: db.users.find((u) => u.id === vendor.followedById)?.fullName ?? null,
      featuredUntil: featuredUntil(pos.id), specialPublishedAt: special?.createdAt ?? null,
    };
  });
}

export function getPosAds(posId: string): Promise<AdRow[]> {
  return simulate(() => {
    const { pos } = assertPos(posId, 'pos.update');
    return adRows(pos.id);
  });
}

/** État « mise en avant » par vendeur (colonne de DB8). */
export function vendorAdLabel(vendorId: string): string {
  const posIds = db.pointsOfSale.filter((p) => p.vendorId === vendorId).map((p) => p.id);
  const ads = db.adSamples.filter((a) => posIds.includes(a.posId));
  const active = ads.filter((a) => a.status === 'ACTIVE').length;
  if (active) return `${active} en cours`;
  if (ads.some((a) => a.status === 'PENDING_PAYMENT')) return 'Paiement à confirmer';
  return '—';
}

export function listAdsOverview(): Promise<{ active: number; pending: number }> {
  return simulate(() => {
    requireTeam('subscriptions.read');
    return { active: db.adSamples.filter((a) => a.status === 'ACTIVE').length, pending: db.adSamples.filter((a) => a.status === 'PENDING_PAYMENT').length };
  });
}
