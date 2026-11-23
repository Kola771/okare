import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCountries1732320000001 implements MigrationInterface {
  name = 'CreateCountries1732320000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "countries" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "code" VARCHAR(2) NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "currency" VARCHAR(10) NOT NULL DEFAULT 'XOF',
          "timezone" VARCHAR(100) NOT NULL DEFAULT 'Africa/Porto-Novo',
          "phoneRegex" VARCHAR(255) NOT NULL,
          "isActive" BOOLEAN NOT NULL DEFAULT false,
          CONSTRAINT "PK_countries" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_countries_code" UNIQUE ("code")
        )`,
      );
    } else {
      await queryRunner.query(
        `CREATE TABLE \`countries\` (
          \`id\` CHAR(36) NOT NULL,
          \`code\` VARCHAR(2) NOT NULL,
          \`name\` VARCHAR(255) NOT NULL,
          \`currency\` VARCHAR(10) NOT NULL DEFAULT 'XOF',
          \`timezone\` VARCHAR(100) NOT NULL DEFAULT 'Africa/Porto-Novo',
          \`phoneRegex\` VARCHAR(255) NOT NULL,
          \`isActive\` TINYINT(1) NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_countries_code\` (\`code\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "countries"`);
    } else {
      await queryRunner.query(`DROP TABLE \`countries\``);
    }
  }
}
