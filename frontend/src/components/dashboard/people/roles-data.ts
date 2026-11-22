/** Textes de DB7 : description de chaque rôle et permissions regroupées comme sur la maquette. */
import type { Role } from '@/shared/enums';
import type { Permission } from '@/shared/permissions';

export const ROLE_INFO: Record<Role, { desc: string; team: boolean; scope: string }> = {
  CLIENT: { desc: 'Compte inscrit · attribué : Automatique', team: false, scope: 'son compte' },
  VENDOR: { desc: 'Titulaire de points de vente · attribué : Automatique ou par l’équipe', team: false, scope: 'ses points' },
  FIELD_AGENT: { desc: 'Membre de l’équipe, limité à ses zones · attribué : Super-admin', team: true, scope: 'ses zones' },
  ADMIN: { desc: 'Membre de l’équipe, toutes zones · attribué : Super-admin', team: true, scope: 'toutes zones' },
  SUPER_ADMIN: { desc: 'Fondateur · attribué : Initial', team: true, scope: 'tout' },
};

export const PERM_GROUPS: { title: string; items: [Permission, string][] }[] = [
  { title: 'POINTS DE VENTE', items: [
    ['geo.read', 'Voir les points de vente de ses zones'],
    ['pos.create', 'Créer un point de vente (publié directement)'],
    ['pos.update', 'Modifier infos, menu, plats du jour, horaires'],
    ['pos.moderate', 'Valider, suspendre, archiver'],
  ] },
  { title: 'ABONNEMENTS', items: [
    ['payment.link.send', 'Envoyer un lien de paiement à un vendeur'],
    ['subscription.complimentary', 'Offrir un abonnement d’essai'],
    ['payment.refund', 'Rembourser un paiement'],
  ] },
  { title: 'QUALITÉ', items: [
    ['responsetest.create', 'Enregistrer un message test'],
    ['report.resolve', 'Traiter les signalements'],
  ] },
  { title: 'ADMINISTRATION', items: [
    ['geo.manage', 'Zones, tarifs, places'],
    ['user.manage', 'Utilisateurs, rôles, paramètres'],
    ['audit.read', 'Lire le journal d’audit'],
  ] },
];
