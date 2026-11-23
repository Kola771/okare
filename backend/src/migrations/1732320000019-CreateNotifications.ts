import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1732320000019 implements MigrationInterface {
  name = 'CreateNotifications1732320000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TYPE "NotificationType" AS ENUM ('FAVORITE_SPECIAL', 'FOLLOW_UP', 'PAYMENT_APPROVED', 'PAYMENT_FAILED', 'SUBSCRIPTION_NOTICE', 'SUBSCRIPTION_ENDING', 'REVIEW_RECEIVED', 'REPORT_RESOLVED', 'SYSTEM')`,
      );
      await queryRunner.query(
        `CREATE TABLE "notifications" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "userId" UUID NOT NULL,
          "type" "NotificationType" NOT NULL,
          "title" VARCHAR(255) NOT NULL,
          "body" TEXT NOT NULL,
          "link" VARCHAR(500),
          "data" JSONB,
          "readAt" TIMESTAMPTZ,
          "pushedAt" TIMESTAMPTZ,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
          CONSTRAINT "FK_notifications_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_notifications_userId_readAt" ON "notifications" ("userId", "readAt")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`notifications\` (
          \`id\` CHAR(36) NOT NULL,
          \`userId\` CHAR(36) NOT NULL,
          \`type\` ENUM('FAVORITE_SPECIAL', 'FOLLOW_UP', 'PAYMENT_APPROVED', 'PAYMENT_FAILED', 'SUBSCRIPTION_NOTICE', 'SUBSCRIPTION_ENDING', 'REVIEW_RECEIVED', 'REPORT_RESOLVED', 'SYSTEM') NOT NULL,
          \`title\` VARCHAR(255) NOT NULL,
          \`body\` TEXT NOT NULL,
          \`link\` VARCHAR(500) NULL,
          \`data\` JSON NULL,
          \`readAt\` DATETIME NULL,
          \`pushedAt\` DATETIME NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_notifications_userId_readAt\` (\`userId\`, \`readAt\`),
          CONSTRAINT \`FK_notifications_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "notifications"`);
      await queryRunner.query(`DROP TYPE "NotificationType"`);
    } else {
      await queryRunner.query(`DROP TABLE \`notifications\``);
    }
  }
}
