import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContactEvents1732320000023 implements MigrationInterface {
  name = 'CreateContactEvents1732320000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`CREATE TYPE "ContactChannel" AS ENUM ('WHATSAPP', 'CALL')`);
      await queryRunner.query(`CREATE TYPE "ContactSource" AS ENUM ('HOME', 'SEARCH', 'MAP', 'DISH_PAGE', 'POS_PAGE', 'FAVORITES', 'QR', 'PUSH')`);
      await queryRunner.query(
        `CREATE TABLE "contact_events" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "posId" UUID NOT NULL,
          "vendorId" UUID NOT NULL,
          "userId" UUID NOT NULL,
          "dishId" UUID,
          "dishNameSnap" VARCHAR(255),
          "dishPriceSnap" INTEGER,
          "dishCategoryId" UUID,
          "channel" "ContactChannel" NOT NULL,
          "source" "ContactSource" NOT NULL,
          "posZoneId" UUID NOT NULL,
          "viewerZoneId" UUID,
          "subscriptionId" UUID,
          "deviceId" VARCHAR(255),
          "ipHash" VARCHAR(255),
          "isCounted" BOOLEAN NOT NULL DEFAULT true,
          "notCountedReason" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_contact_events" PRIMARY KEY ("id"),
          CONSTRAINT "FK_contact_events_posId" FOREIGN KEY ("posId") REFERENCES "points_of_sale"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_contact_events_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_contact_events_posId_createdAt" ON "contact_events" ("posId", "createdAt")`);
      await queryRunner.query(`CREATE INDEX "IDX_contact_events_userId_createdAt" ON "contact_events" ("userId", "createdAt")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`contact_events\` (
          \`id\` CHAR(36) NOT NULL,
          \`posId\` CHAR(36) NOT NULL,
          \`vendorId\` CHAR(36) NOT NULL,
          \`userId\` CHAR(36) NOT NULL,
          \`dishId\` CHAR(36) NULL,
          \`dishNameSnap\` VARCHAR(255) NULL,
          \`dishPriceSnap\` INT NULL,
          \`dishCategoryId\` CHAR(36) NULL,
          \`channel\` ENUM('WHATSAPP', 'CALL') NOT NULL,
          \`source\` ENUM('HOME', 'SEARCH', 'MAP', 'DISH_PAGE', 'POS_PAGE', 'FAVORITES', 'QR', 'PUSH') NOT NULL,
          \`posZoneId\` CHAR(36) NOT NULL,
          \`viewerZoneId\` CHAR(36) NULL,
          \`subscriptionId\` CHAR(36) NULL,
          \`deviceId\` VARCHAR(255) NULL,
          \`ipHash\` VARCHAR(255) NULL,
          \`isCounted\` TINYINT(1) NOT NULL DEFAULT 1,
          \`notCountedReason\` TEXT NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_contact_events_posId_createdAt\` (\`posId\`, \`createdAt\`),
          INDEX \`IDX_contact_events_userId_createdAt\` (\`userId\`, \`createdAt\`),
          CONSTRAINT \`FK_contact_events_posId\` FOREIGN KEY (\`posId\`) REFERENCES \`points_of_sale\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_contact_events_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "contact_events"`);
      await queryRunner.query(`DROP TYPE "ContactSource"`);
      await queryRunner.query(`DROP TYPE "ContactChannel"`);
    } else {
      await queryRunner.query(`DROP TABLE \`contact_events\``);
    }
  }
}
