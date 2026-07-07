import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWeddingTrackingTables1783145788979 implements MigrationInterface {
  name = 'AddWeddingTrackingTables1783145788979';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."wedding_events_eventtype_enum" AS ENUM('wedding', 'lobola', 'funeral', 'corporate', 'birthday'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."wedding_events_timelinestatus_enum" AS ENUM('on_track', 'behind', 'at_risk'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wedding_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ownerUserId" uuid NOT NULL,
        "eventType" "public"."wedding_events_eventtype_enum" NOT NULL DEFAULT 'wedding',
        "title" character varying,
        "eventDate" date,
        "budgetTotalCents" integer NOT NULL DEFAULT 0,
        "coachUserId" uuid,
        "timelineStatus" "public"."wedding_events_timelinestatus_enum" NOT NULL DEFAULT 'on_track',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_wedding_events_owner" UNIQUE ("ownerUserId"),
        CONSTRAINT "PK_wedding_events_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "coach_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "bio" text,
        "specialties" text,
        "rating" numeric(3,2) NOT NULL DEFAULT 0,
        "eventsCompletedCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_coach_profiles_user" UNIQUE ("userId"),
        CONSTRAINT "PK_coach_profiles_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."wedding_vendor_selections_status_enum" AS ENUM('secured', 'booked', 'optional', 'recommended', 'at_risk', 'shortlisted'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wedding_vendor_selections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "weddingEventId" uuid NOT NULL,
        "slot" character varying NOT NULL,
        "subcategory" character varying,
        "vendorName" character varying NOT NULL,
        "priceCents" integer NOT NULL DEFAULT 0,
        "amountPaidCents" integer NOT NULL DEFAULT 0,
        "paidAt" TIMESTAMP,
        "status" "public"."wedding_vendor_selections_status_enum" NOT NULL DEFAULT 'shortlisted',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wedding_vendor_selections_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_wedding_vendor_selections_event" ON "wedding_vendor_selections" ("weddingEventId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wedding_vendor_selections_event"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wedding_vendor_selections"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."wedding_vendor_selections_status_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coach_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wedding_events"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."wedding_events_timelinestatus_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."wedding_events_eventtype_enum"`);
  }
}
