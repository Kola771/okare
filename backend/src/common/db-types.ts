import * as dotenv from 'dotenv';
dotenv.config();

export const isPostgres = (process.env.DB_TYPE || 'postgres') === 'postgres';

export const DB_JSON = isPostgres ? 'jsonb' : 'json';
export const DB_UUID_COL = isPostgres
  ? { type: 'uuid' as const }
  : { type: 'varchar' as const, length: 36 };

export const DB_POINT_COL = isPostgres
  ? { type: 'geometry' as const, spatialFeatureType: 'Point' as const, srid: 4326 }
  : { type: 'point' as const };

export const DB_MULTIPOLYGON_COL = isPostgres
  ? { type: 'geometry' as const, spatialFeatureType: 'MultiPolygon' as const, srid: 4326 }
  : { type: 'multipolygon' as const };
