import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessions1732320000011 implements MigrationInterface {
  name = 'CreateSessions1732320000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "sessions" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "userId" UUID NOT NULL,
          "tokenHash" VARCHAR(255) NOT NULL,
          "deviceId" VARCHAR(255),
          "userAgent" TEXT,
          "ipHash" VARCHAR(255),
          "expiresAt" TIMESTAMPTZ NOT NULL,
          "revokedAt" TIMESTAMPTZ,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_sessions" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_sessions_tokenHash" UNIQUE ("tokenHash"),
          CONSTRAINT "FK_sessions_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_sessions_userId" ON "sessions" ("userId")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`sessions\` (
          \`id\` CHAR(36) NOT NULL,
          \`userId\` CHAR(36) NOT NULL,
          \`tokenHash\` VARCHAR(255) NOT NULL,
          \`deviceId\` VARCHAR(255) NULL,
          \`userAgent\` TEXT NULL,
          \`ipHash\` VARCHAR(255) NULL,
          \`expiresAt\` DATETIME NOT NULL,
          \`revokedAt\` DATETIME NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_sessions_tokenHash\` (\`tokenHash\`),
          INDEX \`IDX_sessions_userId\` (\`userId\`),
          CONSTRAINT \`FK_sessions_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "sessions"`);
    } else {
      await queryRunner.query(`DROP TABLE \`sessions\``);
    }
  }
}
