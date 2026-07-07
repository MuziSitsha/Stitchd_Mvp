import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRichPlannerAndCoachTables1783422258064 implements MigrationInterface {
  name = 'AddRichPlannerAndCoachTables1783422258064';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Real venue location, used to feed the live weather lookup for real events.
    await queryRunner.query(`ALTER TABLE "wedding_events" ADD COLUMN IF NOT EXISTS "locationLabel" character varying`);
    await queryRunner.query(`ALTER TABLE "wedding_events" ADD COLUMN IF NOT EXISTS "venueLat" double precision`);
    await queryRunner.query(`ALTER TABLE "wedding_events" ADD COLUMN IF NOT EXISTS "venueLng" double precision`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wedding_vendors" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "eventType" "public"."wedding_events_eventtype_enum" NOT NULL DEFAULT 'wedding',
        "slot" character varying NOT NULL,
        "subcategory" character varying,
        "name" character varying NOT NULL,
        "priceLabel" character varying NOT NULL,
        "priceCents" integer NOT NULL DEFAULT 0,
        "rating" numeric(3,2) NOT NULL DEFAULT 0,
        "reviewCount" integer NOT NULL DEFAULT 0,
        "imageKey" character varying,
        "tags" text,
        "isRecommended" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wedding_vendors_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_wedding_vendors_slot" ON "wedding_vendors" ("slot")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wedding_inspiration_notes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "weddingEventId" uuid NOT NULL,
        "title" character varying NOT NULL,
        "note" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wedding_inspiration_notes_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_wedding_inspiration_notes_event" ON "wedding_inspiration_notes" ("weddingEventId")`);

    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."wedding_messages_senderrole_enum" AS ENUM('client', 'coach'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wedding_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "weddingEventId" uuid NOT NULL,
        "senderUserId" uuid NOT NULL,
        "senderRole" "public"."wedding_messages_senderrole_enum" NOT NULL,
        "message" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wedding_messages_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_wedding_messages_event_created" ON "wedding_messages" ("weddingEventId", "createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wedding_messages_event_created"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wedding_messages"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."wedding_messages_senderrole_enum"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wedding_inspiration_notes_event"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wedding_inspiration_notes"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wedding_vendors_slot"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wedding_vendors"`);
    await queryRunner.query(`ALTER TABLE "wedding_events" DROP COLUMN IF EXISTS "venueLng"`);
    await queryRunner.query(`ALTER TABLE "wedding_events" DROP COLUMN IF EXISTS "venueLat"`);
    await queryRunner.query(`ALTER TABLE "wedding_events" DROP COLUMN IF EXISTS "locationLabel"`);
  }
}
