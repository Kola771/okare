/**
 * Tables « Comptes et accès » (schema.prisma section 1).
 * Conventions TypeScript : DateTime → chaîne ISO ; @db.Date → 'YYYY-MM-DD' ; uuid → string.
 */
import type { NotificationType, Role } from '../enums';

export type Uuid = string;
export type IsoDateTime = string;
/** Jour métier (heure de Porto-Novo), format 'YYYY-MM-DD'. */
export type BusinessDate = string;
export type Json = unknown;

export interface User {
  id: Uuid;
  phone: string | null;
  email: string | null;
  googleSub: string | null;
  passwordHash: string | null;
  fullName: string | null;
  avatarMediaId: Uuid | null;
  roles: Role[];
  homeZoneId: Uuid | null;
  budgetMaxXof: number | null;
  notifyFavorites: boolean;
  askFollowUp: boolean;
  notifyNews: boolean;
  phoneVerifiedAt: IsoDateTime | null;
  totpSecret: string | null;
  totpEnabledAt: IsoDateTime | null;
  isBlocked: boolean;
  blockedReason: string | null;
  lastSeenAt: IsoDateTime | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  deletedAt: IsoDateTime | null;
}

export interface Session {
  id: Uuid;
  userId: Uuid;
  tokenHash: string;
  deviceId: string | null;
  userAgent: string | null;
  ipHash: string | null;
  expiresAt: IsoDateTime;
  revokedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
}

export interface RolePermission {
  role: Role;
  permission: string;
  granted: boolean;
  updatedById: Uuid | null;
  updatedAt: IsoDateTime;
}

export interface AgentZone {
  userId: Uuid;
  zoneId: Uuid;
  assignedById: Uuid;
  createdAt: IsoDateTime;
}

export interface PushSubscription {
  id: Uuid;
  userId: Uuid;
  endpoint: string;
  keys: Json;
  userAgent: string | null;
  lastUsedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
}

export interface Notification {
  id: Uuid;
  userId: Uuid;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  data: Json | null;
  readAt: IsoDateTime | null;
  pushedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
}
