import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolePermissions1732320000009 implements MigrationInterface {
  name = 'CreateRolePermissions1732320000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(
        `CREATE TABLE "role_permissions" (
          "role" "Role" NOT NULL,
          "permission" VARCHAR(255) NOT NULL,
          "granted" BOOLEAN NOT NULL DEFAULT true,
          "updatedById" UUID,
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role", "permission")
        )`,
      );
    } else {
      await queryRunner.query(
        `CREATE TABLE \`role_permissions\` (
          \`role\` ENUM('CLIENT', 'VENDOR', 'FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN') NOT NULL,
          \`permission\` VARCHAR(255) NOT NULL,
          \`granted\` TINYINT(1) NOT NULL DEFAULT 1,
          \`updatedById\` CHAR(36) NULL,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`role\`, \`permission\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "role_permissions"`);
    } else {
      await queryRunner.query(`DROP TABLE \`role_permissions\``);
    }
  }
}
