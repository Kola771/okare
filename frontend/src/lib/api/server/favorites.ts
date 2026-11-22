/**
 * Favoris, signalements, avis, notifications — POST/DELETE /favorites/:posId · GET /me/favorites/today ·
 * POST /reports · POST /reviews · GET /me/notifications.
 */
import 'server-only';
import { db, mockExtras } from '@/mocks';
import { businessDate } from '@/shared/time';
import { reportSchema, reviewSchema, type ReportInput } from '@/shared/schemas';
import type { Notification } from '@/shared/types';
import type { FavoriteToday } from '../dto';
import { ApiError, ERR } from '../errors';
import { currentUser, hydrate, mockNow, newId, persist, requireUser, simulate } from './mock/runtime';
import { dishCard, posSummary, visibleDishes, visiblePos } from './mock/views';

export function getFavoriteIds(): Promise<string[]> {
  return simulate(() => {
    hydrate();
    const u = currentUser();
    return u ? db.favorites.filter((f) => f.userId === u.id).map((f) => f.posId) : [];
  });
}

export function addFavorite(posId: string): Promise<{ ok: true }> {
  return simulate(() => {
    const u = requireUser();
    if (!db.favorites.some((f) => f.userId === u.id && f.posId === posId)) {
      db.favorites.push({ userId: u.id, posId, notifyDaily: true, createdAt: new Date().toISOString() });
      persist();
    }
    return { ok: true as const };
  });
}

export function removeFavorite(posId: string): Promise<{ ok: true }> {
  return simulate(() => {
    const u = requireUser();
    db.favorites = db.favorites.filter((f) => !(f.userId === u.id && f.posId === posId));
    persist();
    return { ok: true as const };
  });
}

/** Favoris avec leur plat du jour et leur statut d'ouverture (écran 14, D3, bloc de l'accueil). */
export function getFavoritesToday(viewer?: { lat: number; lng: number } | null): Promise<FavoriteToday[]> {
  return simulate(() => {
    hydrate();
    const u = requireUser();
    const now = mockNow();
    const today = businessDate(now);
    return db.favorites
      .filter((f) => f.userId === u.id)
      .flatMap((f) => {
        const pos = visiblePos().find((p) => p.id === f.posId);
        if (!pos) return [];
        const special = db.dailySpecials.find((s) => s.posId === pos.id && s.businessDate === today);
        const dish = special && visibleDishes(pos.id).find((d) => d.id === special.dishId);
        const point = viewer ?? mockExtras.zoneCenters[u.homeZoneId ?? pos.zoneId];
        return [{ pos: posSummary(pos, now, point), special: dish ? dishCard(dish, now) : null, notifyDaily: f.notifyDaily }];
      })
      .sort((a, b) => Number(!!b.special) - Number(!!a.special));
  });
}

/** Active ou coupe « Recevoir leurs plats du jour » (User.notifyFavorites). */
export function setFavoritesDigest(enabled: boolean): Promise<{ ok: true }> {
  return simulate(() => {
    const u = requireUser();
    u.notifyFavorites = enabled;
    persist();
    return { ok: true as const };
  });
}

export function createReport(input: ReportInput): Promise<{ ok: true }> {
  return simulate(() => {
    const u = requireUser();
    const parsed = reportSchema.safeParse(input);
    if (!parsed.success) throw new ApiError(ERR.VALIDATION, 'Signalement invalide.', 400);
    const today = businessDate(mockNow());
    const d = parsed.data;
    const dup = db.reports.some((r) => r.userId === u.id && r.targetType === d.targetType && r.posId === (d.posId ?? null)
      && r.dishId === (d.dishId ?? null) && r.reason === d.reason && r.businessDate === today);
    if (dup) throw new ApiError(ERR.ALREADY_REPORTED, "Tu as déjà fait ce signalement aujourd'hui. Merci !", 409);
    db.reports.push({
      id: newId(), targetType: d.targetType, posId: d.posId ?? null, dishId: d.dishId ?? null, reviewId: d.reviewId ?? null,
      targetUserId: d.targetUserId ?? null, userId: u.id, reason: d.reason, comment: d.comment ?? null, businessDate: today,
      status: 'OPEN', resolvedById: null, resolvedAt: null, resolution: null, createdAt: new Date().toISOString(),
    });
    persist();
    return { ok: true as const };
  });
}

/** Avis : seulement après un contact suivi d'un « Oui », un par contact, sous 14 jours (9.6). */
export function createReview(input: { contactId: string; rating: number; comment?: string }): Promise<{ ok: true }> {
  return simulate(() => {
    const u = requireUser();
    const parsed = reviewSchema.safeParse(input);
    if (!parsed.success) throw new ApiError(ERR.VALIDATION, 'Note de 1 à 5 obligatoire.', 400);
    const c = db.contacts.find((x) => x.id === parsed.data.contactId && x.userId === u.id);
    const f = db.followUps.find((x) => x.contactId === parsed.data.contactId);
    if (!c || f?.answer !== 'YES') throw new ApiError(ERR.FORBIDDEN, 'Avis possible seulement après une réponse du vendeur.', 403);
    if (db.reviews.some((r) => r.contactId === c.id)) throw new ApiError(ERR.VALIDATION, 'Tu as déjà donné ton avis.', 409);
    const now = new Date().toISOString();
    db.reviews.push({
      id: newId(), posId: c.posId, dishId: c.dishId, userId: u.id, contactId: c.id, rating: parsed.data.rating,
      comment: parsed.data.comment || null, status: 'PUBLISHED', hiddenReason: null, hiddenById: null, vendorReply: null,
      vendorRepliedAt: null, vendorRepliedById: null, createdAt: now, updatedAt: now,
    });
    persist();
    return { ok: true as const };
  });
}

export function getNotifications(): Promise<Notification[]> {
  return simulate(() => {
    const u = requireUser();
    return db.notifications.filter((n) => n.userId === u.id);
  });
}
