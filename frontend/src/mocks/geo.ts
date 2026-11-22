/** Géographie fictive : Bénin, Cotonou, catégories A/B/C, 8 zones et leurs quartiers (repris du seeder). */
import { DEFAULT_DAILY_SLOTS, DEFAULT_PRICE_GRID } from '@/shared/business-rules';
import { POS_TYPES } from '@/shared/enums';
import type {
  City, Country, GeoMultiPolygon, Neighborhood, PriceGrid, PublicHoliday, Zone, ZoneCategory, ZoneCategoryCode,
} from '@/shared/types';
import { mockId, T0, ZONE } from './ids';

export const COUNTRY: Country = {
  id: mockId(1, 1), code: 'BJ', name: 'Bénin', currency: 'XOF', timezone: 'Africa/Porto-Novo',
  phoneRegex: '^\\+2290[1-9]\\d{8}$', isActive: true,
};

export const CITY: City = {
  id: mockId(1, 2), countryId: COUNTRY.id, name: 'Cotonou', slug: 'cotonou', center: { lat: 6.3654, lng: 2.4183 }, isActive: true,
};

const CAT_LABEL: Record<ZoneCategoryCode, string> = {
  A: "A — centre d'affaires", B: 'B — résidentiel dense', C: 'C — périphérie',
};

export const ZONE_CATEGORIES: ZoneCategory[] = (['A', 'B', 'C'] as const).map((code, i) => ({
  id: mockId(1, 10 + i), cityId: CITY.id, code, label: CAT_LABEL[code], defaultDailySlots: DEFAULT_DAILY_SLOTS[code],
}));

export const categoryByCode = (code: ZoneCategoryCode) => ZONE_CATEGORIES.find((c) => c.code === code)!;

/** Rectangle approximatif autour du centre (comme le seeder) : à redessiner dans DB5. */
function box(lat: number, lng: number, d = 0.006): GeoMultiPolygon {
  return [[[[lng - d, lat - d], [lng + d, lat - d], [lng + d, lat + d], [lng - d, lat + d], [lng - d, lat - d]]]];
}

type ZoneSeed = [keyof typeof ZONE, string, ZoneCategoryCode, number, number, [string, string[]][]];

const ZONE_SEEDS: ZoneSeed[] = [
  ['GANHI', 'Ganhi', 'A', 6.3585, 2.43, [['Ganhi', ['ganhi']], ['Akpakpa-Dodomè', []], ['Xwlacodji', ['houlacodji']]]],
  ['HAIE_VIVE', 'Haie Vive', 'A', 6.355, 2.3935, [['Haie Vive', ['haie-vive']], ['Cocotiers', ['les cocotiers']]]],
  ['CADJEHOUN', 'Cadjèhoun', 'B', 6.36, 2.3835, [['Cadjèhoun', ['cadjehoun', 'kadjehoun']], ['Gbégamey-Sud', []]]],
  ['GBEGAMEY', 'Gbégamey', 'B', 6.37, 2.404, [['Gbégamey', ['gbegamey']], ['Saint-Michel', ['st michel']]]],
  ['MISSEBO', 'Missébô', 'B', 6.368, 2.426, [['Missébô', ['missebo', 'misebo']], ['Dantokpa', ['tokpa']]]],
  ['AKPAKPA', 'Akpakpa', 'C', 6.366, 2.452, [['Akpakpa', ['akpakpa']], ['Sègbèya', ['segbeya']], ['PK3', ['pk 3']]]],
  ['FIDJROSSE', 'Fidjrossè', 'C', 6.356, 2.355, [['Fidjrossè', ['fidjrosse']], ['Fidjrossè-Plage', ['fidjrosse plage']]]],
  ['AGLA', 'Agla', 'C', 6.382, 2.379, [['Agla', ['agla']], ['Hlazounto', []]]],
];

export const ZONES: Zone[] = ZONE_SEEDS.map(([code, name, cat, lat, lng]) => ({
  id: ZONE[code], cityId: CITY.id, categoryId: categoryByCode(cat).id, name, code,
  boundary: box(lat, lng), dailySlotsOverride: null, priceOverride: null, isActive: true,
}));

/** Centre de chaque zone (utilisé quand la position du client est inconnue). */
export const ZONE_CENTERS: Record<string, { lat: number; lng: number }> = Object.fromEntries(
  ZONE_SEEDS.map(([code, , , lat, lng]) => [ZONE[code], { lat, lng }]),
);

let nbId = 200;
export const NEIGHBORHOODS: Neighborhood[] = ZONE_SEEDS.flatMap(([code, , , , , list]) =>
  list.map(([name, aliases]) => ({ id: mockId(1, nbId++), zoneId: ZONE[code], name, aliases })),
);

export const neighborhoodByName = (name: string) => NEIGHBORHOODS.find((n) => n.name === name)!;

export const HOLIDAYS: PublicHoliday[] = [
  ['2026-11-01', 'Toussaint'], ['2026-12-25', 'Noël'], ['2027-01-01', "Jour de l'an"], ['2027-01-10', 'Fête du Vodoun'],
].map(([date, name], i) => ({ id: mockId(1, 300 + i), countryId: COUNTRY.id, date, name }));

export const PRICE_GRID: PriceGrid[] = ZONE_CATEGORIES.flatMap((cat, i) =>
  POS_TYPES.map((posType, j) => ({
    id: mockId(1, 400 + i * 3 + j), categoryId: cat.id, posType,
    dayPriceXof: DEFAULT_PRICE_GRID[cat.code][posType], updatedById: null, updatedAt: T0,
  })),
);

export const zoneCategoryCode = (zoneId: string): ZoneCategoryCode => {
  const zone = ZONES.find((z) => z.id === zoneId)!;
  return ZONE_CATEGORIES.find((c) => c.id === zone.categoryId)!.code;
};
