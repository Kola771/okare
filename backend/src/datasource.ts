import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const dbType = (process.env.DB_TYPE as 'postgres' | 'mysql') || 'postgres';

export default new DataSource({
  type: dbType,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || (dbType === 'mysql' ? '3306' : '5432')),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'okare',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
