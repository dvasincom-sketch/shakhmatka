import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_search_events_kind" AS ENUM('search', 'click', 'suggest');
  CREATE TYPE "public"."enum_search_settings_synonyms_mode" AS ENUM('both', 'one');
  CREATE TABLE "search_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_search_events_kind" NOT NULL,
  	"q" varchar NOT NULL,
  	"tab" varchar,
  	"hits" numeric,
  	"url" varchar,
  	"position" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "search_settings_synonyms" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"words" varchar NOT NULL,
  	"mode" "enum_search_settings_synonyms_mode" DEFAULT 'both'
  );
  
  CREATE TABLE "search_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stop_words" varchar DEFAULT 'в, во, на, и, у, по, с, со, к, ко, о, об, от, до, из, за, для, при, под, над, около, жк, ул, улица, пр, пр-т, пер, д',
  	"typo_one" numeric DEFAULT 5,
  	"typo_two" numeric DEFAULT 9,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "search_events_id" integer;
  ALTER TABLE "search_settings_synonyms" ADD CONSTRAINT "search_settings_synonyms_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "search_events_kind_idx" ON "search_events" USING btree ("kind");
  CREATE INDEX "search_events_q_idx" ON "search_events" USING btree ("q");
  CREATE INDEX "search_events_updated_at_idx" ON "search_events" USING btree ("updated_at");
  CREATE INDEX "search_events_created_at_idx" ON "search_events" USING btree ("created_at");
  CREATE INDEX "search_settings_synonyms_order_idx" ON "search_settings_synonyms" USING btree ("_order");
  CREATE INDEX "search_settings_synonyms_parent_id_idx" ON "search_settings_synonyms" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_search_events_fk" FOREIGN KEY ("search_events_id") REFERENCES "public"."search_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_search_events_id_idx" ON "payload_locked_documents_rels" USING btree ("search_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "search_settings_synonyms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "search_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "search_events" CASCADE;
  DROP TABLE "search_settings_synonyms" CASCADE;
  DROP TABLE "search_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_search_events_fk";
  
  DROP INDEX "payload_locked_documents_rels_search_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "search_events_id";
  DROP TYPE "public"."enum_search_events_kind";
  DROP TYPE "public"."enum_search_settings_synonyms_mode";`)
}
