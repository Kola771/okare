import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1732320000007 implements MigrationInterface {
  name = 'CreateUsers1732320000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TYPE "Role" AS ENUM ('CLIENT', 'VENDOR', 'FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN')`,
      );
      await queryRunner.query(
        `CREATE TABLE "users" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "phone" VARCHAR(30),
          "email" VARCHAR(255),
          "googleSub" VARCHAR(255),
          "passwordHash" TEXT,
          "fullName" VARCHAR(255),
          "avatarMediaId" UUID,
          "roles" "Role"[] NOT NULL DEFAULT '{CLIENT}',
          "homeZoneId" UUID,
          "budgetMaxXof" INTEGER,
          "notifyFavorites" BOOLEAN NOT NULL DEFAULT true,
          "askFollowUp" BOOLEAN NOT NULL DEFAULT true,
          "notifyNews" BOOLEAN NOT NULL DEFAULT false,
          "phoneVerifiedAt" TIMESTAMPTZ,
          "totpSecret" TEXT,
          "totpEnabledAt" TIMESTAMPTZ,
          "isBlocked" BOOLEAN NOT NULL DEFAULT false,
          "blockedReason" TEXT,
          "lastSeenAt" TIMESTAMPTZ,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMPTZ,
          CONSTRAINT "PK_users" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_users_phone" UNIQUE ("phone"),
          CONSTRAINT "UQ_users_email" UNIQUE ("email"),
          CONSTRAINT "UQ_users_googleSub" UNIQUE ("googleSub"),
          CONSTRAINT "FK_users_homeZoneId" FOREIGN KEY ("homeZoneId") REFERENCES "zones"("id") ON DELETE SET NULL
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_users_homeZoneId" ON "users" ("homeZoneId")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`users\` (
          \`id\` CHAR(36) NOT NULL,
          \`phone\` VARCHAR(30) NULL,
          \`email\` VARCHAR(255) NULL,
          \`googleSub\` VARCHAR(255) NULL,
          \`passwordHash\` TEXT NULL,
          \`fullName\` VARCHAR(255) NULL,
          \`avatarMediaId\` CHAR(36) NULL,
          \`roles\` JSON NOT NULL,
          \`homeZoneId\` CHAR(36) NULL,
          \`budgetMaxXof\` INT NULL,
          \`notifyFavorites\` TINYINT(1) NOT NULL DEFAULT 1,
          \`askFollowUp\` TINYINT(1) NOT NULL DEFAULT 1,
          \`notifyNews\` TINYINT(1) NOT NULL DEFAULT 0,
          \`phoneVerifiedAt\` DATETIME NULL,
          \`totpSecret\` TEXT NULL,
          \`totpEnabledAt\` DATETIME NULL,
          \`isBlocked\` TINYINT(1) NOT NULL DEFAULT 0,
          \`blockedReason\` TEXT NULL,
          \`lastSeenAt\` DATETIME NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          \`deletedAt\` DATETIME NULL,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_users_phone\` (\`phone\`),
          UNIQUE INDEX \`UQ_users_email\` (\`email\`),
          UNIQUE INDEX \`UQ_users_googleSub\` (\`googleSub\`),
          INDEX \`IDX_users_homeZoneId\` (\`homeZoneId\`),
          CONSTRAINT \`FK_users_homeZoneId\` FOREIGN KEY (\`homeZoneId\`) REFERENCES \`zones\`(\`id\`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "users"`);
      await queryRunner.query(`DROP TYPE "Role"`);
    } else {
      await queryRunner.query(`DROP TABLE \`users\``);
    }
  }
}
