/**
 * Contacts mesurés et suivi des réponses (9.1 à 9.5) — POST /contacts · GET /me/followups/pending ·
 * POST /followups/:contactId · GET /me/contacts.
 */
import 'server-only';
import { db } from '@/mocks';
import { BUSINESS_RULES } from '@/shared/business-rules';
import { whatsappMessage, whatsappUrl } from '@/shared/format';
import { isTeam } from '@/shared/permissions';
import { contactSchema, followUpAnswerSchema, type ContactInput, type FollowUpAnswerInput } from '@/shared/schemas';
import type { ContactEvent, ContactFollowUp } from '@/shared/types';
import type { ContactResult, MyContact, PendingFollowUp } from '../dto';
import { ApiError, ERR } from '../errors';
import { deviceId, hydrate, mockNow, newId, persist, requireUser, simulate } from './mock/runtime';
import { dishCard, visibleDishes } from './mock/views';

const MIN = 60_000;

/** Enregistre le contact puis renvoie l'URL WhatsApp pré-remplie ou tel:. */
export function createContact(input: ContactInput): Promise<ContactResult> {
  return simulate(() => {
    hydrate();
    const user = requireUser();
    const parsed = contactSchema.safeParse(input);
    if (!parsed.success) throw new ApiError(ERR.VALIDATION, 'Requête invalide.', 400);
    const { posId, dishId, channel, source, viewerZoneId, button } = parsed.data;
    const pos = db.pointsOfSale.find((p) => p.id === posId && p.status === 'PUBLISHED' && !p.deletedAt);
    if (!pos) throw new ApiError(ERR.NOT_FOUND, "Ce point de vente n'est plus en ligne.", 404);
    const isDishButton = button === 'DISH';
    if (isDishButton && !dishId) throw new ApiError(ERR.VALIDATION, 'Plat manquant.', 400);
    if (!isDishButton && dishId) throw new ApiError(ERR.VALIDATION, 'Le bouton du point de vente ne cite pas de plat.', 400);
    const dish = dishId ? visibleDishes(pos.id).find((d) => d.id === dishId) : undefined;
    const now = mockNow();
    if (dishId && (!dish || dishCard(dish, now).isSoldOut)) {
      throw new ApiError(ERR.DISH_UNAVAILABLE, "Ce plat n'est plus disponible aujourd'hui.", 400);
    }

    // Règles de comptage (9.2).
    const vendor = db.vendors.find((v) => v.id === pos.vendorId)!;
    const recent = db.contacts.find((c) => c.userId === user.id && c.posId === pos.id && c.channel === channel
      && now.getTime() - new Date(c.createdAt).getTime() < BUSINESS_RULES.contact.dedupeMinutes * MIN);
    const notCountedReason = isTeam(user.roles) ? 'TEAM' : vendor.userId === user.id ? 'OWN_POS' : recent ? 'DUPLICATE' : null;

    const id = newId();
    const card = dish ? dishCard(dish, now) : null;
    db.contacts.push({
      id, posId: pos.id, vendorId: pos.vendorId, userId: user.id, dishId: dish?.id ?? null,
      dishNameSnap: dish?.name ?? null, dishPriceSnap: card?.priceXof ?? null, dishCategoryId: dish?.categoryId ?? null,
      channel, source, posZoneId: pos.zoneId, viewerZoneId: viewerZoneId ?? null, subscriptionId: null,
      deviceId: deviceId(), ipHash: null, isCounted: !notCountedReason, notCountedReason, createdAt: now.toISOString(),
    });
    if (!notCountedReason) {
      db.followUps.push({ contactId: id, posId: pos.id, userId: user.id, askDish: !dish, askCount: 0,
        askedAt: null, nextAskAt: null, answer: null, answeredAt: null });
    }
    persist();
    const phone = channel === 'CALL' ? pos.callPhone ?? pos.whatsappPhone : pos.whatsappPhone;
    const url = channel === 'CALL'
      ? `tel:${phone}`
      : whatsappUrl(phone, whatsappMessage(pos.name, card ? { name: card.name, priceXof: card.priceXof } : null));
    return { contactId: id, url };
  });
}

/** Au plus un suivi : contact de 10 min à 48 h, sans réponse, le plus récent (9.5 a). */
export function getPendingFollowUp(): Promise<PendingFollowUp | null> {
  return simulate(() => {
    hydrate();
    const user = requireUser();
    if (!user.askFollowUp) return null;
    const now = mockNow().getTime();
    const { minDelayMin, maxDelayHours } = BUSINESS_RULES.followup;
    const candidates = db.followUps
      .filter((f) => f.userId === user.id && !f.answer && f.askCount < 2 && (!f.nextAskAt || new Date(f.nextAskAt).getTime() <= now))
      .map((f) => ({ f, c: db.contacts.find((c) => c.id === f.contactId)! }))
      .filter(({ c }) => {
        const age = now - new Date(c.createdAt).getTime();
        return age >= minDelayMin * MIN && age <= maxDelayHours * 60 * MIN;
      })
      .sort((a, b) => b.c.createdAt.localeCompare(a.c.createdAt));
    const hit = candidates[0];
    return hit ? toPending(hit.f, hit.c) : null;
  });
}

function toPending(f: ContactFollowUp, c: ContactEvent): PendingFollowUp {
  const pos = db.pointsOfSale.find((p) => p.id === c.posId)!;
  const dish = db.dishes.find((d) => d.id === c.dishId);
  const cat = db.dishCategories.find((x) => x.id === dish?.categoryId);
  return {
    contactId: c.id, posId: pos.id, posName: pos.name, posSlug: pos.slug, askDish: f.askDish, createdAt: c.createdAt,
    dish: dish ? { id: dish.id, name: c.dishNameSnap ?? dish.name, priceXof: c.dishPriceSnap ?? dish.priceXof,
      illustrationKey: cat?.illustrationKey ?? null } : null,
    menu: f.askDish ? visibleDishes(pos.id).map((d) => ({ id: d.id, name: d.name })) : [],
  };
}

/** Suivi d'un contact précis (bouton « Il t'a répondu ? » des derniers contacts). */
export function getFollowUp(contactId: string): Promise<PendingFollowUp> {
  return simulate(() => {
    hydrate();
    const user = requireUser();
    const f = db.followUps.find((x) => x.contactId === contactId && x.userId === user.id);
    const c = db.contacts.find((x) => x.id === contactId);
    if (!f || !c) throw new ApiError(ERR.NOT_FOUND, 'Suivi introuvable.', 404);
    return toPending(f, c);
  });
}

export function answerFollowUp(contactId: string, input: FollowUpAnswerInput): Promise<ContactFollowUp> {
  return simulate(() => {
    const user = requireUser();
    const parsed = followUpAnswerSchema.safeParse(input);
    if (!parsed.success) throw new ApiError(ERR.VALIDATION, 'Réponse invalide.', 400);
    const f = db.followUps.find((x) => x.contactId === contactId && x.userId === user.id);
    const c = db.contacts.find((x) => x.id === contactId);
    if (!f || !c) throw new ApiError(ERR.NOT_FOUND, 'Suivi introuvable.', 404);
    if (c.dishId && parsed.data.orderedDishIds?.length) {
      throw new ApiError(ERR.VALIDATION, 'Ce contact cite déjà un plat.', 400);
    }
    const now = mockNow();
    f.askCount += 1;
    f.askedAt = now.toISOString();
    if (parsed.data.answer === 'NOT_YET') {
      f.nextAskAt = new Date(now.getTime() + BUSINESS_RULES.followup.retryAfterHours * 60 * MIN).toISOString();
    } else {
      f.answer = parsed.data.answer;
      f.answeredAt = now.toISOString();
    }
    if (parsed.data.answer === 'YES') {
      const items: { dishId: string | null; name: string; origin: 'DISH_BUTTON' | 'DECLARED' }[] = c.dishId
        ? [{ dishId: c.dishId, name: c.dishNameSnap ?? '', origin: 'DISH_BUTTON' }]
        : (parsed.data.orderedDishIds ?? []).map((id) => ({
            dishId: id, name: db.dishes.find((d) => d.id === id)?.name ?? '', origin: 'DECLARED' }));
      if (!c.dishId && parsed.data.other) items.push({ dishId: null, name: 'Autre chose', origin: 'DECLARED' });
      for (const it of items) {
        db.orderItems.push({ id: newId(), contactId, dishId: it.dishId, dishNameSnap: it.name,
          dishCategoryId: db.dishes.find((d) => d.id === it.dishId)?.categoryId ?? null, origin: it.origin,
          createdAt: now.toISOString() });
      }
    }
    persist();
    return f;
  });
}

/** Derniers contacts du client (D3, écran 13). */
export function getMyContacts(): Promise<MyContact[]> {
  return simulate(() => {
    hydrate();
    const user = requireUser();
    return db.contacts
      .filter((c) => c.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20)
      .map((c) => {
        const pos = db.pointsOfSale.find((p) => p.id === c.posId)!;
        const f = db.followUps.find((x) => x.contactId === c.id);
        return { id: c.id, createdAt: c.createdAt, posName: pos.name, posSlug: pos.slug, dishName: c.dishNameSnap,
          answer: f?.answer ?? null, canAnswer: !!f && !f.answer };
      });
  });
}

