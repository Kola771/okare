import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClaimRequests1732320000027 implements MigrationInterface {
  name = 'CreateClaimRequests1732320000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')`);
      await queryRunner.query(
        `CREATE TABLE "claim_requests" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "vendorId" UUID NOT NULL,
          "userId" UUID NOT NULL,
          "code" VARCHAR(20) NOT NULL,
          "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
          "reviewedById" UUID,
          "expiresAt" TIMESTAMPTZ NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_claim_requests" PRIMARY KEY ("id"),
          CONSTRAINT "FK_claim_requests_vendorId" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE
        )`,
      );
    } else {
      await queryRunner.query(
        `CREATE TABLE \`claim_requests\` (
          \`id\` CHAR(36) NOT NULL,
          \`vendorId\` CHAR(36) NOT NULL,
          \`userId\` CHAR(36) NOT NULL,
          \`code\` VARCHAR(20) NOT NULL,
          \`status\` ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
          \`reviewedById\` CHAR(36) NULL,
          \`expiresAt\` DATETIME NOT NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_claim_requests_vendorId\` (\`vendorId\`),
          CONSTRAINT \`FK_claim_requests_vendorId\` FOREIGN KEY (\`vendorId\`) REFERENCES \`vendors\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`DROP TABLE "claim_requests"`);
      await queryRunner.query(`DROP TYPE "ClaimStatus"`);
    } else {
      await queryRunner.query(`DROP TABLE \`claim_requests\``);
    }
  }
}
