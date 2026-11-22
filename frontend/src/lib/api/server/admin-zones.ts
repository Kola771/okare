/**
 * Zones, tarifs et places (DB5) — GET /admin/zones · POST /admin/zones · PUT /admin/zones/:id ·
 * GET/PUT /admin/price-grid. Données fictives en phase 1 (aucun paiement réel).
 */
import 'server-only';
import { db } from '@/mocks';
import { POS_TYPES, type PosType } from '@/shared/enums';
import type { ZoneCategoryCode } from '@/shared/types';
import { ApiError, ERR } from '../errors';
import { audit } from './mock/manage';
import { newId, simulate } from './mock/runtime';
import { inScope, requireTeam } from './mock/team';

export interface AdminZoneRow {
  id: string; name: string; cityId: string; category: ZoneCategoryCode; neighborhoods: string[]; points: number; active: boolean;
  slots: number; center: { lat: number; lng: number } | null;
}

const catCode = (categoryId: string) => db.zoneCategories.find((c) => c.id === categoryId)!.code;

function center(boundary: [number, number][][][] | null) {
  const ring = boundary?.[0]?.[0];
  if (!ring?.length) return null;
  const pts = ring.slice(0, -1);
  return { lng: pts.reduce((n, p) => n + p[0], 0) / pts.length, lat: pts.reduce((n, p) => n + p[1], 0) / pts.length };
}

export function listZonesAdmin(): Promise<AdminZoneRow[]> {
  return simulate(() => {
    const { zoneIds } = requireTeam('geo.read');
    return db.zones.filter((z) => inScope(zoneIds, z.id)).map((z) => {
      const cat = db.zoneCategories.find((c) => c.id === z.categoryId)!;
      return {
        id: z.id, name: z.name, cityId: z.cityId, active: z.isActive, category: cat.code, center: center(z.boundary),
        slots: z.dailySlotsOverride ?? cat.defaultDailySlots,
        neighborhoods: db.neighborhoods.filter((n) => n.zoneId === z.id).map((n) => n.name),
        points: db.pointsOfSale.filter((p) => p.zoneId === z.id && !p.deletedAt).length,
      };
    });
  });
}

export function setZoneActive(zoneId: string, active: boolean): Promise<{ ok: true }> {
  return simulate(() => {
    const { user } = requireTeam('geo.manage');
    const z = db.zones.find((x) => x.id === zoneId);
    if (!z) throw new ApiError(ERR.NOT_FOUND, 'Zone introuvable.', 404);
    z.isActive = active;
    audit(user, active ? 'zone.activate' : 'zone.deactivate', 'Zone', z.id, null, { active });
    return { ok: true as const };
  });
}

export interface ZoneInput { name: string; cityId: string; category: ZoneCategoryCode; slots: number | null }

function categoryFor(cityId: string, code: ZoneCategoryCode) {
  const found = db.zoneCategories.find((c) => c.cityId === cityId && c.code === code) ?? db.zoneCategories.find((c) => c.code === code);
  if (!found) throw new ApiError(ERR.VALIDATION, 'Catégorie inconnue.', 400);
  return found;
}

/** Nouvelle zone : contour carré provisoire autour du centre de la ville, à redessiner sur la carte. */
export function createZone(input: ZoneInput): Promise<{ id: string }> {
  return simulate(() => {
    const { user } = requireTeam('geo.manage');
    const name = input.name.trim();
    if (name.length < 2) throw new ApiError(ERR.VALIDATION, 'Nom trop court.', 400, { name: '2 caractères au moins.' });
    const city = db.cities.find((c) => c.id === input.cityId);
    if (!city) throw new ApiError(ERR.VALIDATION, 'Ville inconnue.', 400);
    const c = city.center ?? { lat: 6.3654, lng: 2.4183 };
    const d = 0.006;
    const zone = {
      id: newId(), cityId: city.id, categoryId: categoryFor(city.id, input.category).id, name,
      code: name.toUpperCase().normalize('NFD').replace(/[^A-Z0-9]+/g, '_'),
      boundary: [[[[c.lng - d, c.lat - d], [c.lng + d, c.lat - d], [c.lng + d, c.lat + d], [c.lng - d, c.lat + d], [c.lng - d, c.lat - d]]]] as [number, number][][][],
      dailySlotsOverride: input.slots, priceOverride: null, isActive: true,
    };
    db.zones.push(zone);
    audit(user, 'zone.create', 'Zone', zone.id, null, { name, category: input.category });
    return { id: zone.id };
  });
}

/** Catégorie et places par jour d'une zone (null = valeur de la catégorie). */
export function updateZone(zoneId: string, patch: { name?: string; category?: ZoneCategoryCode; slots?: number | null }): Promise<{ ok: true }> {
  return simulate(() => {
    const { user } = requireTeam('geo.manage');
    const z = db.zones.find((x) => x.id === zoneId);
    if (!z) throw new ApiError(ERR.NOT_FOUND, 'Zone introuvable.', 404);
    const before = { name: z.name, category: catCode(z.categoryId), slots: z.dailySlotsOverride };
    if (patch.name?.trim()) z.name = patch.name.trim();
    if (patch.category) z.categoryId = categoryFor(z.cityId, patch.category).id;
    if (patch.slots !== undefined) {
      if (patch.slots !== null && (!Number.isInteger(patch.slots) || patch.slots < 0)) throw new ApiError(ERR.VALIDATION, 'Nombre de places invalide.', 400);
      z.dailySlotsOverride = patch.slots;
    }
    audit(user, 'zone.update', 'Zone', z.id, before, patch);
    return { ok: true as const };
  });
}

export interface PriceGridRow { id: string; category: ZoneCategoryCode; posType: PosType; dayPriceXof: number }

/** Grille des prix d'un jour de pub, par catégorie de zone et type de vendeur (11.2). */
export function getPriceGrid(): Promise<PriceGridRow[]> {
  return simulate(() => {
    requireTeam('geo.read');
    const order = (r: { category: string; posType: PosType }) => r.category + POS_TYPES.indexOf(r.posType);
    return db.priceGrid.map((p) => ({ id: p.id, category: catCode(p.categoryId), posType: p.posType, dayPriceXof: p.dayPriceXof }))
      .sort((a, b) => order(a).localeCompare(order(b)));
  });
}

export function savePriceGrid(rows: { id: string; dayPriceXof: number }[]): Promise<{ ok: true }> {
  return simulate(() => {
    const { user } = requireTeam('pricing.manage');
    for (const r of rows) {
      if (!Number.isInteger(r.dayPriceXof) || r.dayPriceXof < 0) throw new ApiError(ERR.VALIDATION, 'Prix invalide (nombre entier de francs).', 400);
    }
    for (const r of rows) {
      const p = db.priceGrid.find((x) => x.id === r.id);
      if (p && p.dayPriceXof !== r.dayPriceXof) {
        audit(user, 'pricing.update', 'PriceGrid', p.id, { dayPriceXof: p.dayPriceXof }, { dayPriceXof: r.dayPriceXof });
        Object.assign(p, { dayPriceXof: r.dayPriceXof, updatedById: user.id, updatedAt: new Date().toISOString() });
      }
    }
    return { ok: true as const };
  });
}
