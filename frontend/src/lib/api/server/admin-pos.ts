/**
 * Points de vente et vendeurs côté équipe (DB2, DB3, DB8, écran 9, DM2, DM3) —
 * GET /team/pos?filter= · POST /admin/pos/:id/(suspend|reactivate|archive|restore) · GET /vendors.
 */
import 'server-only';
import { db } from '@/mocks';
import { addDays, businessDate, daysInclusive } from '@/shared/time';
import type { PosStatus, PosType } from '@/shared/enums';
import type { ManagedPos } from '../seller-dto';
import { ApiError, ERR } from '../errors';
import { assertPos, audit, contactsBetween, managedPos } from './mock/manage';
import { mockNow, persist, simulate } from './mock/runtime';
import { inScope, requireTeam } from './mock/team';
import { vendorAdLabel } from './admin-sheet';
import { inPeriod, posInPlace, zonesOf } from './mock/filters';
import type { TeamFilter } from '@/shared/team-filter';

export type PosFilter = 'all' | 'pending' | 'prices' | 'lowResponse' | 'suspended' | 'inactive' | 'potential';

export interface AdminPosRow extends ManagedPos {
  vendorName: string;
  vendorId: string;
  pricesStaleDays: number | null;
}

/** `f` : lieu (pays, ville, zone, quartier) et période de création du point (publishedAt, sinon createdAt). */
export function listTeamPos(filter: PosFilter = 'all', zoneId?: string, type?: PosType, f: TeamFilter = {}): Promise<AdminPosRow[]> {
  return simulate(() => {
    const { zoneIds } = requireTeam('pos.update');
    const now = mockNow();
    const zones = zonesOf(f);
    const rows = db.pointsOfSale.filter((p) => !p.deletedAt && inScope(zoneIds, p.zoneId) && (!zoneId || p.zoneId === zoneId) && (!type || p.type === type)
        && posInPlace(p, f, zones) && inPeriod(p.publishedAt ?? p.createdAt, f))
      .map((p) => {
        const days = p.pricesCheckedAt ? Math.floor((now.getTime() - new Date(p.pricesCheckedAt).getTime()) / 86_400_000) : null;
        return { ...managedPos(p, now), vendorId: p.vendorId, vendorName: db.vendors.find((v) => v.id === p.vendorId)?.contactName ?? '', pricesStaleDays: days };
      });
    return rows.filter((r) => {
      if (filter === 'pending') return r.status === 'PENDING';
      if (filter === 'suspended') return r.status === 'SUSPENDED';
      if (filter === 'prices') return (r.pricesStaleDays ?? 99) >= 7;
      if (filter === 'lowResponse') return r.responseRate != null && r.responseRate < 0.5;
      if (filter === 'inactive') return (r.pricesStaleDays ?? 99) > 45 && r.contacts7d === 0;
      if (filter === 'potential') return r.contacts7d >= 5;
      return true;
    }).sort((a, b) => b.contacts7d - a.contacts7d);
  });
}

export type ModerationAction = 'hold' | 'publish' | 'suspend' | 'reactivate' | 'archive';
const NEXT: Record<ModerationAction, PosStatus> = { hold: 'PENDING', publish: 'PUBLISHED', suspend: 'SUSPENDED', reactivate: 'PUBLISHED', archive: 'ARCHIVED' };

/** Cycle de vie (12.7) : attente / remise en ligne / archivage pour les ayants droit ; suspension réservée aux admins, motif obligatoire. */
export function moderatePos(posId: string, action: ModerationAction, reason?: string): Promise<{ ok: true }> {
  return simulate(() => {
    const admin = action === 'suspend' || action === 'reactivate';
    const { user, pos } = assertPos(posId, admin ? 'pos.moderate' : 'pos.update');
    if (action === 'suspend' && !reason?.trim()) throw new ApiError(ERR.VALIDATION, 'Motif obligatoire pour suspendre.', 400);
    const before = pos.status;
    pos.status = NEXT[action];
    pos.version += 1;
    audit(user, `pos.${action}`, 'PointOfSale', pos.id, { status: before }, { status: pos.status, reason });
    persist();
    return { ok: true as const };
  });
}

export interface AdminVendorRow {
  id: string; name: string; contactName: string | null; phone: string; points: { id: string; name: string }[];
  hasAccount: boolean; agentName: string | null; ageDays: number; contacts30: number; mainPosId: string | null; adLabel: string;
}

/** `f` : vendeurs ayant un point dans le lieu choisi, arrivés (première publication) dans la période. */
export function listVendors(f: TeamFilter = {}): Promise<AdminVendorRow[]> {
  return simulate(() => {
    const { zoneIds } = requireTeam('pos.update');
    const zones = zonesOf(f);
    const today = businessDate(mockNow());
    return db.vendors.filter((v) => !v.deletedAt).map((v) => {
      const pts = db.pointsOfSale.filter((p) => p.vendorId === v.id && !p.deletedAt);
      return {
        id: v.id, name: v.displayName, contactName: v.contactName, phone: v.contactPhone, points: pts.map((p) => ({ id: p.id, name: p.name })),
        hasAccount: !!v.userId, agentName: db.users.find((u) => u.id === v.followedById)?.fullName ?? null,
        ageDays: v.firstPublishedAt ? daysInclusive(businessDate(new Date(v.firstPublishedAt)), today) - 1 : 0,
        contacts30: pts.reduce((n, p) => n + contactsBetween(p.id, addDays(today, -30), addDays(today, -1)), 0), mainPosId: v.mainPosId,
        adLabel: vendorAdLabel(v.id),
        zoneOk: pts.some((p) => (zoneIds === null || zoneIds.includes(p.zoneId)) && posInPlace(p, f, zones)) && inPeriod(v.firstPublishedAt ?? v.createdAt, f),
      };
    }).filter((v) => v.zoneOk).map(({ zoneOk: _z, ...v }) => v).sort((a, b) => b.contacts30 - a.contacts30);
  });
}

/** Historique d'un point de vente (journal d'audit filtré) — onglet « Historique » de DB3. */
export function getPosHistory(posId: string): Promise<{ id: string; at: string; who: string; action: string }[]> {
  return simulate(() => {
    const { pos } = assertPos(posId, 'pos.update');
    const dishIds = db.dishes.filter((d) => d.posId === pos.id).map((d) => d.id);
    return db.auditLogs.filter((a) => a.entityId === pos.id || dishIds.includes(a.entityId)).map((a) => ({
      id: a.id, at: a.createdAt, action: a.action, who: a.actorId ? db.users.find((u) => u.id === a.actorId)?.fullName ?? 'Équipe' : 'Système' }));
  });
}
