/**
 * Gestion d'un point de vente — mêmes routes pour le vendeur, l'agent de la zone et l'admin (21, 12.3, 12.4) :
 * GET /pos/:id (gestion) · POST /pos/:id/dishes · PATCH/DELETE /dishes/:id · POST /dishes/:id/(publish|hold|sold-out|back-in-stock)
 * POST /pos/:id/specials · /specials/repeat · /prices-checked · PUT /opening-hours · PUT/DELETE /day-status/:date
 */
import 'server-only';
import { db } from '@/mocks';
import { slugify } from '@/shared/format';
import { addDays, businessDate } from '@/shared/time';
import type { HolidayPolicy } from '@/shared/enums';
import type { Dish, OpeningHours, TimeRange } from '@/shared/types';
import type { DishInput, ManagedPos, MenuDish } from '../seller-dto';
import { ApiError, ERR } from '../errors';
import { assertPos, audit, managedPos, touchPos } from './mock/manage';
import { mockNow, newId, persist, simulate } from './mock/runtime';

const MAX_SPECIALS = 3;

export function getManagedPos(posId: string): Promise<ManagedPos> {
  return simulate(() => managedPos(assertPos(posId, 'pos.update').pos, mockNow()));
}

export function getMenu(posId: string): Promise<MenuDish[]> {
  return simulate(() => {
    const { pos } = assertPos(posId, 'dish.manage');
    const today = businessDate(mockNow());
    const yesterday = addDays(today, -1);
    return db.dishes.filter((d) => d.posId === pos.id && !d.deletedAt).sort((a, b) => a.sortOrder - b.sortOrder).map((d) => ({
      id: d.id, slug: d.slug, name: d.name, description: d.description, priceXof: d.priceXof, moment: d.moment,
      categoryId: d.categoryId, status: d.status, isSoldOut: d.soldOutOn === today,
      isSpecial: db.dailySpecials.some((s) => s.dishId === d.id && s.businessDate === today),
      specialYesterday: db.dailySpecials.some((s) => s.dishId === d.id && s.businessDate === yesterday),
      illustrationKey: db.dishCategories.find((c) => c.id === d.categoryId)?.illustrationKey ?? null,
    }));
  });
}

function validate(input: DishInput) {
  const details: Record<string, string> = {};
  if (input.name.trim().length < 2 || input.name.trim().length > 60) details.name = 'Entre 2 et 60 caractères.';
  if (!Number.isInteger(input.priceXof) || input.priceXof < 1 || input.priceXof > 100_000) details.priceXof = 'Prix entre 1 et 100 000 F.';
  if ((input.description ?? '').length > 300) details.description = '300 caractères au plus.';
  if (Object.keys(details).length) throw new ApiError(ERR.VALIDATION, Object.values(details)[0], 400, details);
}

function setSpecial(posId: string, dishId: string, on: boolean, userId: string) {
  const today = businessDate(mockNow());
  const existing = db.dailySpecials.filter((s) => s.posId === posId && s.businessDate === today);
  const has = existing.some((s) => s.dishId === dishId);
  if (on && !has) {
    if (existing.length >= MAX_SPECIALS) throw new ApiError(ERR.VALIDATION, `${MAX_SPECIALS} plats du jour au plus.`, 400);
    db.dailySpecials.push({ id: newId(), posId, dishId, businessDate: today, priceTodayXof: null, createdById: userId, createdAt: new Date().toISOString() });
  }
  if (!on && has) db.dailySpecials = db.dailySpecials.filter((s) => !(s.dishId === dishId && s.businessDate === today));
}

export function saveDish(posId: string, dishId: string | null, input: DishInput): Promise<{ id: string }> {
  return simulate(() => {
    const { user, pos } = assertPos(posId, 'dish.manage');
    validate(input);
    const now = new Date().toISOString();
    const today = businessDate(mockNow());
    let dish = dishId ? db.dishes.find((d) => d.id === dishId && d.posId === pos.id) : undefined;
    const before = dish ? { ...dish } : null;
    if (dishId && !dish) throw new ApiError(ERR.NOT_FOUND, 'Plat introuvable.', 404);
    if (!dish) {
      dish = { id: newId(), posId: pos.id, categoryId: null, slug: '', name: '', description: null, priceXof: 0, moment: 'LUNCH',
        status: 'PUBLISHED', soldOutOn: null, sortOrder: db.dishes.filter((d) => d.posId === pos.id).length, publishedAt: now,
        createdById: user.id, updatedById: null, createdAt: now, updatedAt: now, deletedAt: null } satisfies Dish;
      db.dishes.push(dish);
    }
    let slug = slugify(input.name);
    if (db.dishes.some((d) => d.posId === pos.id && d.slug === slug && d.id !== dish!.id)) slug = `${slug}-${dish.id.slice(-4)}`;
    Object.assign(dish, { name: input.name.trim(), slug, priceXof: input.priceXof, moment: input.moment, categoryId: input.categoryId,
      description: input.description?.trim() || null, updatedById: user.id, updatedAt: now });
    if (input.available !== undefined) dish.soldOutOn = input.available ? null : today;
    if (input.isSpecial !== undefined) setSpecial(pos.id, dish.id, input.isSpecial, user.id);
    touchPos(pos, user, true);
    audit(user, before ? 'dish.update' : 'dish.create', 'Dish', dish.id, before, dish);
    persist();
    return { id: dish.id };
  });
}

export type DishAction = 'publish' | 'hold' | 'sold-out' | 'back-in-stock' | 'delete' | 'special-on' | 'special-off';

export function dishAction(posId: string, dishId: string, action: DishAction): Promise<{ ok: true }> {
  return simulate(() => {
    const { user, pos } = assertPos(posId, action.startsWith('special') ? 'special.manage' : 'dish.manage');
    const dish = db.dishes.find((d) => d.id === dishId && d.posId === pos.id && !d.deletedAt);
    if (!dish) throw new ApiError(ERR.NOT_FOUND, 'Plat introuvable.', 404);
    const before = { ...dish };
    const today = businessDate(mockNow());
    if (action === 'publish') dish.status = 'PUBLISHED';
    if (action === 'hold') dish.status = 'PENDING';
    if (action === 'sold-out') dish.soldOutOn = today;
    if (action === 'back-in-stock') dish.soldOutOn = null;
    if (action === 'delete') dish.deletedAt = new Date().toISOString();
    if (action === 'special-on' || action === 'special-off') setSpecial(pos.id, dish.id, action === 'special-on', user.id);
    touchPos(pos, user);
    audit(user, `dish.${action}`, 'Dish', dish.id, before, dish);
    persist();
    return { ok: true as const };
  });
}

/** « Republier ceux d'hier » en un geste (27.1). */
export function repeatYesterdaySpecials(posId: string): Promise<{ count: number }> {
  return simulate(() => {
    const { user, pos } = assertPos(posId, 'special.manage');
    const today = businessDate(mockNow());
    const ids = db.dailySpecials.filter((s) => s.posId === pos.id && s.businessDate === addDays(today, -1)).map((s) => s.dishId);
    const source = ids.length ? ids : db.dailySpecials.filter((s) => s.posId === pos.id).map((s) => s.dishId).slice(0, 1);
    let count = 0;
    for (const id of source.slice(0, MAX_SPECIALS)) {
      if (!db.dailySpecials.some((s) => s.dishId === id && s.businessDate === today)) {
        setSpecial(pos.id, id, true, user.id);
        count += 1;
      }
    }
    persist();
    return { count };
  });
}

export function markPricesChecked(posId: string): Promise<{ ok: true }> {
  return simulate(() => {
    const { user, pos } = assertPos(posId, 'pos.update');
    touchPos(pos, user, true);
    audit(user, 'pos.prices_checked', 'PointOfSale', pos.id, null, { pricesCheckedAt: pos.pricesCheckedAt });
    persist();
    return { ok: true as const };
  });
}

export function saveOpeningHours(posId: string, hours: OpeningHours, holidayPolicy: HolidayPolicy): Promise<{ ok: true }> {
  return simulate(() => {
    const { user, pos } = assertPos(posId, 'hours.manage');
    const before = { openingHours: pos.openingHours, holidayPolicy: pos.holidayPolicy };
    pos.openingHours = hours;
    pos.holidayPolicy = holidayPolicy;
    pos.hoursConfirmedAt = new Date().toISOString();
    touchPos(pos, user);
    audit(user, 'pos.hours', 'PointOfSale', pos.id, before, { openingHours: hours, holidayPolicy });
    persist();
    return { ok: true as const };
  });
}

/** « Fermé aujourd'hui » / « Horaires spéciaux » en un geste ; `null` retire l'exception du jour. */
export function setDayStatus(posId: string, status: { isClosed: boolean; ranges?: TimeRange[] } | null): Promise<{ ok: true }> {
  return simulate(() => {
    const { user, pos } = assertPos(posId, 'hours.manage');
    const today = businessDate(mockNow());
    db.posDayOverrides = db.posDayOverrides.filter((o) => !(o.posId === pos.id && o.businessDate === today));
    if (status) {
      db.posDayOverrides.push({ id: newId(), posId: pos.id, businessDate: today, isClosed: status.isClosed, ranges: status.ranges ?? null,
        reason: null, source: user.roles.includes('VENDOR') ? 'VENDOR' : 'TEAM', createdById: user.id, createdAt: new Date().toISOString() });
    }
    audit(user, 'pos.day_status', 'PointOfSale', pos.id, null, status);
    persist();
    return { ok: true as const };
  });
}
