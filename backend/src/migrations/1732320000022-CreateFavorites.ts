import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFavorites1732320000022 implements MigrationInterface {
  name = 'CreateFavorites1732320000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "favorites" (
          "userId" UUID NOT NULL,
          "posId" UUID NOT NULL,
          "notifyDaily" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_favorites" PRIMARY KEY ("userId", "posId"),
          CONSTRAINT "FK_favorites_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_favorites_posId" FOREIGN KEY ("posId") REFERENCES "points_of_sale"("id") ON DELETE CASCADE
        )`,
      );
    } else {
      await queryRunner.query(
        `CREATE TABLE \`favorites\` (
          \`userId\` CHAR(36) NOT NULL,
          \`posId\` CHAR(36) NOT NULL,
          \`notifyDaily\` TINYINT(1) NOT NULL DEFAULT 1,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`userId\`, \`posId\`),
          INDEX \`IDX_favorites_posId\` (\`posId\`),
          CONSTRAINT \`FK_favorites_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_favorites_posId\` FOREIGN KEY (\`posId\`) REFERENCES \`points_of_sale\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "favorites"`);
    } else {
      await queryRunner.query(`DROP TABLE \`favorites\``);
    }
  }
}
