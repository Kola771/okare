'use client';

/**
 * Coquille de l'espace vendeur (/seller) : barre du bas « Accueil, Points de vente, Profil » sur téléphone,
 * coquille « admin template » sur ordinateur (VD1–VD7). Accès libre en phase 1 (pas de connexion demandée).
 */
import { Home, Store, User } from 'lucide-react';
import { AdminShell, type NavSection } from '@/components/admin/AdminShell';
import { useSession } from '@/components/providers/SessionProvider';
import { PointsMenu, type MenuPoint } from './PointsMenu';

const SECTIONS: NavSection[] = [
  { title: 'MON COMMERCE', items: [
    { href: '/seller', label: 'Accueil', icon: Home, exact: true },
    { href: '/seller/points', label: 'Mes points de vente', icon: Store },
  ] },
  { title: 'COMPTE', items: [{ href: '/seller/profile', label: 'Profil', icon: User }] },
];

/** Espace vendeur : 3 entrées seulement (spec 0ter.3, 14). Tout ce qui concerne un point passe par sa « Gestion ». */
const MOBILE = [
  { href: '/seller', label: 'Accueil', icon: Home, exact: true },
  { href: '/seller/points', label: 'Points de vente', icon: Store },
  { href: '/seller/profile', label: 'Profil', icon: User },
];

export function SellerShell({ children, points }: { children: React.ReactNode; points: MenuPoint[] }) {
  const { me } = useSession();
  const name = me?.roles.includes('VENDOR') ? me.fullName ?? 'Vendeur' : 'Maman Afi';
  return (
    <AdminShell tag="VENDEUR" sections={SECTIONS} mobileNav={MOBILE} searchPlaceholder="Rechercher un plat…"
      user={{ initials: name[0]?.toUpperCase() ?? 'V', name, role: 'Vendeur' }}
      aside={<>Besoin d’aide ? Ton agent OKARE : <b className="text-charbon">Agent Ganhi</b>.</>}
      headerExtra={<PointsMenu points={points} />}>
      {children}
    </AdminShell>
  );
}
