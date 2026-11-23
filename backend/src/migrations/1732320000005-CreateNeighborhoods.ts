import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNeighborhoods1732320000005 implements MigrationInterface {
  name = 'CreateNeighborhoods1732320000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "neighborhoods" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "zoneId" UUID NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "aliases" TEXT[] NOT NULL DEFAULT '{}',
          CONSTRAINT "PK_neighborhoods" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_neighborhoods_zoneId_name" UNIQUE ("zoneId", "name"),
          CONSTRAINT "FK_neighborhoods_zoneId" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_neighborhoods_zoneId" ON "neighborhoods" ("zoneId")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`neighborhoods\` (
          \`id\` CHAR(36) NOT NULL,
          \`zoneId\` CHAR(36) NOT NULL,
          \`name\` VARCHAR(255) NOT NULL,
          \`aliases\` JSON NOT NULL,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_neighborhoods_zoneId_name\` (\`zoneId\`, \`name\`),
          INDEX \`IDX_neighborhoods_zoneId\` (\`zoneId\`),
          CONSTRAINT \`FK_neighborhoods_zoneId\` FOREIGN KEY (\`zoneId\`) REFERENCES \`zones\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "neighborhoods"`);
    } else {
      await queryRunner.query(`DROP TABLE \`neighborhoods\``);
    }
  }
}
