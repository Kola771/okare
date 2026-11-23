import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlatformAndPosDailyStats1732320000029 implements MigrationInterface {
  name = 'CreatePlatformAndPosDailyStats1732320000029';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "platform_daily_stats" (
          "businessDate" DATE NOT NULL,
          "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
          "sessions" INTEGER NOT NULL DEFAULT 0,
          "pageViews" INTEGER NOT NULL DEFAULT 0,
          "newSignups" INTEGER NOT NULL DEFAULT 0,
          "activeVendors" INTEGER NOT NULL DEFAULT 0,
          "totalContacts" INTEGER NOT NULL DEFAULT 0,
          "totalOrders" INTEGER NOT NULL DEFAULT 0,
          CONSTRAINT "PK_platform_daily_stats" PRIMARY KEY ("businessDate")
        )`,
      );
      await queryRunner.query(
        `CREATE TABLE "pos_daily_stats" (
          "posId" UUID NOT NULL,
          "businessDate" DATE NOT NULL,
          "impressions" INTEGER NOT NULL DEFAULT 0,
          "promotedImpressions" INTEGER NOT NULL DEFAULT 0,
          "views" INTEGER NOT NULL DEFAULT 0,
          "dishViews" INTEGER NOT NULL DEFAULT 0,
          "qrScans" INTEGER NOT NULL DEFAULT 0,
          "whatsappContacts" INTEGER NOT NULL DEFAULT 0,
          "callContacts" INTEGER NOT NULL DEFAULT 0,
          "uniqueClients" INTEGER NOT NULL DEFAULT 0,
          "confirmedOrders" INTEGER NOT NULL DEFAULT 0,
          CONSTRAINT "PK_pos_daily_stats" PRIMARY KEY ("posId", "businessDate")
        )`,
      );
      await queryRunner.query(
        `CREATE TABLE "pos_dish_daily_stats" (
          "posId" UUID NOT NULL,
          "dishId" UUID NOT NULL,
          "businessDate" DATE NOT NULL,
          "views" INTEGER NOT NULL DEFAULT 0,
          "contacts" INTEGER NOT NULL DEFAULT 0,
          "confirmed" INTEGER NOT NULL DEFAULT 0,
          CONSTRAINT "PK_pos_dish_daily_stats" PRIMARY KEY ("posId", "dishId", "businessDate")
        )`,
      );
    } else {
      await queryRunner.query(
        `CREATE TABLE \`platform_daily_stats\` (
          \`businessDate\` DATE NOT NULL,
          \`uniqueVisitors\` INT NOT NULL DEFAULT 0,
          \`sessions\` INT NOT NULL DEFAULT 0,
          \`pageViews\` INT NOT NULL DEFAULT 0,
          \`newSignups\` INT NOT NULL DEFAULT 0,
          \`activeVendors\` INT NOT NULL DEFAULT 0,
          \`totalContacts\` INT NOT NULL DEFAULT 0,
          \`totalOrders\` INT NOT NULL DEFAULT 0,
          PRIMARY KEY (\`businessDate\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
      await queryRunner.query(
        `CREATE TABLE \`pos_daily_stats\` (
          \`posId\` CHAR(36) NOT NULL,
          \`businessDate\` DATE NOT NULL,
          \`impressions\` INT NOT NULL DEFAULT 0,
          \`promotedImpressions\` INT NOT NULL DEFAULT 0,
          \`views\` INT NOT NULL DEFAULT 0,
          \`dishViews\` INT NOT NULL DEFAULT 0,
          \`qrScans\` INT NOT NULL DEFAULT 0,
          \`whatsappContacts\` INT NOT NULL DEFAULT 0,
          \`callContacts\` INT NOT NULL DEFAULT 0,
          \`uniqueClients\` INT NOT NULL DEFAULT 0,
          \`confirmedOrders\` INT NOT NULL DEFAULT 0,
          PRIMARY KEY (\`posId\`, \`businessDate\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
      await queryRunner.query(
        `CREATE TABLE \`pos_dish_daily_stats\` (
          \`posId\` CHAR(36) NOT NULL,
          \`dishId\` CHAR(36) NOT NULL,
          \`businessDate\` DATE NOT NULL,
          \`views\` INT NOT NULL DEFAULT 0,
          \`contacts\` INT NOT NULL DEFAULT 0,
          \`confirmed\` INT NOT NULL DEFAULT 0,
          PRIMARY KEY (\`posId\`, \`dishId\`, \`businessDate\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "pos_dish_daily_stats"`);
      await queryRunner.query(`DROP TABLE "pos_daily_stats"`);
      await queryRunner.query(`DROP TABLE "platform_daily_stats"`);
    } else {
      await queryRunner.query(`DROP TABLE \`pos_dish_daily_stats\``);
      await queryRunner.query(`DROP TABLE \`pos_daily_stats\``);
      await queryRunner.query(`DROP TABLE \`platform_daily_stats\``);
    }
  }
}
