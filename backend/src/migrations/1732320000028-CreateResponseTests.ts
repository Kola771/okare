import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateResponseTests1732320000028 implements MigrationInterface {
  name = 'CreateResponseTests1732320000028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "response_tests" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "posId" UUID NOT NULL,
          "agentId" UUID NOT NULL,
          "sentAt" TIMESTAMPTZ NOT NULL,
          "answeredWithinMin" INTEGER,
          "note" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_response_tests" PRIMARY KEY ("id"),
          CONSTRAINT "FK_response_tests_posId" FOREIGN KEY ("posId") REFERENCES "points_of_sale"("id") ON DELETE CASCADE
        )`,
      );
    } else {
      await queryRunner.query(
        `CREATE TABLE \`response_tests\` (
          \`id\` CHAR(36) NOT NULL,
          \`posId\` CHAR(36) NOT NULL,
          \`agentId\` CHAR(36) NOT NULL,
          \`sentAt\` DATETIME NOT NULL,
          \`answeredWithinMin\` INT NULL,
          \`note\` TEXT NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_response_tests_posId\` (\`posId\`),
          CONSTRAINT \`FK_response_tests_posId\` FOREIGN KEY (\`posId\`) REFERENCES \`points_of_sale\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "response_tests"`);
    } else {
      await queryRunner.query(`DROP TABLE \`response_tests\``);
    }
  }
}
