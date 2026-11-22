/**
 * Pays, villes et quartiers (géographie qui sert à découper les zones) — GET /admin/geography ·
 * POST /admin/countries · POST /admin/cities · PUT /admin/cities/:id · POST/PUT/DELETE /admin/neighborhoods.
 */
import 'server-only';
import { db } from '@/mocks';
import { ApiError, ERR } from '../errors';
import { audit } from './mock/manage';
import { newId, simulate } from './mock/runtime';
import { requireTeam } from './mock/team';

export interface GeoCountryRow { id: string; code: string; name: string; currency: string; timezone: string; active: boolean }
export interface GeoCityRow { id: string; countryId: string; name: string; active: boolean; zones: number; neighborhoods: number; points: number }
export interface GeoNeighborhoodRow { id: string; name: string; aliases: string[]; zoneId: string; zoneName: string; cityId: string; points: number }
export interface Geography { countries: GeoCountryRow[]; cities: GeoCityRow[]; zones: { id: string; name: string; cityId: string }[]; neighborhoods: GeoNeighborhoodRow[] }

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const tooShort = (s: string) => s.trim().length < 2;

export function getGeography(): Promise<Geography> {
  return simulate(() => {
    requireTeam('geo.read');
    const zoneCity = (zoneId: string) => db.zones.find((z) => z.id === zoneId)?.cityId ?? '';
    return {
      countries: db.countries.map((c) => ({ id: c.id, code: c.code, name: c.name, currency: c.currency, timezone: c.timezone, active: c.isActive })),
      cities: db.cities.map((c) => {
        const zoneIds = db.zones.filter((z) => z.cityId === c.id).map((z) => z.id);
        return {
          id: c.id, countryId: c.countryId, name: c.name, active: c.isActive, zones: zoneIds.length,
          neighborhoods: db.neighborhoods.filter((n) => zoneIds.includes(n.zoneId)).length,
          points: db.pointsOfSale.filter((p) => zoneIds.includes(p.zoneId) && !p.deletedAt).length,
        };
      }),
      zones: db.zones.map((z) => ({ id: z.id, name: z.name, cityId: z.cityId })),
      neighborhoods: db.neighborhoods.map((n) => ({
        id: n.id, name: n.name, aliases: n.aliases, zoneId: n.zoneId, zoneName: db.zones.find((z) => z.id === n.zoneId)?.name ?? '—',
        cityId: zoneCity(n.zoneId), points: db.pointsOfSale.filter((p) => p.neighborhoodId === n.id && !p.deletedAt).length,
      })).sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    };
  });
}

export function createCountry(input: { code: string; name: string; currency: string; timezone: string }): Promise<{ id: string }> {
  return simulate(() => {
    const { user } = requireTeam('geo.manage');
    const code = input.code.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) throw new ApiError(ERR.VALIDATION, 'Code pays : 2 lettres (ex. TG).', 400, { code: '2 lettres.' });
    if (tooShort(input.name)) throw new ApiError(ERR.VALIDATION, 'Nom trop court.', 400, { name: '2 caractères au moins.' });
    if (db.countries.some((c) => c.code === code)) throw new ApiError(ERR.VALIDATION, 'Ce pays existe déjà.', 409, { code: 'Déjà utilisé.' });
    const country = { id: newId(), code, name: input.name.trim(), currency: input.currency.trim().toUpperCase() || 'XOF',
      timezone: input.timezone.trim() || 'Africa/Porto-Novo', phoneRegex: '', isActive: true };
    db.countries.push(country);
    audit(user, 'country.create', 'Country', country.id, null, { code, name: country.name });
    return { id: country.id };
  });
}

export function createCity(input: { countryId: string; name: string }): Promise<{ id: string }> {
  return simulate(() => {
    const { user } = requireTeam('geo.manage');
    if (!db.countries.some((c) => c.id === input.countryId)) throw new ApiError(ERR.VALIDATION, 'Pays inconnu.', 400);
    if (tooShort(input.name)) throw new ApiError(ERR.VALIDATION, 'Nom trop court.', 400, { name: '2 caractères au moins.' });
    const city = { id: newId(), countryId: input.countryId, name: input.name.trim(), slug: slug(input.name), center: null, isActive: true };
    db.cities.push(city);
    // Chaque ville a ses catégories A, B, C (places par défaut reprises de la première ville).
    for (const code of ['A', 'B', 'C'] as const) {
      const ref = db.zoneCategories.find((c) => c.code === code)!;
      db.zoneCategories.push({ ...ref, id: newId(), cityId: city.id });
    }
    audit(user, 'city.create', 'City', city.id, null, { name: city.name });
    return { id: city.id };
  });
}

export function setCityActive(cityId: string, active: boolean): Promise<{ ok: true }> {
  return simulate(() => {
    const { user } = requireTeam('geo.manage');
    const city = db.cities.find((c) => c.id === cityId);
    if (!city) throw new ApiError(ERR.NOT_FOUND, 'Ville introuvable.', 404);
    city.isActive = active;
    audit(user, active ? 'city.activate' : 'city.deactivate', 'City', city.id, null, { active });
    return { ok: true as const };
  });
}

const parseAliases = (s: string) => s.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean);

export function saveNeighborhood(input: { id?: string; name: string; zoneId: string; aliases: string }): Promise<{ id: string }> {
  return simulate(() => {
    const { user } = requireTeam('geo.manage');
    if (tooShort(input.name)) throw new ApiError(ERR.VALIDATION, 'Nom trop court.', 400, { name: '2 caractères au moins.' });
    if (!db.zones.some((z) => z.id === input.zoneId)) throw new ApiError(ERR.VALIDATION, 'Choisis une zone.', 400, { zoneId: 'Obligatoire.' });
    const values = { name: input.name.trim(), zoneId: input.zoneId, aliases: parseAliases(input.aliases) };
    if (input.id) {
      const n = db.neighborhoods.find((x) => x.id === input.id);
      if (!n) throw new ApiError(ERR.NOT_FOUND, 'Quartier introuvable.', 404);
      audit(user, 'neighborhood.update', 'Neighborhood', n.id, { ...n }, values);
      Object.assign(n, values);
      return { id: n.id };
    }
    const n = { id: newId(), ...values };
    db.neighborhoods.push(n);
    audit(user, 'neighborhood.create', 'Neighborhood', n.id, null, values);
    return { id: n.id };
  });
}

/** Un quartier utilisé par un point de vente ne peut pas être supprimé (le déplacer vers une autre zone). */
export function deleteNeighborhood(id: string): Promise<{ ok: true }> {
  return simulate(() => {
    const { user } = requireTeam('geo.manage');
    const i = db.neighborhoods.findIndex((x) => x.id === id);
    if (i < 0) throw new ApiError(ERR.NOT_FOUND, 'Quartier introuvable.', 404);
    if (db.pointsOfSale.some((p) => p.neighborhoodId === id && !p.deletedAt)) {
      throw new ApiError(ERR.VALIDATION, 'Des points de vente sont dans ce quartier : change-le de zone plutôt.', 409);
    }
    const [n] = db.neighborhoods.splice(i, 1);
    audit(user, 'neighborhood.delete', 'Neighborhood', id, n, null);
    return { ok: true as const };
  });
}
