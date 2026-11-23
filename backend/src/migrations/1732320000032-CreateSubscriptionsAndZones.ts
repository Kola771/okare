import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionsAndZones1732320000032 implements MigrationInterface {
  name = 'CreateSubscriptionsAndZones1732320000032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'ENDED', 'CANCELLED', 'EXPIRED', 'REFUNDED')`,
      );
      await queryRunner.query(
        `CREATE TABLE "subscriptions" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "orderId" UUID,
          "posId" UUID NOT NULL,
          "vendorId" UUID NOT NULL,
          "plan" "AdPlan" NOT NULL,
          "startDate" DATE NOT NULL,
          "endDate" DATE NOT NULL,
          "days" INTEGER NOT NULL,
          "isMainPos" BOOLEAN NOT NULL,
          "baseXof" INTEGER NOT NULL,
          "discountPct" INTEGER NOT NULL DEFAULT 0,
          "totalXof" INTEGER NOT NULL,
          "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
          "isComplimentary" BOOLEAN NOT NULL DEFAULT false,
          "complimentaryReason" TEXT,
          "renewedFromId" UUID,
          "createdById" UUID NOT NULL,
          "paidAt" TIMESTAMPTZ,
          "cancelledAt" TIMESTAMPTZ,
          "cancelledById" UUID,
          "cancelReason" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
          CONSTRAINT "FK_subscriptions_orderId" FOREIGN KEY ("orderId") REFERENCES "subscription_orders"("id") ON DELETE SET NULL,
          CONSTRAINT "FK_subscriptions_posId" FOREIGN KEY ("posId") REFERENCES "points_of_sale"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_subscriptions_vendorId" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_subscriptions_posId_status" ON "subscriptions" ("posId", "status")`);
      await queryRunner.query(`CREATE INDEX "IDX_subscriptions_status_dates" ON "subscriptions" ("status", "startDate", "endDate")`);
      await queryRunner.query(
        `CREATE TABLE "subscription_zones" (
          "subscriptionId" UUID NOT NULL,
          "zoneId" UUID NOT NULL,
          "priceXof" INTEGER NOT NULL,
          CONSTRAINT "PK_subscription_zones" PRIMARY KEY ("subscriptionId", "zoneId"),
          CONSTRAINT "FK_subscription_zones_subscriptionId" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_subscription_zones_zoneId" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(
        `CREATE TABLE "zone_day_slots" (
          "zoneId" UUID NOT NULL,
          "businessDate" DATE NOT NULL,
          "subscriptionId" UUID NOT NULL,
          CONSTRAINT "PK_zone_day_slots" PRIMARY KEY ("zoneId", "businessDate", "subscriptionId"),
          CONSTRAINT "FK_zone_day_slots_zoneId" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_zone_day_slots_subscriptionId" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_zone_day_slots_zone_date" ON "zone_day_slots" ("zoneId", "businessDate")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`subscriptions\` (
          \`id\` CHAR(36) NOT NULL,
          \`orderId\` CHAR(36) NULL,
          \`posId\` CHAR(36) NOT NULL,
          \`vendorId\` CHAR(36) NOT NULL,
          \`plan\` ENUM('DAY', 'PERIOD', 'MONTH', 'PREMIUM') NOT NULL,
          \`startDate\` DATE NOT NULL,
          \`endDate\` DATE NOT NULL,
          \`days\` INT NOT NULL,
          \`isMainPos\` TINYINT(1) NOT NULL,
          \`baseXof\` INT NOT NULL,
          \`discountPct\` INT NOT NULL DEFAULT 0,
          \`totalXof\` INT NOT NULL,
          \`status\` ENUM('PENDING_PAYMENT', 'PAID', 'ENDED', 'CANCELLED', 'EXPIRED', 'REFUNDED') NOT NULL DEFAULT 'PENDING_PAYMENT',
          \`isComplimentary\` TINYINT(1) NOT NULL DEFAULT 0,
          \`complimentaryReason\` TEXT NULL,
          \`renewedFromId\` CHAR(36) NULL,
          \`createdById\` CHAR(36) NOT NULL,
          \`paidAt\` DATETIME NULL,
          \`cancelledAt\` DATETIME NULL,
          \`cancelledById\` CHAR(36) NULL,
          \`cancelReason\` TEXT NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_subscriptions_posId_status\` (\`posId\`, \`status\`),
          INDEX \`IDX_subscriptions_status_dates\` (\`status\`, \`startDate\`, \`endDate\`),
          CONSTRAINT \`FK_subscriptions_orderId\` FOREIGN KEY (\`orderId\`) REFERENCES \`subscription_orders\`(\`id\`) ON DELETE SET NULL,
          CONSTRAINT \`FK_subscriptions_posId\` FOREIGN KEY (\`posId\`) REFERENCES \`points_of_sale\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_subscriptions_vendorId\` FOREIGN KEY (\`vendorId\`) REFERENCES \`vendors\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
      await queryRunner.query(
        `CREATE TABLE \`subscription_zones\` (
          \`subscriptionId\` CHAR(36) NOT NULL,
          \`zoneId\` CHAR(36) NOT NULL,
          \`priceXof\` INT NOT NULL,
          PRIMARY KEY (\`subscriptionId\`, \`zoneId\`),
          INDEX \`IDX_subscription_zones_zoneId\` (\`zoneId\`),
          CONSTRAINT \`FK_subscription_zones_subscriptionId\` FOREIGN KEY (\`subscriptionId\`) REFERENCES \`subscriptions\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_subscription_zones_zoneId\` FOREIGN KEY (\`zoneId\`) REFERENCES \`zones\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
      await queryRunner.query(
        `CREATE TABLE \`zone_day_slots\` (
          \`zoneId\` CHAR(36) NOT NULL,
          \`businessDate\` DATE NOT NULL,
          \`subscriptionId\` CHAR(36) NOT NULL,
          PRIMARY KEY (\`zoneId\`, \`businessDate\`, \`subscriptionId\`),
          INDEX \`IDX_zone_day_slots_zone_date\` (\`zoneId\`, \`businessDate\`),
          CONSTRAINT \`FK_zone_day_slots_zoneId\` FOREIGN KEY (\`zoneId\`) REFERENCES \`zones\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_zone_day_slots_subscriptionId\` FOREIGN KEY (\`subscriptionId\`) REFERENCES \`subscriptions\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "zone_day_slots"`);
      await queryRunner.query(`DROP TABLE "subscription_zones"`);
      await queryRunner.query(`DROP TABLE "subscriptions"`);
      await queryRunner.query(`DROP TYPE "SubscriptionStatus"`);
    } else {
      await queryRunner.query(`DROP TABLE \`zone_day_slots\``);
      await queryRunner.query(`DROP TABLE \`subscription_zones\``);
      await queryRunner.query(`DROP TABLE \`subscriptions\``);
    }
  }
}
