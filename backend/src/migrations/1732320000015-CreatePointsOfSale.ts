import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePointsOfSale1732320000015 implements MigrationInterface {
  name = 'CreatePointsOfSale1732320000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`CREATE TYPE "PosType" AS ENUM ('PARTICULIER', 'MAQUIS', 'RESTAURANT')`);
      await queryRunner.query(`CREATE TYPE "PosStatus" AS ENUM ('PUBLISHED', 'PENDING', 'SUSPENDED', 'ARCHIVED')`);
      await queryRunner.query(`CREATE TYPE "HolidayPolicy" AS ENUM ('OPEN', 'CLOSED', 'UNKNOWN')`);
      await queryRunner.query(
        `CREATE TABLE "points_of_sale" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "vendorId" UUID NOT NULL,
          "slug" VARCHAR(255) NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "description" TEXT,
          "type" "PosType" NOT NULL,
          "status" "PosStatus" NOT NULL DEFAULT 'PUBLISHED',
          "version" INTEGER NOT NULL DEFAULT 1,
          "qrCode" VARCHAR(10) NOT NULL,
          "zoneId" UUID NOT NULL,
          "neighborhoodId" UUID,
          "location" geography(Point,4326) NOT NULL,
          "locationAccuracyM" INTEGER,
          "hasPublicPlace" BOOLEAN NOT NULL DEFAULT true,
          "publicPoint" geography(Point,4326),
          "landmark" VARCHAR(255),
          "whatsappPhone" VARCHAR(30) NOT NULL,
          "whatsappVerifiedAt" TIMESTAMPTZ,
          "callPhone" VARCHAR(30),
          "openingHours" JSONB NOT NULL,
          "hoursConfirmedAt" TIMESTAMPTZ,
          "holidayPolicy" "HolidayPolicy" NOT NULL DEFAULT 'UNKNOWN',
          "servesOnSite" BOOLEAN NOT NULL DEFAULT true,
          "servesTakeaway" BOOLEAN NOT NULL DEFAULT true,
          "delivers" BOOLEAN NOT NULL DEFAULT false,
          "deliveryZoneIds" UUID[] NOT NULL DEFAULT '{}',
          "acceptsCash" BOOLEAN NOT NULL DEFAULT true,
          "acceptsMomo" BOOLEAN NOT NULL DEFAULT false,
          "coverMediaId" UUID,
          "vendorOffer" TEXT,
          "identityCheckedAt" TIMESTAMPTZ,
          "kitchenVisitedAt" TIMESTAMPTZ,
          "consentAt" TIMESTAMPTZ NOT NULL,
          "consentById" UUID NOT NULL,
          "publishedAt" TIMESTAMPTZ,
          "pricesCheckedAt" TIMESTAMPTZ,
          "responseRate" DOUBLE PRECISION,
          "ratingAvg" DOUBLE PRECISION,
          "ratingCount" INTEGER NOT NULL DEFAULT 0,
          "createdById" UUID NOT NULL,
          "updatedById" UUID,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMPTZ,
          CONSTRAINT "PK_points_of_sale" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_points_of_sale_slug" UNIQUE ("slug"),
          CONSTRAINT "UQ_points_of_sale_qrCode" UNIQUE ("qrCode"),
          CONSTRAINT "FK_points_of_sale_vendorId" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_points_of_sale_zoneId" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_points_of_sale_neighborhoodId" FOREIGN KEY ("neighborhoodId") REFERENCES "neighborhoods"("id") ON DELETE SET NULL
        )`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_points_of_sale_zone_status" ON "points_of_sale" ("zoneId", "status")`);
      await queryRunner.query(`CREATE INDEX "IDX_points_of_sale_vendorId" ON "points_of_sale" ("vendorId")`);
      await queryRunner.query(
        `ALTER TABLE "vendors" ADD CONSTRAINT "FK_vendors_mainPosId" FOREIGN KEY ("mainPosId") REFERENCES "points_of_sale"("id") ON DELETE SET NULL`,
      );
    } else {
      await queryRunner.query(
        `CREATE TABLE \`points_of_sale\` (
          \`id\` CHAR(36) NOT NULL,
          \`vendorId\` CHAR(36) NOT NULL,
          \`slug\` VARCHAR(255) NOT NULL,
          \`name\` VARCHAR(255) NOT NULL,
          \`description\` TEXT NULL,
          \`type\` ENUM('PARTICULIER', 'MAQUIS', 'RESTAURANT') NOT NULL,
          \`status\` ENUM('PUBLISHED', 'PENDING', 'SUSPENDED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
          \`version\` INT NOT NULL DEFAULT 1,
          \`qrCode\` VARCHAR(10) NOT NULL,
          \`zoneId\` CHAR(36) NOT NULL,
          \`neighborhoodId\` CHAR(36) NULL,
          \`location\` POINT NOT NULL /*!80003 SRID 4326 */,
          \`locationAccuracyM\` INT NULL,
          \`hasPublicPlace\` TINYINT(1) NOT NULL DEFAULT 1,
          \`publicPoint\` POINT NULL,
          \`landmark\` VARCHAR(255) NULL,
          \`whatsappPhone\` VARCHAR(30) NOT NULL,
          \`whatsappVerifiedAt\` DATETIME NULL,
          \`callPhone\` VARCHAR(30) NULL,
          \`openingHours\` JSON NOT NULL,
          \`hoursConfirmedAt\` DATETIME NULL,
          \`holidayPolicy\` ENUM('OPEN', 'CLOSED', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
          \`servesOnSite\` TINYINT(1) NOT NULL DEFAULT 1,
          \`servesTakeaway\` TINYINT(1) NOT NULL DEFAULT 1,
          \`delivers\` TINYINT(1) NOT NULL DEFAULT 0,
          \`deliveryZoneIds\` JSON NOT NULL,
          \`acceptsCash\` TINYINT(1) NOT NULL DEFAULT 1,
          \`acceptsMomo\` TINYINT(1) NOT NULL DEFAULT 0,
          \`coverMediaId\` CHAR(36) NULL,
          \`vendorOffer\` TEXT NULL,
          \`identityCheckedAt\` DATETIME NULL,
          \`kitchenVisitedAt\` DATETIME NULL,
          \`consentAt\` DATETIME NOT NULL,
          \`consentById\` CHAR(36) NOT NULL,
          \`publishedAt\` DATETIME NULL,
          \`pricesCheckedAt\` DATETIME NULL,
          \`responseRate\` DOUBLE NULL,
          \`ratingAvg\` DOUBLE NULL,
          \`ratingCount\` INT NOT NULL DEFAULT 0,
          \`createdById\` CHAR(36) NOT NULL,
          \`updatedById\` CHAR(36) NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          \`deletedAt\` DATETIME NULL,
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_points_of_sale_slug\` (\`slug\`),
          UNIQUE INDEX \`UQ_points_of_sale_qrCode\` (\`qrCode\`),
          INDEX \`IDX_points_of_sale_zone_status\` (\`zoneId\`, \`status\`),
          INDEX \`IDX_points_of_sale_vendorId\` (\`vendorId\`),
          CONSTRAINT \`FK_points_of_sale_vendorId\` FOREIGN KEY (\`vendorId\`) REFERENCES \`vendors\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_points_of_sale_zoneId\` FOREIGN KEY (\`zoneId\`) REFERENCES \`zones\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_points_of_sale_neighborhoodId\` FOREIGN KEY (\`neighborhoodId\`) REFERENCES \`neighborhoods\`(\`id\`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
      await queryRunner.query(
        `ALTER TABLE \`vendors\` ADD CONSTRAINT \`FK_vendors_mainPosId\` FOREIGN KEY (\`mainPosId\`) REFERENCES \`points_of_sale\`(\`id\`) ON DELETE SET NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`ALTER TABLE "vendors" DROP CONSTRAINT "FK_vendors_mainPosId"`);
      await queryRunner.query(`DROP TABLE "points_of_sale"`);
      await queryRunner.query(`DROP TYPE "HolidayPolicy"`);
      await queryRunner.query(`DROP TYPE "PosStatus"`);
      await queryRunner.query(`DROP TYPE "PosType"`);
    } else {
      await queryRunner.query(`ALTER TABLE \`vendors\` DROP FOREIGN KEY \`FK_vendors_mainPosId\``);
      await queryRunner.query(`DROP TABLE \`points_of_sale\``);
    }
  }
}
