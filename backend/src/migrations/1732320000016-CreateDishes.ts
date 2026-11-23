import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDishes1732320000016 implements MigrationInterface {
  name = 'CreateDishes1732320000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`CREATE TYPE "DishStatus" AS ENUM ('PUBLISHED', 'PENDING')`);
      await queryRunner.query(`CREATE TYPE "MealMoment" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'ALL_DAY')`);
      await queryRunner.query(
        `CREATE TABLE "dishes" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "posId" UUID NOT NULL,
          "categoryId" UUID,
          "slug" VARCHAR(255) NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "description" TEXT,
          "priceXof" INTEGER NOT NULL,
          "moment" "MealMoment" NOT NULL DEFAULT 'LUNCH',
          "status" "DishStatus" NOT NULL DEFAULT 'PUBLISHED',
          "soldOutOn" DATE,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "publishedAt" TIMESTAMPTZ,
          "createdById" UUID NOT NULL,
          "updatedById" UUID,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMPTZ,
          CONSTRAINT "PK_dishes" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_dishes_posId_slug" UNIQUE ("posId", "slug"),
          CONSTRAINT "FK_dishes_posId" FOREIGN KEY ("posId") REFERENCES "points_of_sale"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_dishes_categoryId" FOREIGN KEY ("categoryId") REFERENCES "dish_categories"("id") ON DELETE SET NULL
        )`,
      );
    } else {
      await queryRunner.query(
        `CREATE TABLE \`dishes\` (
          \`id\` CHAR(36) NOT NULL,
          \`posId\` CHAR(36) NOT NULL,
          \`categoryId\` CHAR(36) NULL,
          \`slug\` VARCHAR(255) NOT NULL,
          \`name\` VARCHAR(255) NOT NULL,
          \`description\` TEXT NULL,
          \`priceXof\` INT NOT NULL,
          \`moment\` ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'ALL_DAY') NOT NULL DEFAULT 'LUNCH',
          \`status\` ENUM('PUBLISHED', 'PENDING') NOT NULL DEFAULT 'PUBLISHED',
          \`soldOutOn\` DATE NULL,
          \`sortOrder\` INT NOT NULL DEFAULT 0,
          \`publishedAt\` DATETIME NULL,
          \`createdById\` CHAR(36) NOT NULL,
          \`updatedById\` CHAR(36) NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          \`deletedAt\` DATETIME NULL,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_dishes_posId_slug\` (\`posId\`, \`slug\`),
          CONSTRAINT \`FK_dishes_posId\` FOREIGN KEY (\`posId\`) REFERENCES \`points_of_sale\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_dishes_categoryId\` FOREIGN KEY (\`categoryId\`) REFERENCES \`dish_categories\`(\`id\`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "dishes"`);
      await queryRunner.query(`DROP TYPE "MealMoment"`);
      await queryRunner.query(`DROP TYPE "DishStatus"`);
    } else {
      await queryRunner.query(`DROP TABLE \`dishes\``);
    }
  }
}
