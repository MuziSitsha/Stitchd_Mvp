import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsPromosAndChatTables1714471200000 implements MigrationInterface {
  name = 'CreateNotificationsPromosAndChatTables1714471200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" character varying NOT NULL,
        "title" character varying NOT NULL,
        "body" text NOT NULL,
        "type" character varying NOT NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        "readAt" TIMESTAMP,
        "payload" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_user_created" ON "notifications" ("userId", "createdAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_user_read" ON "notifications" ("userId", "isRead")`);

    await queryRunner.query(`CREATE TYPE "public"."promos_discounttype_enum" AS ENUM('flat', 'percent')`).catch(() => undefined);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "promos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "discountType" "public"."promos_discounttype_enum" NOT NULL DEFAULT 'flat',
        "discountValue" integer NOT NULL,
        "maxDiscountCents" integer,
        "minBookingAmountCents" integer NOT NULL DEFAULT 0,
        "usageLimit" integer,
        "usageCount" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "referralOnly" boolean NOT NULL DEFAULT false,
        "startsAt" TIMESTAMP,
        "endsAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_promos_code" UNIQUE ("code"),
        CONSTRAINT "PK_promos_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "promo_redemptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "promoId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "bookingId" uuid,
        "discountCents" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_promo_redemptions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_promo_redemptions_promo_user" ON "promo_redemptions" ("promoId", "userId")`);

    await queryRunner.query(`CREATE TYPE "public"."chat_messages_messagetype_enum" AS ENUM('text', 'call_log')`).catch(() => undefined);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "bookingId" uuid NOT NULL,
        "senderId" uuid NOT NULL,
        "recipientId" uuid NOT NULL,
        "messageType" "public"."chat_messages_messagetype_enum" NOT NULL DEFAULT 'text',
        "message" text NOT NULL,
        "callStatus" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_messages_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_chat_messages_booking_created" ON "chat_messages" ("bookingId", "createdAt")`);

    await queryRunner.query(`
      INSERT INTO "promos" (
        "id", "code", "title", "description", "discountType", "discountValue", "maxDiscountCents", "minBookingAmountCents", "usageLimit", "usageCount", "isActive", "referralOnly", "createdAt", "updatedAt"
      ) VALUES (
        uuid_generate_v4(), 'WELCOME100', 'Welcome to KAZI', 'R100 off your first qualifying booking.', 'flat', 10000, NULL, 25000, NULL, 0, true, false, now(), now()
      ) ON CONFLICT ("code") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chat_messages_booking_created"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."chat_messages_messagetype_enum"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_promo_redemptions_promo_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "promo_redemptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "promos"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."promos_discounttype_enum"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_user_read"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_user_created"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
  }
}