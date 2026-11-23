import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePriceGridAndSubscriptionOrders1732320000031 implements MigrationInterface {
  name = 'CreatePriceGridAndSubscriptionOrders1732320000031';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`CREATE TYPE "AdPlan" AS ENUM ('DAY', 'PERIOD', 'MONTH', 'PREMIUM')`);
      await queryRunner.query(`CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED')`);
      await queryRunner.query(`CREATE TYPE "PaymentOrigin" AS ENUM ('VENDOR_APP', 'PAYMENT_LINK')`);
      await queryRunner.query(
        `CREATE TABLE "price_grid" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "categoryId" UUID NOT NULL,
          "posType" "PosType" NOT NULL,
          "dayPriceXof" INTEGER NOT NULL,
          "updatedById" UUID,
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_price_grid" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_price_grid_categoryId_posType" UNIQUE ("categoryId", "posType"),
          CONSTRAINT "FK_price_grid_categoryId" FOREIGN KEY ("categoryId") REFERENCES "zone_categories"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(
        `CREATE TABLE "subscription_orders" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "number" VARCHAR(30) NOT NULL,
          "vendorId" UUID NOT NULL,
          "origin" "PaymentOrigin" NOT NULL,
          "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
          "subtotalXof" INTEGER NOT NULL,
          "discountXof" INTEGER NOT NULL,
          "totalXof" INTEGER NOT NULL,
          "holdUntil" TIMESTAMPTZ,
          "paidAt" TIMESTAMPTZ,
          "receiptUrl" TEXT,
          "createdById" UUID NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_subscription_orders" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_subscription_orders_number" UNIQUE ("number"),
          CONSTRAINT "FK_subscription_orders_vendorId" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_subscription_orders_vendorId_status" ON "subscription_orders" ("vendorId", "status")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`price_grid\` (
          \`id\` CHAR(36) NOT NULL,
          \`categoryId\` CHAR(36) NOT NULL,
          \`posType\` ENUM('PARTICULIER', 'MAQUIS', 'RESTAURANT') NOT NULL,
          \`dayPriceXof\` INT NOT NULL,
          \`updatedById\` CHAR(36) NULL,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_price_grid_categoryId_posType\` (\`categoryId\`, \`posType\`),
          CONSTRAINT \`FK_price_grid_categoryId\` FOREIGN KEY (\`categoryId\`) REFERENCES \`zone_categories\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
      await queryRunner.query(
        `CREATE TABLE \`subscription_orders\` (
          \`id\` CHAR(36) NOT NULL,
          \`number\` VARCHAR(30) NOT NULL,
          \`vendorId\` CHAR(36) NOT NULL,
          \`origin\` ENUM('VENDOR_APP', 'PAYMENT_LINK') NOT NULL,
          \`status\` ENUM('PENDING_PAYMENT', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING_PAYMENT',
          \`subtotalXof\` INT NOT NULL,
          \`discountXof\` INT NOT NULL,
          \`totalXof\` INT NOT NULL,
          \`holdUntil\` DATETIME NULL,
          \`paidAt\` DATETIME NULL,
          \`receiptUrl\` TEXT NULL,
          \`createdById\` CHAR(36) NOT NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_subscription_orders_number\` (\`number\`),
          INDEX \`IDX_subscription_orders_vendorId_status\` (\`vendorId\`, \`status\`),
          CONSTRAINT \`FK_subscription_orders_vendorId\` FOREIGN KEY (\`vendorId\`) REFERENCES \`vendors\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "subscription_orders"`);
      await queryRunner.query(`DROP TABLE "price_grid"`);
      await queryRunner.query(`DROP TYPE "PaymentOrigin"`);
      await queryRunner.query(`DROP TYPE "OrderStatus"`);
      await queryRunner.query(`DROP TYPE "AdPlan"`);
    } else {
      await queryRunner.query(`DROP TABLE \`subscription_orders\``);
      await queryRunner.query(`DROP TABLE \`price_grid\``);
    }
  }
}
