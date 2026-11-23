import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateZones1732320000004 implements MigrationInterface {
  name = 'CreateZones1732320000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "zones" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "cityId" UUID NOT NULL,
          "categoryId" UUID NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "code" VARCHAR(50) NOT NULL,
          "boundary" geography(MultiPolygon,4326),
          "dailySlotsOverride" INTEGER,
          "priceOverride" JSONB,
          "isActive" BOOLEAN NOT NULL DEFAULT false,
          CONSTRAINT "PK_zones" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_zones_cityId_code" UNIQUE ("cityId", "code"),
          CONSTRAINT "FK_zones_cityId" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_zones_categoryId" FOREIGN KEY ("categoryId") REFERENCES "zone_categories"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_zones_cityId" ON "zones" ("cityId")`);
      await queryRunner.query(`CREATE INDEX "IDX_zones_categoryId" ON "zones" ("categoryId")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`zones\` (
          \`id\` CHAR(36) NOT NULL,
          \`cityId\` CHAR(36) NOT NULL,
          \`categoryId\` CHAR(36) NOT NULL,
          \`name\` VARCHAR(255) NOT NULL,
          \`code\` VARCHAR(50) NOT NULL,
          \`boundary\` MULTIPOLYGON NULL,
          \`dailySlotsOverride\` INT NULL,
          \`priceOverride\` JSON NULL,
          \`isActive\` TINYINT(1) NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_zones_cityId_code\` (\`cityId\`, \`code\`),
          INDEX \`IDX_zones_cityId\` (\`cityId\`),
          INDEX \`IDX_zones_categoryId\` (\`categoryId\`),
          CONSTRAINT \`FK_zones_cityId\` FOREIGN KEY (\`cityId\`) REFERENCES \`cities\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_zones_categoryId\` FOREIGN KEY (\`categoryId\`) REFERENCES \`zone_categories\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "zones"`);
    } else {
      await queryRunner.query(`DROP TABLE \`zones\``);
    }
  }
}
