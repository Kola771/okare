import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStatsShareLinks1732320000030 implements MigrationInterface {
  name = 'CreateStatsShareLinks1732320000030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "stats_share_links" (
          "token" VARCHAR(64) NOT NULL,
          "posId" UUID NOT NULL,
          "createdById" UUID NOT NULL,
          "expiresAt" TIMESTAMPTZ NOT NULL,
          "revokedAt" TIMESTAMPTZ,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_stats_share_links" PRIMARY KEY ("token"),
          CONSTRAINT "FK_stats_share_links_posId" FOREIGN KEY ("posId") REFERENCES "points_of_sale"("id") ON DELETE CASCADE
        )`,
      );
    } else {
      await queryRunner.query(
        `CREATE TABLE \`stats_share_links\` (
          \`token\` VARCHAR(64) NOT NULL,
          \`posId\` CHAR(36) NOT NULL,
          \`createdById\` CHAR(36) NOT NULL,
          \`expiresAt\` DATETIME NOT NULL,
          \`revokedAt\` DATETIME NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`token\`),
          INDEX \`IDX_stats_share_links_posId\` (\`posId\`),
          CONSTRAINT \`FK_stats_share_links_posId\` FOREIGN KEY (\`posId\`) REFERENCES \`points_of_sale\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "stats_share_links"`);
    } else {
      await queryRunner.query(`DROP TABLE \`stats_share_links\``);
    }
  }
}
