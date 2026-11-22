/**
 * Rattachements (section 14) : un vendeur récupère la fiche créée par l'équipe, par code (6 chiffres, 72 h)
 * ou par demande acceptée par un admin. Deux demandes d'exemple en attente.
 */
import type { ClaimRequest, User } from '@/shared/types';
import { isoDaysAgo, mockId, T0, USER, ZONE } from './ids';
import { VENDOR } from './vendors';

/** Code généré par l'équipe pour une fiche vendeur (pas une table de la spec : porté par ClaimRequest en phase 2). */
export interface ClaimCode { vendorId: string; code: string; expiresAt: string; createdById: string }

export const USER_GERARD = mockId(2, 30);

/** Gérard, du Bon Goût : il a créé un compte client avec le numéro de sa fiche. */
export const CLAIM_USERS: User[] = [{
  id: USER_GERARD, phone: '+2290197000006', email: null, googleSub: null, passwordHash: 'mock', fullName: 'Gérard Ahouansou',
  avatarMediaId: null, roles: ['CLIENT'], homeZoneId: ZONE.CADJEHOUN, budgetMaxXof: null, notifyFavorites: true, askFollowUp: true,
  notifyNews: false, phoneVerifiedAt: T0, totpSecret: null, totpEnabledAt: null, isBlocked: false, blockedReason: null,
  lastSeenAt: isoDaysAgo(0.05), createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(2), deletedAt: null,
}];

export const CLAIM_REQUESTS: ClaimRequest[] = [
  // Même numéro que la fiche : l'admin peut accepter.
  { id: mockId(9, 1), vendorId: VENDOR.bonGout, userId: USER_GERARD, code: '', status: 'PENDING', reviewedById: null,
    expiresAt: isoDaysAgo(-5), createdAt: isoDaysAgo(0.2) },
  // Numéro différent : à vérifier (appeler le vendeur).
  { id: mockId(9, 2), vendorId: VENDOR.aiko, userId: USER.clientKoffi, code: '', status: 'PENDING', reviewedById: null,
    expiresAt: isoDaysAgo(-6), createdAt: isoDaysAgo(1) },
];

export const CLAIM_CODES: ClaimCode[] = [];
