/**
 * Gestion d'un point (15c, VD3–VD5, DB3) — PATCH /pos/:id { …, version } · DELETE /pos/:id ·
 * GET /pos/:slug/reviews · POST /reviews/:id/reply. Mêmes gestes pour le vendeur, l'agent de la zone et l'admin.
 */
import 'server-only';
import { db, mockExtras } from '@/mocks';
import { normalizePhone } from '@/shared/format';
import type { PosType } from '@/shared/enums';
import type { PointOfSale } from '@/shared/types';
import { ApiError, ERR } from '../errors';
import { assertPos, audit, touchPos } from './mock/manage';
import { simulate } from './mock/runtime';

export interface PosInfo {
  name: string; type: PosType; description: string | null; landmark: string | null; whatsappPhone: string; callPhone: string | null;
  hasPublicPlace: boolean; servesOnSite: boolean; servesTakeaway: boolean; delivers: boolean; acceptsCash: boolean; acceptsMomo: boolean;
  version: number; zoneName: string; neighborhood: string | null;
}

export function getPosInfo(posId: string): Promise<PosInfo> {
  return simulate(() => posInfoOf(assertPos(posId, 'pos.update').pos));
}

export function posInfoOf(pos: PointOfSale): PosInfo {
  {
    return {
      name: pos.name, type: pos.type, description: pos.description, landmark: pos.landmark, whatsappPhone: pos.whatsappPhone, callPhone: pos.callPhone,
      hasPublicPlace: pos.hasPublicPlace, servesOnSite: pos.servesOnSite, servesTakeaway: pos.servesTakeaway, delivers: pos.delivers,
      acceptsCash: pos.acceptsCash, acceptsMomo: pos.acceptsMomo, version: pos.version,
      zoneName: db.zones.find((z) => z.id === pos.zoneId)?.name ?? '', neighborhood: db.neighborhoods.find((n) => n.id === pos.neighborhoodId)?.name ?? null,
    };
  }
}

/** Modification publiée tout de suite ; refus 409 VERSION_CONFLICT si la fiche a changé entre-temps (5.3). */
export function updatePosInfo(posId: string, input: Omit<PosInfo, 'zoneName' | 'neighborhood'>): Promise<{ version: number }> {
  return simulate(() => {
    const { user, pos } = assertPos(posId, 'pos.update');
    if (input.version !== pos.version) throw new ApiError('VERSION_CONFLICT', 'Quelqu’un a modifié ce point entre-temps. Recharge la page.', 409);
    if (input.name.trim().length < 2) throw new ApiError(ERR.VALIDATION, 'Nom trop court.', 400, { name: '2 caractères au moins.' });
    const wa = normalizePhone(input.whatsappPhone);
    if (!wa) throw new ApiError(ERR.VALIDATION, 'Numéro WhatsApp invalide.', 400, { whatsappPhone: '10 chiffres commençant par 01.' });
    const call = input.callPhone ? normalizePhone(input.callPhone) : null;
    if (input.callPhone && !call) throw new ApiError(ERR.VALIDATION, 'Numéro d’appel invalide.', 400, { callPhone: '10 chiffres commençant par 01.' });
    const others = db.pointsOfSale.filter((p) => p.vendorId === pos.vendorId && p.id !== pos.id && !p.deletedAt);
    if (input.type === 'PARTICULIER' && others.length) throw new ApiError('PARTICULIER_SINGLE_POS', 'Un vendeur Particulier n’a qu’un seul point de vente.', 409);
    const before = { ...pos };
    Object.assign(pos, { name: input.name.trim(), type: input.type, description: input.description?.trim() || null, landmark: input.landmark?.trim() || null,
      whatsappPhone: wa, callPhone: call, hasPublicPlace: input.hasPublicPlace, servesOnSite: input.servesOnSite, servesTakeaway: input.servesTakeaway,
      delivers: input.delivers, acceptsCash: input.acceptsCash, acceptsMomo: input.acceptsMomo });
    touchPos(pos, user);
    audit(user, 'pos.update', 'PointOfSale', pos.id, before, pos);
    return { version: pos.version };
  });
}

/** Suppression douce (restaurable 30 jours par un admin, 12.7). */
export function deletePos(posId: string): Promise<{ ok: true }> {
  return simulate(() => {
    const { user, pos } = assertPos(posId, 'pos.update');
    pos.deletedAt = new Date().toISOString();
    audit(user, 'pos.delete', 'PointOfSale', pos.id, { status: pos.status }, { deletedAt: pos.deletedAt });
    return { ok: true as const };
  });
}

export interface ManagedReview { id: string; rating: number; comment: string | null; author: string; dishName: string | null; createdAt: string; reply: string | null }

export function getPosReviews(posId: string): Promise<ManagedReview[]> {
  return simulate(() => {
    const { pos } = assertPos(posId, 'pos.update');
    return db.reviews.filter((r) => r.posId === pos.id && r.status === 'PUBLISHED').sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r, i) => ({
      id: r.id, rating: r.rating, comment: r.comment, createdAt: r.createdAt, reply: r.vendorReply,
      author: mockExtras.reviewAuthors[i % mockExtras.reviewAuthors.length], dishName: db.dishes.find((d) => d.id === r.dishId)?.name ?? null,
    }));
  });
}

/** Une réponse publique par avis, modifiable (9.6). Le vendeur ne peut pas supprimer un avis. */
export function replyReview(posId: string, reviewId: string, text: string): Promise<{ ok: true }> {
  return simulate(() => {
    const { user, pos } = assertPos(posId, 'review.reply');
    const r = db.reviews.find((x) => x.id === reviewId && x.posId === pos.id);
    if (!r) throw new ApiError(ERR.NOT_FOUND, 'Avis introuvable.', 404);
    if (!text.trim() || text.length > 500) throw new ApiError(ERR.VALIDATION, 'Réponse de 1 à 500 caractères.', 400);
    Object.assign(r, { vendorReply: text.trim(), vendorRepliedAt: new Date().toISOString(), vendorRepliedById: user.id });
    audit(user, 'review.reply', 'Review', r.id, null, { reply: text.trim() });
    return { ok: true as const };
  });
}
