import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWaitlistAndLaunchAndNotices1732320000034 implements MigrationInterface {
  name = 'CreateWaitlistAndLaunchAndNotices1732320000034';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'OFFERED', 'CONVERTED', 'EXPIRED', 'LEFT')`);
      await queryRunner.query(`CREATE TYPE "NoticeChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'IN_APP')`);
      await queryRunner.query(`CREATE TYPE "NoticeKind" AS ENUM ('ANNOUNCEMENT', 'REMINDER', 'LAST_DAY', 'NOTICE_ENDED', 'RECEIPT')`);
      await queryRunner.query(`CREATE TYPE "NoticeStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'SKIPPED')`);
      await queryRunner.query(
        `CREATE TABLE "waitlist_entries" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "zoneId" UUID NOT NULL,
          "posId" UUID NOT NULL,
          "plan" "AdPlan" NOT NULL,
          "wantedStart" DATE NOT NULL,
          "wantedEnd" DATE NOT NULL,
          "status" "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
          "offeredAt" TIMESTAMPTZ,
          "offerExpiresAt" TIMESTAMPTZ,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_waitlist_entries" PRIMARY KEY ("id"),
          CONSTRAINT "FK_waitlist_entries_zoneId" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_waitlist_entries_posId" FOREIGN KEY ("posId") REFERENCES "points_of_sale"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(
        `CREATE TABLE "subscription_launches" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "activatedById" UUID NOT NULL,
          "activatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "minVendorAgeDays" INTEGER NOT NULL,
          "noticeDays" INTEGER NOT NULL,
          "channels" "NoticeChannel"[] NOT NULL,
          "messageTemplate" TEXT NOT NULL,
          "vendorsNotified" INTEGER NOT NULL DEFAULT 0,
          "deactivatedAt" TIMESTAMPTZ,
          "deactivatedById" UUID,
          "deactivationReason" TEXT,
          CONSTRAINT "PK_subscription_launches" PRIMARY KEY ("id")
        )`,
      );
      await queryRunner.query(
        `CREATE TABLE "vendor_notices" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "vendorId" UUID NOT NULL,
          "launchId" UUID,
          "kind" "NoticeKind" NOT NULL,
          "channel" "NoticeChannel" NOT NULL,
          "status" "NoticeStatus" NOT NULL DEFAULT 'QUEUED',
          "body" TEXT NOT NULL,
          "providerRef" VARCHAR(255),
          "error" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "sentAt" TIMESTAMPTZ,
          CONSTRAINT "PK_vendor_notices" PRIMARY KEY ("id"),
          CONSTRAINT "FK_vendor_notices_vendorId" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_vendor_notices_launchId" FOREIGN KEY ("launchId") REFERENCES "subscription_launches"("id") ON DELETE SET NULL
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_vendor_notices_vendorId_kind" ON "vendor_notices" ("vendorId", "kind")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`waitlist_entries\` (
          \`id\` CHAR(36) NOT NULL,
          \`zoneId\` CHAR(36) NOT NULL,
          \`posId\` CHAR(36) NOT NULL,
          \`plan\` ENUM('DAY', 'PERIOD', 'MONTH', 'PREMIUM') NOT NULL,
          \`wantedStart\` DATE NOT NULL,
          \`wantedEnd\` DATE NOT NULL,
          \`status\` ENUM('WAITING', 'OFFERED', 'CONVERTED', 'EXPIRED', 'LEFT') NOT NULL DEFAULT 'WAITING',
          \`offeredAt\` DATETIME NULL,
          \`offerExpiresAt\` DATETIME NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_waitlist_entries_zoneId\` (\`zoneId\`),
          CONSTRAINT \`FK_waitlist_entries_zoneId\` FOREIGN KEY (\`zoneId\`) REFERENCES \`zones\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_waitlist_entries_posId\` FOREIGN KEY (\`posId\`) REFERENCES \`points_of_sale\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
      await queryRunner.query(
        `CREATE TABLE \`subscription_launches\` (
          \`id\` CHAR(36) NOT NULL,
          \`activatedById\` CHAR(36) NOT NULL,
          \`activatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`minVendorAgeDays\` INT NOT NULL,
          \`noticeDays\` INT NOT NULL,
          \`channels\` JSON NOT NULL,
          \`messageTemplate\` TEXT NOT NULL,
          \`vendorsNotified\` INT NOT NULL DEFAULT 0,
          \`deactivatedAt\` DATETIME NULL,
          \`deactivatedById\` CHAR(36) NULL,
          \`deactivationReason\` TEXT NULL,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
      await queryRunner.query(
        `CREATE TABLE \`vendor_notices\` (
          \`id\` CHAR(36) NOT NULL,
          \`vendorId\` CHAR(36) NOT NULL,
          \`launchId\` CHAR(36) NULL,
          \`kind\` ENUM('ANNOUNCEMENT', 'REMINDER', 'LAST_DAY', 'NOTICE_ENDED', 'RECEIPT') NOT NULL,
          \`channel\` ENUM('WHATSAPP', 'EMAIL', 'IN_APP') NOT NULL,
          \`status\` ENUM('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'QUEUED',
          \`body\` TEXT NOT NULL,
          \`providerRef\` VARCHAR(255) NULL,
          \`error\` TEXT NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`sentAt\` DATETIME NULL,
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_vendor_notices_vendorId_kind\` (\`vendorId\`, \`kind\`),
          CONSTRAINT \`FK_vendor_notices_vendorId\` FOREIGN KEY (\`vendorId\`) REFERENCES \`vendors\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_vendor_notices_launchId\` FOREIGN KEY (\`launchId\`) REFERENCES \`subscription_launches\`(\`id\`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "vendor_notices"`);
      await queryRunner.query(`DROP TABLE "subscription_launches"`);
      await queryRunner.query(`DROP TABLE "waitlist_entries"`);
      await queryRunner.query(`DROP TYPE "NoticeStatus"`);
      await queryRunner.query(`DROP TYPE "NoticeKind"`);
      await queryRunner.query(`DROP TYPE "NoticeChannel"`);
      await queryRunner.query(`DROP TYPE "WaitlistStatus"`);
    } else {
      await queryRunner.query(`DROP TABLE \`vendor_notices\``);
      await queryRunner.query(`DROP TABLE \`subscription_launches\``);
      await queryRunner.query(`DROP TABLE \`waitlist_entries\``);
    }
  }
}
