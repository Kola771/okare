import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContactFollowUpsAndOrderItems1732320000024 implements MigrationInterface {
  name = 'CreateContactFollowUpsAndOrderItems1732320000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`CREATE TYPE "FollowUpAnswer" AS ENUM ('YES', 'NOT_YET', 'NO')`);
      await queryRunner.query(`CREATE TYPE "OrderItemOrigin" AS ENUM ('DISH_BUTTON', 'DECLARED')`);
      await queryRunner.query(
        `CREATE TABLE "contact_follow_ups" (
          "contactId" UUID NOT NULL,
          "posId" UUID NOT NULL,
          "userId" UUID NOT NULL,
          "askDish" BOOLEAN NOT NULL DEFAULT false,
          "askCount" INTEGER NOT NULL DEFAULT 0,
          "askedAt" TIMESTAMPTZ,
          "nextAskAt" TIMESTAMPTZ,
          "answer" "FollowUpAnswer",
          "answeredAt" TIMESTAMPTZ,
          CONSTRAINT "PK_contact_follow_ups" PRIMARY KEY ("contactId"),
          CONSTRAINT "FK_contact_follow_ups_contactId" FOREIGN KEY ("contactId") REFERENCES "contact_events"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_contact_follow_ups_userId_answer" ON "contact_follow_ups" ("userId", "answer")`);
      await queryRunner.query(
        `CREATE TABLE "contact_order_items" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "contactId" UUID NOT NULL,
          "dishId" UUID,
          "dishNameSnap" VARCHAR(255) NOT NULL,
          "dishCategoryId" UUID,
          "origin" "OrderItemOrigin" NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_contact_order_items" PRIMARY KEY ("id"),
          CONSTRAINT "FK_contact_order_items_contactId" FOREIGN KEY ("contactId") REFERENCES "contact_events"("id") ON DELETE CASCADE
        )`,
      );
    } else {
      await queryRunner.query(
        `CREATE TABLE \`contact_follow_ups\` (
          \`contactId\` CHAR(36) NOT NULL,
          \`posId\` CHAR(36) NOT NULL,
          \`userId\` CHAR(36) NOT NULL,
          \`askDish\` TINYINT(1) NOT NULL DEFAULT 0,
          \`askCount\` INT NOT NULL DEFAULT 0,
          \`askedAt\` DATETIME NULL,
          \`nextAskAt\` DATETIME NULL,
          \`answer\` ENUM('YES', 'NOT_YET', 'NO') NULL,
          \`answeredAt\` DATETIME NULL,
          PRIMARY KEY (\`contactId\`),
          INDEX \`IDX_contact_follow_ups_userId_answer\` (\`userId\`, \`answer\`),
          CONSTRAINT \`FK_contact_follow_ups_contactId\` FOREIGN KEY (\`contactId\`) REFERENCES \`contact_events\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
      await queryRunner.query(
        `CREATE TABLE \`contact_order_items\` (
          \`id\` CHAR(36) NOT NULL,
          \`contactId\` CHAR(36) NOT NULL,
          \`dishId\` CHAR(36) NULL,
          \`dishNameSnap\` VARCHAR(255) NOT NULL,
          \`dishCategoryId\` CHAR(36) NULL,
          \`origin\` ENUM('DISH_BUTTON', 'DECLARED') NOT NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_contact_order_items_contactId\` (\`contactId\`),
          CONSTRAINT \`FK_contact_order_items_contactId\` FOREIGN KEY (\`contactId\`) REFERENCES \`contact_events\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "contact_order_items"`);
      await queryRunner.query(`DROP TABLE "contact_follow_ups"`);
      await queryRunner.query(`DROP TYPE "OrderItemOrigin"`);
      await queryRunner.query(`DROP TYPE "FollowUpAnswer"`);
    } else {
      await queryRunner.query(`DROP TABLE \`contact_order_items\``);
      await queryRunner.query(`DROP TABLE \`contact_follow_ups\``);
    }
  }
}
