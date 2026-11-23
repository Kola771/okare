import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePushSubscriptions1732320000018 implements MigrationInterface {
  name = 'CreatePushSubscriptions1732320000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "push_subscriptions" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "userId" UUID NOT NULL,
          "endpoint" TEXT NOT NULL,
          "keys" JSONB NOT NULL,
          "userAgent" TEXT,
          "lastUsedAt" TIMESTAMPTZ,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_push_subscriptions" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_push_subscriptions_endpoint" UNIQUE ("endpoint"),
          CONSTRAINT "FK_push_subscriptions_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        )`,
      );
    } else {
      await queryRunner.query(
        `CREATE TABLE \`push_subscriptions\` (
          \`id\` CHAR(36) NOT NULL,
          \`userId\` CHAR(36) NOT NULL,
          \`endpoint\` TEXT NOT NULL,
          \`keys\` JSON NOT NULL,
          \`userAgent\` TEXT NULL,
          \`lastUsedAt\` DATETIME NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_push_subscriptions_userId\` (\`userId\`),
          CONSTRAINT \`FK_push_subscriptions_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "push_subscriptions"`);
    } else {
      await queryRunner.query(`DROP TABLE \`push_subscriptions\``);
    }
  }
}
