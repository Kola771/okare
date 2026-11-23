import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCities1732320000002 implements MigrationInterface {
  name = 'CreateCities1732320000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "cities" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "countryId" UUID NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "slug" VARCHAR(255) NOT NULL,
          "center" geography(Point,4326),
          "isActive" BOOLEAN NOT NULL DEFAULT false,
          CONSTRAINT "PK_cities" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_cities_slug" UNIQUE ("slug"),
          CONSTRAINT "FK_cities_countryId" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_cities_countryId" ON "cities" ("countryId")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`cities\` (
          \`id\` CHAR(36) NOT NULL,
          \`countryId\` CHAR(36) NOT NULL,
          \`name\` VARCHAR(255) NOT NULL,
          \`slug\` VARCHAR(255) NOT NULL,
          \`center\` POINT NULL,
          \`isActive\` TINYINT(1) NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_cities_slug\` (\`slug\`),
          INDEX \`IDX_cities_countryId\` (\`countryId\`),
          CONSTRAINT \`FK_cities_countryId\` FOREIGN KEY (\`countryId\`) REFERENCES \`countries\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "cities"`);
    } else {
      await queryRunner.query(`DROP TABLE \`cities\``);
    }
  }
}
