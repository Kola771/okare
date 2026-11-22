/**
 * Rattachement d'un vendeur créé par l'équipe à un compte (section 14) —
 * POST /team/claim-codes { vendorId } · POST /vendor/claims { code } | { phone } · GET /me/claims ·
 * GET /admin/claims · POST /admin/claims/:id/(approve|reject).
 */
import 'server-only';
import { db } from '@/mocks';
import { displayPhone, normalizePhone } from '@/shared/format';
import type { ClaimStatus } from '@/shared/enums';
import type { User } from '@/shared/types';
import { ApiError, ERR } from '../errors';
import { audit } from './mock/manage';
import { newId, requireUser, simulate } from './mock/runtime';
import { requireTeam } from './mock/team';

const HOURS_72 = 72 * 3_600_000;
const DAYS_7 = 7 * 86_400_000;

function vendorOrThrow(vendorId: string) {
  const v = db.vendors.find((x) => x.id === vendorId && !x.deletedAt);
  if (!v) throw new ApiError(ERR.NOT_FOUND, 'Vendeur introuvable.', 404);
  if (v.userId) throw new ApiError(ERR.VALIDATION, 'Cette fiche est déjà rattachée à un compte.', 409);
  return v;
}

/** Relie la fiche au compte : le compte devient VENDOR et gère lui-même ses points. */
function link(vendorId: string, user: User, by: User) {
  const v = vendorOrThrow(vendorId);
  v.userId = user.id;
  if (!user.roles.includes('VENDOR')) user.roles = [...user.roles, 'VENDOR'];
  audit(by, 'vendor.claim', 'Vendor', v.id, { userId: null }, { userId: user.id });
  return v;
}

/** L'agent génère un code à 6 chiffres valable 72 h, à envoyer au vendeur par WhatsApp. */
export function createClaimCode(vendorId: string): Promise<{ code: string; expiresAt: string; whatsappUrl: string }> {
  return simulate(() => {
    const { user } = requireTeam('pos.update');
    const v = vendorOrThrow(vendorId);
    const code = String(Math.floor(100_000 + Math.random() * 900_000));
    const expiresAt = new Date(Date.now() + HOURS_72).toISOString();
    db.claimCodes = db.claimCodes.filter((c) => c.vendorId !== v.id);
    db.claimCodes.push({ vendorId: v.id, code, expiresAt, createdById: user.id });
    audit(user, 'claim.code.create', 'Vendor', v.id, null, { expiresAt });
    const text = `Bonjour ${v.contactName ?? ''}, voici ton code OKARE pour gérer ${v.displayName} toi-même : ${code}. `
      + 'Crée ton compte sur OKARE, puis « Je suis vendeur » dans ton profil. Code valable 72 h.';
    return { code, expiresAt, whatsappUrl: `https://wa.me/${v.contactPhone.replace('+', '')}?text=${encodeURIComponent(text)}` };
  });
}

/** Le vendeur saisit son code : rattachement immédiat. */
export function claimWithCode(code: string): Promise<{ vendorName: string }> {
  return simulate(() => {
    const user = requireUser();
    const c = db.claimCodes.find((x) => x.code === code.replace(/\s/g, ''));
    if (!c) throw new ApiError(ERR.VALIDATION, 'Code inconnu. Vérifie les 6 chiffres ou demande un nouveau code à ton agent.', 400, { code: 'Code inconnu.' });
    if (new Date(c.expiresAt).getTime() < Date.now()) throw new ApiError(ERR.VALIDATION, 'Code expiré (72 h). Demande un nouveau code à ton agent.', 400, { code: 'Code expiré.' });
    const v = link(c.vendorId, user, user);
    db.claimCodes = db.claimCodes.filter((x) => x !== c);
    db.claimRequests.unshift({ id: newId(), vendorId: v.id, userId: user.id, code: c.code, status: 'APPROVED', reviewedById: c.createdById,
      expiresAt: c.expiresAt, createdAt: new Date().toISOString() });
    return { vendorName: v.displayName };
  });
}

/** Sans code : demande avec le numéro de la fiche, acceptée par un admin. */
export function requestClaim(phone: string): Promise<{ vendorName: string }> {
  return simulate(() => {
    const user = requireUser();
    const e164 = normalizePhone(phone);
    if (!e164) throw new ApiError(ERR.VALIDATION, 'Numéro invalide.', 400, { phone: '10 chiffres commençant par 01.' });
    const v = db.vendors.find((x) => x.contactPhone === e164 && !x.deletedAt);
    if (!v) throw new ApiError(ERR.NOT_FOUND, 'Aucune fiche vendeur avec ce numéro. Demande à ton agent de te créer, ou crée ton point de vente toi-même.', 404, { phone: 'Aucune fiche avec ce numéro.' });
    if (v.userId) throw new ApiError(ERR.VALIDATION, 'Cette fiche est déjà rattachée à un compte.', 409, { phone: 'Déjà rattachée.' });
    if (db.claimRequests.some((r) => r.vendorId === v.id && r.userId === user.id && r.status === 'PENDING')) {
      throw new ApiError(ERR.VALIDATION, 'Ta demande est déjà en attente : un admin va la traiter.', 409);
    }
    db.claimRequests.unshift({ id: newId(), vendorId: v.id, userId: user.id, code: '', status: 'PENDING', reviewedById: null,
      expiresAt: new Date(Date.now() + DAYS_7).toISOString(), createdAt: new Date().toISOString() });
    audit(user, 'claim.request', 'Vendor', v.id, null, { phone: e164 });
    return { vendorName: v.displayName };
  });
}

export interface MyClaim { id: string; vendorName: string; status: ClaimStatus; createdAt: string; byCode: boolean }

export function getMyClaims(): Promise<MyClaim[]> {
  return simulate(() => {
    const user = requireUser();
    return db.claimRequests.filter((r) => r.userId === user.id).map((r) => ({
      id: r.id, status: r.status, createdAt: r.createdAt, byCode: !!r.code,
      vendorName: db.vendors.find((v) => v.id === r.vendorId)?.displayName ?? '—',
    }));
  });
}

export interface AdminClaimRow {
  id: string; status: ClaimStatus; createdAt: string; byCode: boolean;
  vendor: { id: string; name: string; contactName: string | null; phone: string; points: string[] };
  requester: { name: string; phone: string }; samePhone: boolean; reviewedBy: string | null;
}

export function listClaims(): Promise<AdminClaimRow[]> {
  return simulate(() => {
    requireTeam('pos.moderate');
    return db.claimRequests.map((r) => {
      const v = db.vendors.find((x) => x.id === r.vendorId)!;
      const u = db.users.find((x) => x.id === r.userId);
      return {
        id: r.id, status: r.status, createdAt: r.createdAt, byCode: !!r.code,
        vendor: { id: v.id, name: v.displayName, contactName: v.contactName, phone: displayPhone(v.contactPhone),
          points: db.pointsOfSale.filter((p) => p.vendorId === v.id && !p.deletedAt).map((p) => p.name) },
        requester: { name: u?.fullName ?? 'Client', phone: u?.phone ? displayPhone(u.phone) : '—' },
        samePhone: !!u?.phone && u.phone === v.contactPhone,
        reviewedBy: r.reviewedById ? db.users.find((x) => x.id === r.reviewedById)?.fullName ?? 'Équipe' : null,
      };
    }).sort((a, b) => (a.status === 'PENDING' ? 0 : 1) - (b.status === 'PENDING' ? 0 : 1) || b.createdAt.localeCompare(a.createdAt));
  });
}

export function reviewClaim(id: string, decision: 'approve' | 'reject'): Promise<{ ok: true }> {
  return simulate(() => {
    const { user } = requireTeam('pos.moderate');
    const r = db.claimRequests.find((x) => x.id === id);
    if (!r) throw new ApiError(ERR.NOT_FOUND, 'Demande introuvable.', 404);
    if (r.status !== 'PENDING') throw new ApiError(ERR.VALIDATION, 'Demande déjà traitée.', 409);
    if (decision === 'approve') {
      const requester = db.users.find((u) => u.id === r.userId);
      if (!requester) throw new ApiError(ERR.NOT_FOUND, 'Compte demandeur introuvable.', 404);
      link(r.vendorId, requester, user);
      // Les autres demandes sur la même fiche deviennent sans objet.
      db.claimRequests.filter((x) => x.vendorId === r.vendorId && x.id !== r.id && x.status === 'PENDING').forEach((x) => { x.status = 'REJECTED'; x.reviewedById = user.id; });
    }
    r.status = decision === 'approve' ? 'APPROVED' : 'REJECTED';
    r.reviewedById = user.id;
    audit(user, `claim.${decision}`, 'ClaimRequest', r.id, null, { status: r.status });
    return { ok: true as const };
  });
}
