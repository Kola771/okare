import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAgentZones1732320000017 implements MigrationInterface {
  name = 'CreateAgentZones1732320000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "agent_zones" (
          "userId" UUID NOT NULL,
          "zoneId" UUID NOT NULL,
          "assignedById" UUID NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_agent_zones" PRIMARY KEY ("userId", "zoneId"),
          CONSTRAINT "FK_agent_zones_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_agent_zones_zoneId" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE CASCADE
        )`,
      );
    } else {
      await queryRunner.query(
        `CREATE TABLE \`agent_zones\` (
          \`userId\` CHAR(36) NOT NULL,
          \`zoneId\` CHAR(36) NOT NULL,
          \`assignedById\` CHAR(36) NOT NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`userId\`, \`zoneId\`),
          INDEX \`IDX_agent_zones_zoneId\` (\`zoneId\`),
          CONSTRAINT \`FK_agent_zones_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_agent_zones_zoneId\` FOREIGN KEY (\`zoneId\`) REFERENCES \`zones\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "agent_zones"`);
    } else {
      await queryRunner.query(`DROP TABLE \`agent_zones\``);
    }
  }
}
