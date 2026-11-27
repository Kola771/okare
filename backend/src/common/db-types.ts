import * as dotenv from 'dotenv';
dotenv.config();

const isPostgres = (process.env.DB_TYPE || 'postgres') === 'postgres';

export const DB_JSON = isPostgres ? 'jsonb' : 'json';
export const DB_UUID_COL = isPostgres
  ? { type: 'uuid' as const }
  : { type: 'varchar' as const, length: 36 };
