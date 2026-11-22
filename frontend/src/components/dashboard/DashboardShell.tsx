'use client';

/**
 * Coquille du dashboard (agent, admin, super-admin) : menu filtré par permissions (5.2) ; un agent ne voit que ses zones.
 * Mobile (DM1–DM5) : barre du bas Accueil / Points / Plus.
 */
import { BarChart3, FileClock, Flag, Globe2, Image, LayoutDashboard, Link2, Map, MoreHorizontal, Settings, ShieldCheck, Store, Users, UsersRound } from 'lucide-react';
import { AdminShell, type NavItem, type NavSection } from '@/components/admin/AdminShell';
import { useSession } from '@/components/providers/SessionProvider';
import { hasPermission, isTeam, type Permission } from '@/shared/permissions';
import type { Role } from '@/shared/enums';

type Item = NavItem & { perm: Permission };
const SECTIONS: { title: string; items: Item[] }[] = [
  { title: 'PILOTAGE', items: [{ href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, exact: true, perm: 'pos.update' }] },
  { title: 'TERRAIN', items: [
    { href: '/dashboard/points', label: 'Points de vente', icon: Store, perm: 'pos.update' },
    { href: '/dashboard/vendors', label: 'Vendeurs', icon: UsersRound, perm: 'pos.update' },
    { href: '/dashboard/claims', label: 'Rattachements', icon: Link2, perm: 'pos.moderate' },
    { href: '/dashboard/media', label: 'Médiathèque', icon: Image, perm: 'media.read' },
  ] },
  { title: 'ADMINISTRATION', items: [
    { href: '/dashboard/geography', label: 'Pays, villes, quartiers', icon: Globe2, perm: 'geo.read' },
    { href: '/dashboard/zones', label: 'Zones', icon: Map, perm: 'geo.read' },
    { href: '/dashboard/users', label: 'Utilisateurs', icon: Users, perm: 'user.manage' },
    { href: '/dashboard/roles', label: 'Rôles et permissions', icon: ShieldCheck, perm: 'audit.read' },
    { href: '/dashboard/reports', label: 'Signalements', icon: Flag, perm: 'report.resolve', badge: 4 },
    { href: '/dashboard/audit', label: 'Journal d’audit', icon: FileClock, perm: 'audit.read' },
    { href: '/dashboard/settings', label: 'Paramètres', icon: Settings, perm: 'settings.manage' },
  ] },
];

export function visibleSections(roles: Role[]): NavSection[] {
  return SECTIONS.map((s) => ({ title: s.title, items: s.items.filter((i) => hasPermission(roles, i.perm)) })).filter((s) => s.items.length);
}

const MOBILE: NavItem[] = [
  { href: '/dashboard', label: 'Accueil', icon: BarChart3, exact: true },
  { href: '/dashboard/points', label: 'Points', icon: Store },
  { href: '/dashboard/more', label: 'Plus', icon: MoreHorizontal },
];

/** Rôles qui décident du menu : ceux du compte d'équipe, sinon super-admin (accès libre en phase 1). */
export const dashboardRoles = (me: { roles: Role[] } | null): Role[] => (me && isTeam(me.roles) ? me.roles : ['SUPER_ADMIN']);

const ROLE_LABEL: Partial<Record<Role, string>> = { SUPER_ADMIN: 'Super-admin', ADMIN: 'Admin', FIELD_AGENT: 'Agent terrain' };

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { me } = useSession();
  const team = !!me && isTeam(me.roles);
  const role = me?.roles.find((r) => ROLE_LABEL[r]);
  const name = team ? me?.fullName ?? 'Équipe' : 'Super Admin OKARE';
  return (
    <AdminShell tag="DASHBOARD" sections={visibleSections(dashboardRoles(me))} mobileNav={MOBILE}
      searchPlaceholder="Rechercher un point de vente, un vendeur, un numéro…"
      
      user={{ initials: name[0]?.toUpperCase() ?? 'O', name, role: role ? ROLE_LABEL[role]! : 'Super-admin' }}
      aside={<>Les menus affichés dépendent du rôle : un agent ne voit que <b className="text-charbon">Terrain</b> et ses zones.</>}>
      {children}
    </AdminShell>
  );
}
