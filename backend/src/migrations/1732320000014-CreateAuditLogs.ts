import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1732320000014 implements MigrationInterface {
  name = 'CreateAuditLogs1732320000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "audit_logs" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "actorId" UUID,
          "actorRole" "Role",
          "action" VARCHAR(255) NOT NULL,
          "entityType" VARCHAR(255) NOT NULL,
          "entityId" UUID NOT NULL,
          "before" JSONB,
          "after" JSONB,
          "ipHash" VARCHAR(255),
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entity" ON "audit_logs" ("entityType", "entityId")`);
      await queryRunner.query(`CREATE INDEX "IDX_audit_logs_actor" ON "audit_logs" ("actorId", "createdAt")`);
    } else {
      await queryRunner.query(
        `CREATE TABLE \`audit_logs\` (
          \`id\` CHAR(36) NOT NULL,
          \`actorId\` CHAR(36) NULL,
          \`actorRole\` ENUM('CLIENT', 'VENDOR', 'FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN') NULL,
          \`action\` VARCHAR(255) NOT NULL,
          \`entityType\` VARCHAR(255) NOT NULL,
          \`entityId\` CHAR(36) NOT NULL,
          \`before\` JSON NULL,
          \`after\` JSON NULL,
          \`ipHash\` VARCHAR(255) NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_audit_logs_entity\` (\`entityType\`, \`entityId\`),
          INDEX \`IDX_audit_logs_actor\` (\`actorId\`, \`createdAt\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "audit_logs"`);
    } else {
      await queryRunner.query(`DROP TABLE \`audit_logs\``);
    }
  }
}
