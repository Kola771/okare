import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePublicHolidays1732320000006 implements MigrationInterface {
  name = 'CreatePublicHolidays1732320000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "public_holidays" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "countryId" UUID NOT NULL,
          "date" DATE NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          CONSTRAINT "PK_public_holidays" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_public_holidays_countryId_date" UNIQUE ("countryId", "date"),
          CONSTRAINT "FK_public_holidays_countryId" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_public_holidays_countryId" ON "public_holidays" ("countryId")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`public_holidays\` (
          \`id\` CHAR(36) NOT NULL,
          \`countryId\` CHAR(36) NOT NULL,
          \`date\` DATE NOT NULL,
          \`name\` VARCHAR(255) NOT NULL,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_public_holidays_countryId_date\` (\`countryId\`, \`date\`),
          INDEX \`IDX_public_holidays_countryId\` (\`countryId\`),
          CONSTRAINT \`FK_public_holidays_countryId\` FOREIGN KEY (\`countryId\`) REFERENCES \`countries\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "public_holidays"`);
    } else {
      await queryRunner.query(`DROP TABLE \`public_holidays\``);
    }
  }
}
