import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentsAndEvents1732320000033 implements MigrationInterface {
  name = 'CreatePaymentsAndEvents1732320000033';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`CREATE TYPE "PaymentMethod" AS ENUM ('MTN', 'MOOV', 'CELTIIS', 'CARD', 'OTHER')`);
      await queryRunner.query(`CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'CANCELED', 'EXPIRED', 'REFUNDED')`);
      await queryRunner.query(
        `CREATE TABLE "payments" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "orderId" UUID NOT NULL,
          "vendorId" UUID NOT NULL,
          "amountXof" INTEGER NOT NULL,
          "feeXof" INTEGER,
          "currency" VARCHAR(10) NOT NULL DEFAULT 'XOF',
          "provider" VARCHAR(30) NOT NULL DEFAULT 'FEDAPAY',
          "providerTransactionId" VARCHAR(255),
          "providerReference" VARCHAR(255),
          "checkoutUrl" TEXT,
          "method" "PaymentMethod",
          "payerPhone" VARCHAR(30),
          "payerName" VARCHAR(255),
          "payerEmail" VARCHAR(255),
          "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
          "origin" "PaymentOrigin" NOT NULL,
          "initiatedById" UUID NOT NULL,
          "approvedAt" TIMESTAMPTZ,
          "failedAt" TIMESTAMPTZ,
          "failureReason" TEXT,
          "refundedAt" TIMESTAMPTZ,
          "refundedById" UUID,
          "refundReason" TEXT,
          "receiptNumber" VARCHAR(50),
          "lastProviderStatus" JSONB,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_payments" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_payments_providerTransactionId" UNIQUE ("providerTransactionId"),
          CONSTRAINT "UQ_payments_receiptNumber" UNIQUE ("receiptNumber"),
          CONSTRAINT "FK_payments_orderId" FOREIGN KEY ("orderId") REFERENCES "subscription_orders"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_payments_vendorId" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_payments_status_createdAt" ON "payments" ("status", "createdAt")`);
      await queryRunner.query(
        `CREATE TABLE "payment_events" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "provider" VARCHAR(30) NOT NULL DEFAULT 'FEDAPAY',
          "providerEventId" VARCHAR(255),
          "name" VARCHAR(100) NOT NULL,
          "providerTransactionId" VARCHAR(255) NOT NULL,
          "paymentId" UUID,
          "payload" JSONB NOT NULL,
          "signatureValid" BOOLEAN NOT NULL,
          "receivedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "processedAt" TIMESTAMPTZ,
          "error" TEXT,
          CONSTRAINT "PK_payment_events" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_payment_events_providerEventId" UNIQUE ("providerEventId"),
          CONSTRAINT "FK_payment_events_paymentId" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_payment_events_providerTransactionId" ON "payment_events" ("providerTransactionId")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`payments\` (
          \`id\` CHAR(36) NOT NULL,
          \`orderId\` CHAR(36) NOT NULL,
          \`vendorId\` CHAR(36) NOT NULL,
          \`amountXof\` INT NOT NULL,
          \`feeXof\` INT NULL,
          \`currency\` VARCHAR(10) NOT NULL DEFAULT 'XOF',
          \`provider\` VARCHAR(30) NOT NULL DEFAULT 'FEDAPAY',
          \`providerTransactionId\` VARCHAR(255) NULL,
          \`providerReference\` VARCHAR(255) NULL,
          \`checkoutUrl\` TEXT NULL,
          \`method\` ENUM('MTN', 'MOOV', 'CELTIIS', 'CARD', 'OTHER') NULL,
          \`payerPhone\` VARCHAR(30) NULL,
          \`payerName\` VARCHAR(255) NULL,
          \`payerEmail\` VARCHAR(255) NULL,
          \`status\` ENUM('PENDING', 'APPROVED', 'DECLINED', 'CANCELED', 'EXPIRED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
          \`origin\` ENUM('VENDOR_APP', 'PAYMENT_LINK') NOT NULL,
          \`initiatedById\` CHAR(36) NOT NULL,
          \`approvedAt\` DATETIME NULL,
          \`failedAt\` DATETIME NULL,
          \`failureReason\` TEXT NULL,
          \`refundedAt\` DATETIME NULL,
          \`refundedById\` CHAR(36) NULL,
          \`refundReason\` TEXT NULL,
          \`receiptNumber\` VARCHAR(50) NULL,
          \`lastProviderStatus\` JSON NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_payments_providerTransactionId\` (\`providerTransactionId\`),
          UNIQUE INDEX \`UQ_payments_receiptNumber\` (\`receiptNumber\`),
          INDEX \`IDX_payments_status_createdAt\` (\`status\`, \`createdAt\`),
          CONSTRAINT \`FK_payments_orderId\` FOREIGN KEY (\`orderId\`) REFERENCES \`subscription_orders\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_payments_vendorId\` FOREIGN KEY (\`vendorId\`) REFERENCES \`vendors\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
      await queryRunner.query(
        `CREATE TABLE \`payment_events\` (
          \`id\` CHAR(36) NOT NULL,
          \`provider\` VARCHAR(30) NOT NULL DEFAULT 'FEDAPAY',
          \`providerEventId\` VARCHAR(255) NULL,
          \`name\` VARCHAR(100) NOT NULL,
          \`providerTransactionId\` VARCHAR(255) NOT NULL,
          \`paymentId\` CHAR(36) NULL,
          \`payload\` JSON NOT NULL,
          \`signatureValid\` TINYINT(1) NOT NULL,
          \`receivedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`processedAt\` DATETIME NULL,
          \`error\` TEXT NULL,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_payment_events_providerEventId\` (\`providerEventId\`),
          INDEX \`IDX_payment_events_providerTransactionId\` (\`providerTransactionId\`),
          CONSTRAINT \`FK_payment_events_paymentId\` FOREIGN KEY (\`paymentId\`) REFERENCES \`payments\`(\`id\`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "payment_events"`);
      await queryRunner.query(`DROP TABLE "payments"`);
      await queryRunner.query(`DROP TYPE "PaymentStatus"`);
      await queryRunner.query(`DROP TYPE "PaymentMethod"`);
    } else {
      await queryRunner.query(`DROP TABLE \`payment_events\``);
      await queryRunner.query(`DROP TABLE \`payments\``);
    }
  }
}
