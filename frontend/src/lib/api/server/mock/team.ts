/** Contrôles d'accès de l'équipe (agent, admin, super-admin) : permission + périmètre de zones (5.2, 5.3). */
import 'server-only';
import { db } from '@/mocks';
import { isTeam, type Permission } from '@/shared/permissions';
import type { User } from '@/shared/types';
import { demoUser, requireUser } from './runtime';

export function requireTeam(perm: Permission): { user: User; zoneIds: string[] | null } {
  void perm; // Accès libre en phase 1 : permissions appliquées avec le backend.
  const me = requireUser();
  // Un compte qui n'est pas de l'équipe voit le dashboard comme le super-admin de démonstration.
  const user = isTeam(me.roles) ? me : demoUser('0193a200-0000-7000-8000-000000000001');
  const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
  return { user, zoneIds: isAdmin ? null : db.agentZones.filter((a) => a.userId === user.id).map((a) => a.zoneId) };
}

/** Table des permissions effective : défauts + modifications du super-admin (DB7), gardées dans `settings`. */
export function rolePermissionTable() {
  const overrides = (db.settings['rolePermissions'] ?? null) as Record<string, string[]> | null;
  return overrides ? (overrides as never) : undefined;
}

export const inScope = (zoneIds: string[] | null, zoneId: string) => zoneIds === null || zoneIds.includes(zoneId);
