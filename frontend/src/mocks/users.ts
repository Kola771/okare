/** Comptes fictifs : un par rôle (SEED_DEMO), mot de passe commun « okare2026 » en phase 1. */
import type { AgentZone, User } from '@/shared/types';
import type { Role } from '@/shared/enums';
import { isoDaysAgo, T0, USER, ZONE } from './ids';

export const DEMO_PASSWORD = 'okare2026';

function user(id: string, phone: string, fullName: string | null, roles: Role[], extra: Partial<User> = {}): User {
  return {
    id, phone, email: null, googleSub: null, passwordHash: 'mock', fullName, avatarMediaId: null, roles,
    homeZoneId: ZONE.GANHI, budgetMaxXof: 1000, notifyFavorites: true, askFollowUp: true, notifyNews: false,
    phoneVerifiedAt: T0, totpSecret: null, totpEnabledAt: null, isBlocked: false, blockedReason: null,
    lastSeenAt: null, createdAt: T0, updatedAt: T0, deletedAt: null, ...extra,
  };
}

export const USERS: User[] = [
  user(USER.superAdmin, '+2290190000001', 'Super Admin OKARE', ['SUPER_ADMIN'], { totpEnabledAt: T0, lastSeenAt: isoDaysAgo(2 / 1440) }),
  user(USER.admin, '+2290190000002', 'Admin OKARE', ['ADMIN'], { lastSeenAt: isoDaysAgo(3) }),
  user(USER.agentGanhi, '+2290190000003', 'Agent Ganhi', ['FIELD_AGENT'], { totpEnabledAt: T0, lastSeenAt: isoDaysAgo(1 / 24) }),
  user(USER.vendorMaman, '+2290197000001', 'Maman Afi', ['CLIENT', 'VENDOR'], { lastSeenAt: isoDaysAgo(1) }),
  user(USER.vendorRose, '+2290197000003', 'Rose Hounkpè', ['CLIENT', 'VENDOR']),
  user(USER.vendorSenami, '+2290197000005', 'Sènami Dossou', ['CLIENT', 'VENDOR']),
  user(USER.vendorBio, '+2290197000004', 'Bio Guéra', ['CLIENT', 'VENDOR']),
  user(USER.clientAicha, '+2290196000012', 'Aïcha Houngbo', ['CLIENT'], { createdAt: '2026-10-04T09:00:00.000Z', lastSeenAt: isoDaysAgo(0.1) }),
  user(USER.clientKoffi, '+2290196000047', null, ['CLIENT'], { homeZoneId: ZONE.CADJEHOUN }),
];

export const AGENT_ZONES: AgentZone[] = [
  { userId: USER.agentGanhi, zoneId: ZONE.GANHI, assignedById: USER.superAdmin, createdAt: T0 },
  { userId: USER.agentGanhi, zoneId: ZONE.MISSEBO, assignedById: USER.superAdmin, createdAt: T0 },
];
