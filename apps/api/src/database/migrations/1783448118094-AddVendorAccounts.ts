import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendorAccounts1783448118094 implements MigrationInterface {
  name = 'AddVendorAccounts1783448118094';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Native "IF NOT EXISTS" support for ADD VALUE has existed since PG 9.6 -
    // no defensive DO $$ block needed like CREATE TYPE requires.
    await queryRunner.query(`ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'vendor'`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wedding_vendor_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "vendorId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_wedding_vendor_profiles_user" UNIQUE ("userId"),
        CONSTRAINT "PK_wedding_vendor_profiles_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."wedding_vendor_messages_senderrole_enum" AS ENUM('client', 'vendor'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wedding_vendor_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vendorSelectionId" uuid NOT NULL,
        "senderUserId" uuid NOT NULL,
        "senderRole" "public"."wedding_vendor_messages_senderrole_enum" NOT NULL,
        "message" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wedding_vendor_messages_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_wedding_vendor_messages_selection_created" ON "wedding_vendor_messages" ("vendorSelectionId", "createdAt")`);

    await queryRunner.query(`ALTER TABLE "wedding_vendor_selections" ADD COLUMN IF NOT EXISTS "vendorId" uuid`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wedding_vendor_selections" DROP COLUMN IF EXISTS "vendorId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wedding_vendor_messages_selection_created"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wedding_vendor_messages"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."wedding_vendor_messages_senderrole_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wedding_vendor_profiles"`);
    // Postgres has no ALTER TYPE ... DROP VALUE - the 'vendor' enum value
    // addition is one-way, same as any other enum-value migration.
  }
}
