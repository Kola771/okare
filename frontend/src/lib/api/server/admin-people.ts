/**
 * Utilisateurs, rôles, signalements, audit, médias, paramètres (DB6, DB7, DB9, DB10, DB11, DB12).
 */
import 'server-only';
import { db } from '@/mocks';
import { maskPhone } from '@/shared/format';
import { DEFAULT_PERMISSIONS, type Permission } from '@/shared/permissions';
import type { ReportReason, ReportStatus, Role } from '@/shared/enums';
import { ApiError, ERR } from '../errors';
import { audit } from './mock/manage';
import { persist, simulate } from './mock/runtime';
import { requireTeam, rolePermissionTable } from './mock/team';

export interface AdminUserRow { id: string; name: string; contact: string; roles: Role[]; login: string; totp: string; scope: string; lastSeen: string | null; blocked: boolean }

export function listUsers(): Promise<AdminUserRow[]> {
  return simulate(() => {
    const { user: me } = requireTeam('user.manage');
    const superAdmin = me.roles.includes('SUPER_ADMIN');
    return db.users.filter((u) => !u.deletedAt).map((u) => {
      const team = u.roles.some((r) => r === 'FIELD_AGENT' || r === 'ADMIN' || r === 'SUPER_ADMIN');
      const zones = db.agentZones.filter((a) => a.userId === u.id).map((a) => db.zones.find((z) => z.id === a.zoneId)?.name).join(', ');
      const points = db.pointsOfSale.filter((p) => db.vendors.find((v) => v.id === p.vendorId)?.userId === u.id).length;
      return {
        id: u.id, name: u.fullName ?? 'Client', roles: u.roles, blocked: u.isBlocked, lastSeen: u.lastSeenAt ?? u.updatedAt,
        // Numéros des clients masqués pour tous sauf le super-admin (5.3).
        contact: u.email ?? (team || u.roles.includes('VENDOR') || superAdmin ? u.phone ?? '' : maskPhone(u.phone)),
        login: u.googleSub ? 'Google' : 'Téléphone', totp: team ? (u.totpEnabledAt ? 'Activée' : 'À activer') : '—',
        scope: u.roles.includes('ADMIN') || u.roles.includes('SUPER_ADMIN') ? 'Toutes' : zones || (points ? `${points} point${points > 1 ? 's' : ''} de vente` : '—'),
      };
    });
  });
}

export function setUserBlocked(userId: string, blocked: boolean, reason?: string): Promise<{ ok: true }> {
  return simulate(() => {
    const { user } = requireTeam('user.manage');
    const u = db.users.find((x) => x.id === userId);
    if (!u) throw new ApiError(ERR.NOT_FOUND, 'Utilisateur introuvable.', 404);
    if (u.id === user.id) throw new ApiError(ERR.FORBIDDEN, 'Tu ne peux pas te bloquer toi-même.', 403);
    Object.assign(u, { isBlocked: blocked, blockedReason: blocked ? reason ?? null : null });
    audit(user, blocked ? 'user.block' : 'user.unblock', 'User', u.id, null, { reason });
    persist();
    return { ok: true as const };
  });
}

export function setUserRoles(userId: string, roles: Role[]): Promise<{ ok: true }> {
  return simulate(() => {
    const { user } = requireTeam('role.assign');
    const u = db.users.find((x) => x.id === userId);
    if (!u) throw new ApiError(ERR.NOT_FOUND, 'Utilisateur introuvable.', 404);
    const before = u.roles;
    u.roles = roles.length ? roles : ['CLIENT'];
    audit(user, 'role.assign', 'User', u.id, { roles: before }, { roles: u.roles });
    persist();
    return { ok: true as const };
  });
}

export function getRolePermissions(): Promise<Record<Permission, Role[]>> {
  return simulate(() => {
    requireTeam('audit.read');
    return (rolePermissionTable() as Record<Permission, Role[]> | undefined) ?? { ...DEFAULT_PERMISSIONS };
  });
}

export function setRolePermission(role: Role, perm: Permission, granted: boolean): Promise<{ ok: true }> {
  return simulate(() => {
    const { user } = requireTeam('permission.manage');
    const table = { ...((rolePermissionTable() as Record<Permission, Role[]> | undefined) ?? DEFAULT_PERMISSIONS) };
    const cur = new Set(table[perm]);
    if (granted) cur.add(role);
    else cur.delete(role);
    table[perm] = [...cur];
    db.settings['rolePermissions'] = table;
    audit(user, 'permission.update', 'RolePermission', user.id, null, { role, perm, granted });
    persist();
    return { ok: true as const };
  });
}

export interface AdminReportRow { id: string; posName: string; posType: string; zone: string; reason: ReportReason; comment: string | null; at: string; status: ReportStatus; effect: string; resolution: string | null }

const EFFECT: Partial<Record<ReportReason, string>> = {
  FRAUD: 'Masqué automatiquement', FOOD_SAFETY: 'Masqué automatiquement', INAPPROPRIATE: 'Masqué automatiquement',
  CLOSED_TODAY: 'Peut-être fermé', NO_ANSWER: 'Agent prévenu',
};

export function listReports(): Promise<AdminReportRow[]> {
  return simulate(() => {
    requireTeam('report.resolve');
    return [...db.reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r) => {
      const pos = db.pointsOfSale.find((p) => p.id === r.posId);
      return { id: r.id, posName: pos?.name ?? '—', posType: pos?.type ?? '', zone: db.zones.find((z) => z.id === pos?.zoneId)?.name ?? '',
        reason: r.reason, comment: r.comment, at: r.createdAt, status: r.status, effect: EFFECT[r.reason] ?? 'À vérifier', resolution: r.resolution };
    });
  });
}

export function resolveReport(id: string, status: 'RESOLVED' | 'REJECTED', resolution: string): Promise<{ ok: true }> {
  return simulate(() => {
    const { user } = requireTeam('report.resolve');
    const r = db.reports.find((x) => x.id === id);
    if (!r) throw new ApiError(ERR.NOT_FOUND, 'Signalement introuvable.', 404);
    Object.assign(r, { status, resolution, resolvedById: user.id, resolvedAt: new Date().toISOString() });
    audit(user, `report.${status.toLowerCase()}`, 'Report', r.id, null, { resolution });
    persist();
    return { ok: true as const };
  });
}

export function listAudit(): Promise<{ id: string; at: string; who: string; role: string; action: string; detail: string; object: string }[]> {
  return simulate(() => {
    requireTeam('audit.read');
    return db.auditLogs.slice(0, 200).map((a) => ({
      id: a.id, at: a.createdAt, action: a.action, object: a.entityType,
      who: a.actorId ? db.users.find((u) => u.id === a.actorId)?.fullName ?? 'Équipe' : 'FedaPay', role: a.actorRole ?? 'Automatique',
      detail: a.after ? Object.entries(a.after as Record<string, unknown>).map(([k, v]) => `${k} : ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`).join(' · ').slice(0, 160) : '',
    }));
  });
}

export function getSettings(): Promise<Record<string, unknown>> {
  return simulate(() => {
    requireTeam('settings.manage');
    return {
      whatsappTemplate: 'Bonjour {posName}, je vous ai trouvé sur OKARE. {dishLine}Qu’est-ce que vous avez aujourd’hui ?', reviewsMinToDisplay: 5,
      vendorSelfService: true, minVendorAgeDays: 30, noticeDays: 7, vendorChannel: 'API', allowComplimentary: true,
      announceTemplate: 'Bonjour {prenom}, merci d’être sur OKARE depuis {anciennete}. À partir du {date}, la mise en avant de {point} coûte {prix_jour} par jour : {lien}',
      fedapayMode: 'production', holdMinutes: 30, prospectThreshold: 5, teamTotp: true,
      ...((db.settings['admin'] ?? {}) as object),
    };
  });
}

export function saveSettings(values: Record<string, unknown>): Promise<{ ok: true }> {
  return simulate(() => {
    const { user } = requireTeam('settings.manage');
    db.settings['admin'] = values;
    audit(user, 'settings.update', 'Setting', user.id, null, values);
    persist();
    return { ok: true as const };
  });
}
