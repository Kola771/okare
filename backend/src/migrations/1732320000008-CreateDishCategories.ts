import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDishCategories1732320000008 implements MigrationInterface {
  name = 'CreateDishCategories1732320000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "dish_categories" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "name" VARCHAR(255) NOT NULL,
          "slug" VARCHAR(255) NOT NULL,
          "aliases" TEXT[] NOT NULL DEFAULT '{}',
          "family" VARCHAR(255),
          "illustrationKey" VARCHAR(255),
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          CONSTRAINT "PK_dish_categories" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_dish_categories_name" UNIQUE ("name"),
          CONSTRAINT "UQ_dish_categories_slug" UNIQUE ("slug")
        )`,
      );
    } else {
      await queryRunner.query(
        `CREATE TABLE \`dish_categories\` (
          \`id\` CHAR(36) NOT NULL,
          \`name\` VARCHAR(255) NOT NULL,
          \`slug\` VARCHAR(255) NOT NULL,
          \`aliases\` JSON NOT NULL,
          \`family\` VARCHAR(255) NULL,
          \`illustrationKey\` VARCHAR(255) NULL,
          \`sortOrder\` INT NOT NULL DEFAULT 0,
          \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_dish_categories_name\` (\`name\`),
          UNIQUE INDEX \`UQ_dish_categories_slug\` (\`slug\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "dish_categories"`);
    } else {
      await queryRunner.query(`DROP TABLE \`dish_categories\``);
    }
  }
}
