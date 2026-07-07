import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWeddingVendorPayments1783439670817 implements MigrationInterface {
  name = 'AddWeddingVendorPayments1783439670817';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."wedding_vendor_payments_status_enum" AS ENUM('pending', 'paid', 'refunded', 'failed'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wedding_vendor_payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vendorSelectionId" uuid NOT NULL,
        "weddingEventId" uuid NOT NULL,
        "customerId" uuid NOT NULL,
        "amountCents" integer NOT NULL,
        "commissionCents" integer NOT NULL DEFAULT 0,
        "status" "public"."wedding_vendor_payments_status_enum" NOT NULL DEFAULT 'pending',
        "checkoutId" character varying,
        "checkoutUrl" character varying,
        "gatewayReference" character varying,
        "note" text,
        "settledAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wedding_vendor_payments_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_wedding_vendor_payments_selection" ON "wedding_vendor_payments" ("vendorSelectionId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_wedding_vendor_payments_event" ON "wedding_vendor_payments" ("weddingEventId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_wedding_vendor_payments_customer" ON "wedding_vendor_payments" ("customerId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wedding_vendor_payments_customer"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wedding_vendor_payments_event"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wedding_vendor_payments_selection"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wedding_vendor_payments"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."wedding_vendor_payments_status_enum"`);
  }
}
