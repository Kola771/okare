import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateZoneCategories1732320000003 implements MigrationInterface {
  name = 'CreateZoneCategories1732320000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "zone_categories" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "cityId" UUID NOT NULL,
          "code" VARCHAR(50) NOT NULL,
          "label" VARCHAR(255) NOT NULL,
          "defaultDailySlots" INTEGER NOT NULL,
          CONSTRAINT "PK_zone_categories" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_zone_categories_cityId_code" UNIQUE ("cityId", "code"),
          CONSTRAINT "FK_zone_categories_cityId" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_zone_categories_cityId" ON "zone_categories" ("cityId")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`zone_categories\` (
          \`id\` CHAR(36) NOT NULL,
          \`cityId\` CHAR(36) NOT NULL,
          \`code\` VARCHAR(50) NOT NULL,
          \`label\` VARCHAR(255) NOT NULL,
          \`defaultDailySlots\` INT NOT NULL,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_zone_categories_cityId_code\` (\`cityId\`, \`code\`),
          INDEX \`IDX_zone_categories_cityId\` (\`cityId\`),
          CONSTRAINT \`FK_zone_categories_cityId\` FOREIGN KEY (\`cityId\`) REFERENCES \`cities\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "zone_categories"`);
    } else {
      await queryRunner.query(`DROP TABLE \`zone_categories\``);
    }
  }
}
