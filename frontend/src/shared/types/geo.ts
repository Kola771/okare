/** Tables « Géographie » (schema.prisma section 2). Les colonnes PostGIS deviennent des objets simples. */
import type { PosType } from '../enums';
import type { BusinessDate, Uuid } from './accounts';

/** geography(Point,4326) */
export interface GeoPoint {
  lat: number;
  lng: number;
}

/** geography(MultiPolygon,4326) : liste de polygones, chacun liste d'anneaux [lng, lat]. */
export type GeoMultiPolygon = [number, number][][][];

export interface Country {
  id: Uuid;
  code: string;
  name: string;
  currency: string;
  timezone: string;
  phoneRegex: string;
  isActive: boolean;
}

export interface City {
  id: Uuid;
  countryId: Uuid;
  name: string;
  slug: string;
  center: GeoPoint | null;
  isActive: boolean;
}

export type ZoneCategoryCode = 'A' | 'B' | 'C';

export interface ZoneCategory {
  id: Uuid;
  cityId: Uuid;
  code: ZoneCategoryCode;
  label: string;
  defaultDailySlots: number;
}

/** Prix d'un jour spécifiques à une zone, par type de point de vente. */
export type ZonePriceOverride = Partial<Record<PosType, number>>;

export interface Zone {
  id: Uuid;
  cityId: Uuid;
  categoryId: Uuid;
  name: string;
  code: string;
  boundary: GeoMultiPolygon | null;
  dailySlotsOverride: number | null;
  priceOverride: ZonePriceOverride | null;
  isActive: boolean;
}

export interface Neighborhood {
  id: Uuid;
  zoneId: Uuid;
  name: string;
  aliases: string[];
}

export interface PublicHoliday {
  id: Uuid;
  countryId: Uuid;
  date: BusinessDate;
  name: string;
}
