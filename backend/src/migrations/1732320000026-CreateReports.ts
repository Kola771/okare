import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReports1732320000026 implements MigrationInterface {
  name = 'CreateReports1732320000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`CREATE TYPE "ReportTarget" AS ENUM ('POS', 'DISH', 'REVIEW', 'USER')`);
      await queryRunner.query(
        `CREATE TYPE "ReportReason" AS ENUM ('WRONG_INFO', 'WRONG_PRICE', 'CLOSED_TODAY', 'WRONG_HOURS', 'CLOSED_PERMANENTLY', 'NO_ANSWER', 'FAKE_REVIEW', 'FOOD_SAFETY', 'INAPPROPRIATE', 'FRAUD', 'OTHER')`,
      );
      await queryRunner.query(`CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'REJECTED')`);
      await queryRunner.query(
        `CREATE TABLE "reports" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "targetType" "ReportTarget" NOT NULL,
          "posId" UUID,
          "dishId" UUID,
          "reviewId" UUID,
          "targetUserId" UUID,
          "userId" UUID NOT NULL,
          "reason" "ReportReason" NOT NULL,
          "comment" TEXT,
          "businessDate" DATE NOT NULL,
          "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
          "resolvedById" UUID,
          "resolvedAt" TIMESTAMPTZ,
          "resolution" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_reports" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_reports_unique_per_day" UNIQUE ("userId", "targetType", "posId", "dishId", "reviewId", "targetUserId", "reason", "businessDate"),
          CONSTRAINT "FK_reports_posId" FOREIGN KEY ("posId") REFERENCES "points_of_sale"("id") ON DELETE SET NULL,
          CONSTRAINT "FK_reports_reviewId" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE SET NULL,
          CONSTRAINT "FK_reports_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_reports_status_createdAt" ON "reports" ("status", "createdAt")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`reports\` (
          \`id\` CHAR(36) NOT NULL,
          \`targetType\` ENUM('POS', 'DISH', 'REVIEW', 'USER') NOT NULL,
          \`posId\` CHAR(36) NULL,
          \`dishId\` CHAR(36) NULL,
          \`reviewId\` CHAR(36) NULL,
          \`targetUserId\` CHAR(36) NULL,
          \`userId\` CHAR(36) NOT NULL,
          \`reason\` ENUM('WRONG_INFO', 'WRONG_PRICE', 'CLOSED_TODAY', 'WRONG_HOURS', 'CLOSED_PERMANENTLY', 'NO_ANSWER', 'FAKE_REVIEW', 'FOOD_SAFETY', 'INAPPROPRIATE', 'FRAUD', 'OTHER') NOT NULL,
          \`comment\` TEXT NULL,
          \`businessDate\` DATE NOT NULL,
          \`status\` ENUM('OPEN', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'OPEN',
          \`resolvedById\` CHAR(36) NULL,
          \`resolvedAt\` DATETIME NULL,
          \`resolution\` TEXT NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_reports_unique_per_day\` (\`userId\`, \`targetType\`, \`posId\`, \`dishId\`, \`reviewId\`, \`targetUserId\`, \`reason\`, \`businessDate\`),
          INDEX \`IDX_reports_status_createdAt\` (\`status\`, \`createdAt\`),
          CONSTRAINT \`FK_reports_posId\` FOREIGN KEY (\`posId\`) REFERENCES \`points_of_sale\`(\`id\`) ON DELETE SET NULL,
          CONSTRAINT \`FK_reports_reviewId\` FOREIGN KEY (\`reviewId\`) REFERENCES \`reviews\`(\`id\`) ON DELETE SET NULL,
          CONSTRAINT \`FK_reports_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "reports"`);
      await queryRunner.query(`DROP TYPE "ReportStatus"`);
      await queryRunner.query(`DROP TYPE "ReportReason"`);
      await queryRunner.query(`DROP TYPE "ReportTarget"`);
    } else {
      await queryRunner.query(`DROP TABLE \`reports\``);
    }
  }
}
