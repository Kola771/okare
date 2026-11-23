import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePosDayOverrides1732320000021 implements MigrationInterface {
  name = 'CreatePosDayOverrides1732320000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TYPE "DayStatusSource" AS ENUM ('TEAM', 'VENDOR', 'CLIENT_REPORTS', 'AUTO')`,
      );
      await queryRunner.query(
        `CREATE TABLE "pos_day_overrides" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "posId" UUID NOT NULL,
          "businessDate" DATE NOT NULL,
          "isClosed" BOOLEAN NOT NULL,
          "ranges" JSONB,
          "reason" TEXT,
          "source" "DayStatusSource" NOT NULL,
          "createdById" UUID,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_pos_day_overrides" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_pos_day_overrides_posId_date" UNIQUE ("posId", "businessDate"),
          CONSTRAINT "FK_pos_day_overrides_posId" FOREIGN KEY ("posId") REFERENCES "points_of_sale"("id") ON DELETE CASCADE
        )`,
      );
    } else {
      await queryRunner.query(
        `CREATE TABLE \`pos_day_overrides\` (
          \`id\` CHAR(36) NOT NULL,
          \`posId\` CHAR(36) NOT NULL,
          \`businessDate\` DATE NOT NULL,
          \`isClosed\` TINYINT(1) NOT NULL,
          \`ranges\` JSON NULL,
          \`reason\` TEXT NULL,
          \`source\` ENUM('TEAM', 'VENDOR', 'CLIENT_REPORTS', 'AUTO') NOT NULL,
          \`createdById\` CHAR(36) NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_pos_day_overrides_posId_date\` (\`posId\`, \`businessDate\`),
          CONSTRAINT \`FK_pos_day_overrides_posId\` FOREIGN KEY (\`posId\`) REFERENCES \`points_of_sale\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "pos_day_overrides"`);
      await queryRunner.query(`DROP TYPE "DayStatusSource"`);
    } else {
      await queryRunner.query(`DROP TABLE \`pos_day_overrides\``);
    }
  }
}
