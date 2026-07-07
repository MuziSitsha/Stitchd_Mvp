import { MigrationInterface, QueryRunner } from 'typeorm';

// Removes the old "on-demand home services" marketplace (cleaning/plumbing/
// handyman bookings) that STITCHD pivoted away from. None of these tables
// were ever created by a hand-written migration (dev-only `synchronize`),
// so this is a fresh forward-only migration, not a revert of anything -
// there is no meaningful down() beyond re-declaring the shape, which nothing
// depends on anymore.
export class DropLegacyHomeServices1783448117094 implements MigrationInterface {
  name = 'DropLegacyHomeServices1783448117094';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_transactions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."payment_transactions_paymentmethod_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."payment_transactions_status_enum"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "promo_redemptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "promos"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "wallet_transactions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."wallet_transactions_direction_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."wallet_transactions_referencetype_enum"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "bookings"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."bookings_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."bookings_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."bookings_paymentmethod_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."bookings_paymentstatus_enum"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "provider_documents"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."provider_documents_status_enum"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "provider_profiles"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."provider_profiles_verificationstatus_enum"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "services"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_categories"`);

    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN IF EXISTS "cashPaymentsEnabled"`);
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN IF EXISTS "cardPaymentsEnabled"`);
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN IF EXISTS "walletPaymentsEnabled"`);
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN IF EXISTS "instantBookingsEnabled"`);
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN IF EXISTS "scheduledBookingsEnabled"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Intentionally not reversible - the legacy home-services schema is
    // retired, not paused. Restoring it would mean re-adding code that no
    // longer exists in this codebase.
    void queryRunner;
  }
}
