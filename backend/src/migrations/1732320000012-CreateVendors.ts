import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVendors1732320000012 implements MigrationInterface {
  name = 'CreateVendors1732320000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "vendors" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "displayName" VARCHAR(255) NOT NULL,
          "contactName" VARCHAR(255),
          "contactPhone" VARCHAR(30) NOT NULL,
          "email" VARCHAR(255),
          "userId" UUID,
          "followedById" UUID,
          "notes" TEXT,
          "mainPosId" UUID,
          "mainPosComputedAt" TIMESTAMPTZ,
          "firstPublishedAt" TIMESTAMPTZ,
          "subscriptionNoticeAt" TIMESTAMPTZ,
          "subscriptionRequiredFrom" TIMESTAMPTZ,
          "createdById" UUID NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMPTZ,
          CONSTRAINT "PK_vendors" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_vendors_userId" UNIQUE ("userId"),
          CONSTRAINT "UQ_vendors_mainPosId" UNIQUE ("mainPosId"),
          CONSTRAINT "FK_vendors_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
        )`,
      );
    } else {
      await queryRunner.query(
        `CREATE TABLE \`vendors\` (
          \`id\` CHAR(36) NOT NULL,
          \`displayName\` VARCHAR(255) NOT NULL,
          \`contactName\` VARCHAR(255) NULL,
          \`contactPhone\` VARCHAR(30) NOT NULL,
          \`email\` VARCHAR(255) NULL,
          \`userId\` CHAR(36) NULL,
          \`followedById\` CHAR(36) NULL,
          \`notes\` TEXT NULL,
          \`mainPosId\` CHAR(36) NULL,
          \`mainPosComputedAt\` DATETIME NULL,
          \`firstPublishedAt\` DATETIME NULL,
          \`subscriptionNoticeAt\` DATETIME NULL,
          \`subscriptionRequiredFrom\` DATETIME NULL,
          \`createdById\` CHAR(36) NOT NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          \`deletedAt\` DATETIME NULL,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_vendors_userId\` (\`userId\`),
          UNIQUE INDEX \`UQ_vendors_mainPosId\` (\`mainPosId\`),
          CONSTRAINT \`FK_vendors_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "vendors"`);
    } else {
      await queryRunner.query(`DROP TABLE \`vendors\``);
    }
  }
}
