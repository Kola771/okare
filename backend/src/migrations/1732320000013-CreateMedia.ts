import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMedia1732320000013 implements MigrationInterface {
  name = 'CreateMedia1732320000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`CREATE TYPE "MediaOwner" AS ENUM ('POS', 'DISH', 'USER', 'REVIEW', 'REPORT')`);
      await queryRunner.query(`CREATE TYPE "MediaStatus" AS ENUM ('PROCESSING', 'READY', 'REJECTED')`);
      await queryRunner.query(
        `CREATE TABLE "media" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "ownerType" "MediaOwner" NOT NULL,
          "ownerId" UUID NOT NULL,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "originalKey" TEXT NOT NULL,
          "variants" JSONB NOT NULL,
          "width" INTEGER,
          "height" INTEGER,
          "status" "MediaStatus" NOT NULL DEFAULT 'PROCESSING',
          "rejectionReason" TEXT,
          "uploadedById" UUID NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMPTZ,
          CONSTRAINT "PK_media" PRIMARY KEY ("id")
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_media_owner" ON "media" ("ownerType", "ownerId", "sortOrder")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`media\` (
          \`id\` CHAR(36) NOT NULL,
          \`ownerType\` ENUM('POS', 'DISH', 'USER', 'REVIEW', 'REPORT') NOT NULL,
          \`ownerId\` CHAR(36) NOT NULL,
          \`sortOrder\` INT NOT NULL DEFAULT 0,
          \`originalKey\` TEXT NOT NULL,
          \`variants\` JSON NOT NULL,
          \`width\` INT NULL,
          \`height\` INT NULL,
          \`status\` ENUM('PROCESSING', 'READY', 'REJECTED') NOT NULL DEFAULT 'PROCESSING',
          \`rejectionReason\` TEXT NULL,
          \`uploadedById\` CHAR(36) NOT NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`deletedAt\` DATETIME NULL,
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_media_owner\` (\`ownerType\`, \`ownerId\`, \`sortOrder\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "media"`);
      await queryRunner.query(`DROP TYPE "MediaStatus"`);
      await queryRunner.query(`DROP TYPE "MediaOwner"`);
    } else {
      await queryRunner.query(`DROP TABLE \`media\``);
    }
  }
}
