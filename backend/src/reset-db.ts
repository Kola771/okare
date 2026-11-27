import * as dotenv from 'dotenv';
dotenv.config();

import * as mysql from 'mysql2/promise';

async function resetDb() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'okare',
  });

  await conn.query('SET FOREIGN_KEY_CHECKS = 0');

  const [rows] = await conn.query('SHOW TABLES') as any;
  const tables: string[] = rows.map((r: any) => Object.values(r)[0]);

  for (const t of tables) {
    await conn.query(`DROP TABLE IF EXISTS \`${t}\``);
    console.log('Dropped:', t);
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('\nAll tables dropped. Run: npm run migration:run');
  await conn.end();
}

resetDb().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
