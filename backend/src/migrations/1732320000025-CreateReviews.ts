import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviews1732320000025 implements MigrationInterface {
  name = 'CreateReviews1732320000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'REMOVED')`);
      await queryRunner.query(
        `CREATE TABLE "reviews" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "posId" UUID NOT NULL,
          "dishId" UUID,
          "userId" UUID NOT NULL,
          "contactId" UUID NOT NULL,
          "rating" INTEGER NOT NULL,
          "comment" TEXT,
          "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
          "hiddenReason" TEXT,
          "hiddenById" UUID,
          "vendorReply" TEXT,
          "vendorRepliedAt" TIMESTAMPTZ,
          "vendorRepliedById" UUID,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_reviews_contactId" UNIQUE ("contactId"),
          CONSTRAINT "FK_reviews_posId" FOREIGN KEY ("posId") REFERENCES "points_of_sale"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_reviews_dishId" FOREIGN KEY ("dishId") REFERENCES "dishes"("id") ON DELETE SET NULL,
          CONSTRAINT "FK_reviews_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_reviews_contactId" FOREIGN KEY ("contactId") REFERENCES "contact_events"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_reviews_posId_status" ON "reviews" ("posId", "status")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`reviews\` (
          \`id\` CHAR(36) NOT NULL,
          \`posId\` CHAR(36) NOT NULL,
          \`dishId\` CHAR(36) NULL,
          \`userId\` CHAR(36) NOT NULL,
          \`contactId\` CHAR(36) NOT NULL,
          \`rating\` INT NOT NULL,
          \`comment\` TEXT NULL,
          \`status\` ENUM('PUBLISHED', 'HIDDEN', 'REMOVED') NOT NULL DEFAULT 'PUBLISHED',
          \`hiddenReason\` TEXT NULL,
          \`hiddenById\` CHAR(36) NULL,
          \`vendorReply\` TEXT NULL,
          \`vendorRepliedAt\` DATETIME NULL,
          \`vendorRepliedById\` CHAR(36) NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_reviews_contactId\` (\`contactId\`),
          INDEX \`IDX_reviews_posId_status\` (\`posId\`, \`status\`),
          CONSTRAINT \`FK_reviews_posId\` FOREIGN KEY (\`posId\`) REFERENCES \`points_of_sale\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_reviews_dishId\` FOREIGN KEY (\`dishId\`) REFERENCES \`dishes\`(\`id\`) ON DELETE SET NULL,
          CONSTRAINT \`FK_reviews_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_reviews_contactId\` FOREIGN KEY (\`contactId\`) REFERENCES \`contact_events\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "reviews"`);
      await queryRunner.query(`DROP TYPE "ReviewStatus"`);
    } else {
      await queryRunner.query(`DROP TABLE \`reviews\``);
    }
  }
}
