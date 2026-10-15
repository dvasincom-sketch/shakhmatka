import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_readers_frequency" AS ENUM('weekly', 'daily', 'off');
  CREATE TYPE "public"."enum_follows_kind" AS ENUM('object', 'developer', 'place', 'bureau', 'signals');
  CREATE TYPE "public"."enum_follows_status" AS ENUM('pending', 'active');
  CREATE TABLE "readers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"confirmed" boolean DEFAULT false,
  	"frequency" "enum_readers_frequency" DEFAULT 'weekly',
  	"follows" numeric DEFAULT 0,
  	"last_digest_at" timestamp(3) with time zone,
  	"source" varchar,
  	"login_token_hash" varchar,
  	"login_token_expires" timestamp(3) with time zone,
  	"unsubscribe_key" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "follows" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reader_id" integer NOT NULL,
  	"kind" "enum_follows_kind" NOT NULL,
  	"key" varchar NOT NULL,
  	"label" varchar,
  	"status" "enum_follows_status" DEFAULT 'pending',
  	"page" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "readers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "follows_id" integer;
  ALTER TABLE "follows" ADD CONSTRAINT "follows_reader_id_readers_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."readers"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "readers_email_idx" ON "readers" USING btree ("email");
  CREATE INDEX "readers_unsubscribe_key_idx" ON "readers" USING btree ("unsubscribe_key");
  CREATE INDEX "readers_updated_at_idx" ON "readers" USING btree ("updated_at");
  CREATE INDEX "readers_created_at_idx" ON "readers" USING btree ("created_at");
  CREATE INDEX "follows_reader_idx" ON "follows" USING btree ("reader_id");
  CREATE INDEX "follows_kind_idx" ON "follows" USING btree ("kind");
  CREATE INDEX "follows_key_idx" ON "follows" USING btree ("key");
  CREATE INDEX "follows_status_idx" ON "follows" USING btree ("status");
  CREATE INDEX "follows_updated_at_idx" ON "follows" USING btree ("updated_at");
  CREATE INDEX "follows_created_at_idx" ON "follows" USING btree ("created_at");
  CREATE UNIQUE INDEX "reader_kind_key_idx" ON "follows" USING btree ("reader_id","kind","key");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_readers_fk" FOREIGN KEY ("readers_id") REFERENCES "public"."readers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_follows_fk" FOREIGN KEY ("follows_id") REFERENCES "public"."follows"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_readers_id_idx" ON "payload_locked_documents_rels" USING btree ("readers_id");
  CREATE INDEX "payload_locked_documents_rels_follows_id_idx" ON "payload_locked_documents_rels" USING btree ("follows_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "readers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "follows" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "readers" CASCADE;
  DROP TABLE "follows" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_readers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_follows_fk";
  
  DROP INDEX "payload_locked_documents_rels_readers_id_idx";
  DROP INDEX "payload_locked_documents_rels_follows_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "readers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "follows_id";
  DROP TYPE "public"."enum_readers_frequency";
  DROP TYPE "public"."enum_follows_kind";
  DROP TYPE "public"."enum_follows_status";`)
}
