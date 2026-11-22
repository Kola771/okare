/**
 * Registre de tous les écrans de la maquette (design/maquette/index.html) avec leur adresse.
 * `ready` = construit. `as` = rôle de démonstration conseillé pour le voir. `demo` = fenêtre à ouvrir (?demo=).
 */
import type { DemoRole } from '@/lib/api';

export interface ScreenEntry {
  code: string;
  title: string;
  href: string;
  ready: boolean;
  as?: DemoRole;
}

export interface ScreenGroup {
  title: string;
  screens: ScreenEntry[];
}

export const SCREEN_GROUPS: ScreenGroup[] = [
  {
    title: 'Client — mobile et desktop',
    screens: [
      { code: '1 · D1', title: 'Accueil (liste + carte sur desktop)', href: '/', ready: true },
      { code: '2 · D2', title: 'Page du point de vente', href: '/p/chez-maman-ganhi', ready: true },
      { code: '22 · D8', title: 'Page du plat', href: '/p/chez-maman-ganhi/dish/riz-sauce-arachide-poisson', ready: true },
      { code: '3 · D5', title: 'Inscription avant contact (fenêtre)', href: '/?demo=signup', ready: true, as: 'VISITOR' },
      { code: '10 · D6', title: 'Suivi après commande d’un plat (fenêtre)', href: '/?demo=followup', ready: true, as: 'CLIENT' },
      { code: '10b · D6b', title: 'Suivi après contact du point de vente (fenêtre)', href: '/?demo=followup-pos', ready: true, as: 'CLIENT' },
      { code: '11', title: 'Carte (mobile ; intégrée à l’accueil sur desktop)', href: '/map', ready: true },
      { code: '12 · D4', title: 'Connexion', href: '/login', ready: true, as: 'VISITOR' },
      { code: '13 · D7', title: 'Compte et profil', href: '/account', ready: true, as: 'CLIENT' },
      { code: '14', title: 'Je suis vendeur : relier ma fiche (code ou demande)', href: '/account/claim', ready: true, as: 'CLIENT' },
      { code: '14 · D3', title: 'Favoris (+ derniers contacts sur desktop)', href: '/favorites', ready: true, as: 'CLIENT' },
      { code: '—', title: 'Recherche', href: '/search?q=riz', ready: true },
      { code: '—', title: 'Choix de la zone (fenêtre)', href: '/?demo=zone', ready: true },
      { code: '—', title: 'QR code → page du point de vente', href: '/q/K7M2QA', ready: true },
      { code: '—', title: 'Rapport vendeur partagé', href: '/r/demo-chez-maman-ganhi', ready: true },
    ],
  },
  {
    title: 'Espace vendeur — 3 entrées : Accueil, Mes points de vente, Profil',
    screens: [
      { code: '15 · VD1', title: 'Accueil : statistiques de tous ses points', href: '/seller', ready: true, as: 'VENDOR' },
      { code: '15b · VD2', title: 'Mes points de vente (bouton Gestion)', href: '/seller/points', ready: true, as: 'VENDOR' },
      { code: '15c', title: 'Gestion d’un point', href: '/seller/points/0193a400-0000-7000-8000-000000000001', ready: true, as: 'VENDOR' },
      { code: '—', title: 'Gestion : informations', href: '/seller/points/0193a400-0000-7000-8000-000000000001/info', ready: true, as: 'VENDOR' },
      { code: '7 · VD4', title: 'Gestion : menu et plats du jour', href: '/seller/points/0193a400-0000-7000-8000-000000000001/menu', ready: true, as: 'VENDOR' },
      { code: '8', title: 'Publier / modifier un plat', href: '/seller/points/0193a400-0000-7000-8000-000000000001/menu/new', ready: true, as: 'VENDOR' },
      { code: '19 · VD3', title: 'Gestion : horaires jour par jour et fermetures', href: '/seller/points/0193a400-0000-7000-8000-000000000001/hours', ready: true, as: 'VENDOR' },
      { code: '18 · VD3', title: 'Gestion : QR code et affiche', href: '/seller/points/0193a400-0000-7000-8000-000000000001/qr', ready: true, as: 'VENDOR' },
      { code: '4 · VD5', title: 'Gestion : statistiques du point', href: '/seller/points/0193a400-0000-7000-8000-000000000001/stats', ready: true, as: 'VENDOR' },
      { code: '—', title: 'Gestion : avis et réponses', href: '/seller/points/0193a400-0000-7000-8000-000000000001/reviews', ready: true, as: 'VENDOR' },
      { code: '17 · 17b · VD7', title: 'Créer un point de vente (horaires jour par jour)', href: '/seller/points/new', ready: true, as: 'VENDOR' },
      { code: '16 · VD6', title: 'Profil', href: '/seller/profile', ready: true, as: 'VENDOR' },
    ],
  },
  {
    title: 'Dashboard — desktop et mobile',
    screens: [
      { code: 'DB1 · DM1', title: 'Tableau de bord', href: '/dashboard', ready: true, as: 'SUPER_ADMIN' },
      { code: 'DB2 · DM2', title: 'Points de vente', href: '/dashboard/points', ready: true, as: 'ADMIN' },
      { code: 'DB3 · DM3', title: 'Fiche d’un point de vente', href: '/dashboard/points/0193a400-0000-7000-8000-000000000001', ready: true, as: 'ADMIN' },
      { code: 'DM5', title: 'Menu complet (dashboard)', href: '/dashboard/points/0193a400-0000-7000-8000-000000000001?tab=menu', ready: true, as: 'ADMIN' },
      { code: '6', title: 'Nouveau point de vente (terrain)', href: '/dashboard/points/new', ready: true, as: 'FIELD_AGENT' },
      { code: 'DB5', title: 'Zones, tarifs et places', href: '/dashboard/zones', ready: true, as: 'ADMIN' },
      { code: 'DB5b', title: 'Pays, villes et quartiers', href: '/dashboard/geography', ready: true, as: 'ADMIN' },
      { code: 'DB6', title: 'Utilisateurs et rôles', href: '/dashboard/users', ready: true, as: 'SUPER_ADMIN' },
      { code: 'DB7', title: 'Rôles et permissions', href: '/dashboard/roles', ready: true, as: 'SUPER_ADMIN' },
      { code: 'DB8', title: 'Vendeurs', href: '/dashboard/vendors', ready: true, as: 'ADMIN' },
      { code: '14b', title: 'Demandes de rattachement', href: '/dashboard/claims', ready: true, as: 'ADMIN' },
      { code: '9', title: 'Un vendeur et ses points (terrain)', href: '/dashboard/vendors/0193a300-0000-7000-8000-000000000001', ready: true, as: 'FIELD_AGENT' },
      { code: 'DB9', title: 'Signalements', href: '/dashboard/reports', ready: true, as: 'ADMIN' },
      { code: 'DB10', title: 'Journal d’audit', href: '/dashboard/audit', ready: true, as: 'ADMIN' },
      { code: 'DB11', title: 'Médiathèque', href: '/dashboard/media', ready: true, as: 'ADMIN' },
      { code: 'DB12', title: 'Paramètres', href: '/dashboard/settings', ready: true, as: 'SUPER_ADMIN' },
      { code: 'DM', title: 'Menu « Plus » (dashboard mobile)', href: '/dashboard/more', ready: true, as: 'ADMIN' },
    ],
  },
];
