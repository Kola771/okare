import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSettings1732320000010 implements MigrationInterface {
  name = 'CreateSettings1732320000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "settings" (
          "key" VARCHAR(255) NOT NULL,
          "value" JSONB NOT NULL,
          "updatedById" UUID,
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_settings" PRIMARY KEY ("key")
        )`,
      );
    } else {
      await queryRunner.query(
        `CREATE TABLE \`settings\` (
          \`key\` VARCHAR(255) NOT NULL,
          \`value\` JSON NOT NULL,
          \`updatedById\` CHAR(36) NULL,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`key\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "settings"`);
    } else {
      await queryRunner.query(`DROP TABLE \`settings\``);
    }
  }
}
