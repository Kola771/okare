import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDailySpecials1732320000020 implements MigrationInterface {
  name = 'CreateDailySpecials1732320000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "daily_specials" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "posId" UUID NOT NULL,
          "dishId" UUID NOT NULL,
          "businessDate" DATE NOT NULL,
          "priceTodayXof" INTEGER,
          "createdById" UUID NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_daily_specials" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_daily_specials_pos_dish_date" UNIQUE ("posId", "dishId", "businessDate"),
          CONSTRAINT "FK_daily_specials_posId" FOREIGN KEY ("posId") REFERENCES "points_of_sale"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_daily_specials_dishId" FOREIGN KEY ("dishId") REFERENCES "dishes"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_daily_specials_businessDate" ON "daily_specials" ("businessDate")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`daily_specials\` (
          \`id\` CHAR(36) NOT NULL,
          \`posId\` CHAR(36) NOT NULL,
          \`dishId\` CHAR(36) NOT NULL,
          \`businessDate\` DATE NOT NULL,
          \`priceTodayXof\` INT NULL,
          \`createdById\` CHAR(36) NOT NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_daily_specials_pos_dish_date\` (\`posId\`, \`dishId\`, \`businessDate\`),
          INDEX \`IDX_daily_specials_businessDate\` (\`businessDate\`),
          CONSTRAINT \`FK_daily_specials_posId\` FOREIGN KEY (\`posId\`) REFERENCES \`points_of_sale\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_daily_specials_dishId\` FOREIGN KEY (\`dishId\`) REFERENCES \`dishes\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "daily_specials"`);
    } else {
      await queryRunner.query(`DROP TABLE \`daily_specials\``);
    }
  }
}
