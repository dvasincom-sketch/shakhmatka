import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_leads_product" AS ENUM('invest', 'pro', 'land', 'data');
  CREATE TYPE "public"."enum_leads_role" AS ENUM('private', 'developer', 'broker', 'investor', 'architect', 'owner', 'other');
  CREATE TYPE "public"."enum_leads_status" AS ENUM('new', 'work', 'pilot', 'client', 'lost');
  CREATE TABLE "leads_product" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_leads_product",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"company" varchar,
  	"role" "enum_leads_role",
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"request" varchar,
  	"page" varchar,
  	"status" "enum_leads_status" DEFAULT 'new',
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "leads_id" integer;
  ALTER TABLE "leads_product" ADD CONSTRAINT "leads_product_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "leads_product_order_idx" ON "leads_product" USING btree ("order");
  CREATE INDEX "leads_product_parent_idx" ON "leads_product" USING btree ("parent_id");
  CREATE INDEX "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "leads_product" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "leads" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "leads_product" CASCADE;
  DROP TABLE "leads" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_leads_fk";
  
  DROP INDEX "payload_locked_documents_rels_leads_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "leads_id";
  DROP TYPE "public"."enum_leads_product";
  DROP TYPE "public"."enum_leads_role";
  DROP TYPE "public"."enum_leads_status";`)
}
