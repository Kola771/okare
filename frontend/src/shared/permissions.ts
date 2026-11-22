/**
 * Permissions (OKARE_SPEC.md 5.2) : valeurs par défaut de RolePermission, modifiables par le super-admin (DB7).
 * Le périmètre (ses points pour le vendeur, ses zones pour l'agent) est vérifié par `canOnPos`.
 */
import type { Role } from './enums';
import type { Uuid } from './types';

const ALL: Role[] = ['CLIENT', 'VENDOR', 'FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'];
const MANAGERS: Role[] = ['VENDOR', 'FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'];
const TEAM: Role[] = ['FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'];
const ADMINS: Role[] = ['ADMIN', 'SUPER_ADMIN'];
const SUPER: Role[] = ['SUPER_ADMIN'];

export const DEFAULT_PERMISSIONS = {
  'pos.read.public': ALL,
  'contact.create': ALL,
  'favorite.manage': ALL,
  'followup.answer': ALL,
  'report.create': ALL,
  'review.create': ALL,
  'vendor.create': MANAGERS,
  'pos.create': MANAGERS,
  'pos.update': MANAGERS,
  'dish.manage': MANAGERS,
  'special.manage': MANAGERS,
  'hours.manage': MANAGERS,
  'qr.read': MANAGERS,
  'pos.stats.read': MANAGERS,
  'stats.share': MANAGERS,
  'review.reply': ['VENDOR', 'ADMIN', 'SUPER_ADMIN'],
  'subscription.buy': ['VENDOR'],
  'payment.link.send': TEAM,
  'subscription.complimentary': ADMINS,
  'payment.refund': SUPER,
  'pos.moderate': ADMINS,
  'review.moderate': ADMINS,
  'report.resolve': ADMINS,
  'responsetest.create': TEAM,
  'geo.read': TEAM,
  'geo.manage': ADMINS,
  'pricing.manage': ADMINS,
  'slots.manage': ADMINS,
  'user.manage': ADMINS,
  'role.assign': SUPER,
  'permission.manage': SUPER,
  'settings.manage': SUPER,
  'subscriptions.toggle': SUPER,
  'subscriptions.read': TEAM,
  'audit.read': ADMINS,
  'media.read': ADMINS,
} satisfies Record<string, Role[]>;

export type Permission = keyof typeof DEFAULT_PERMISSIONS;
export const PERMISSIONS = Object.keys(DEFAULT_PERMISSIONS) as Permission[];

/** Table effective rôle → permissions accordées (défauts + lignes RolePermission). */
export type PermissionTable = Record<Permission, Role[]>;

export function hasPermission(roles: Role[], perm: Permission, table: PermissionTable = DEFAULT_PERMISSIONS): boolean {
  return roles.some((r) => table[perm].includes(r));
}

export const isTeam = (roles: Role[]) => roles.some((r) => TEAM.includes(r));

export interface ScopeActor {
  id: Uuid;
  roles: Role[];
  /** Zones de l'agent (AgentZone). */
  agentZoneIds: Uuid[];
}

export interface ScopePos {
  zoneId: Uuid;
  vendorUserId: Uuid | null;
}

/** ScopeService.assertPos (5.3) : le geste est-il permis sur ce point de vente ? */
export function canOnPos(actor: ScopeActor, pos: ScopePos, perm: Permission, table: PermissionTable = DEFAULT_PERMISSIONS): boolean {
  const granted = (role: Role) => table[perm].includes(role) && actor.roles.includes(role);
  if (granted('SUPER_ADMIN') || granted('ADMIN')) return true;
  if (granted('FIELD_AGENT') && actor.agentZoneIds.includes(pos.zoneId)) return true;
  if (granted('VENDOR') && pos.vendorUserId === actor.id) return true;
  return false;
}
