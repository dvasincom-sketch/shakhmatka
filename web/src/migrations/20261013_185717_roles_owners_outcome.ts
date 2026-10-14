import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_objects_timeline_outcome" AS ENUM('unconfirmed', 'refuted');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TABLE "objects_owners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"developer_id" integer,
  	"since" varchar,
  	"until" varchar,
  	"how" varchar,
  	"source" varchar
  );
  
  ALTER TABLE "objects_timeline" ADD COLUMN "outcome" "enum_objects_timeline_outcome";
  ALTER TABLE "objects_timeline" ADD COLUMN "checked_on" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "name" varchar;
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'editor';
  ALTER TABLE "objects_owners" ADD CONSTRAINT "objects_owners_developer_id_developers_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."developers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "objects_owners" ADD CONSTRAINT "objects_owners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."objects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "objects_owners_order_idx" ON "objects_owners" USING btree ("_order");
  CREATE INDEX "objects_owners_parent_id_idx" ON "objects_owners" USING btree ("_parent_id");
  CREATE INDEX "objects_owners_developer_idx" ON "objects_owners" USING btree ("developer_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "objects_owners" CASCADE;
  ALTER TABLE "objects_timeline" DROP COLUMN "outcome";
  ALTER TABLE "objects_timeline" DROP COLUMN "checked_on";
  ALTER TABLE "users" DROP COLUMN "name";
  ALTER TABLE "users" DROP COLUMN "role";
  DROP TYPE "public"."enum_objects_timeline_outcome";
  DROP TYPE "public"."enum_users_role";`)
}
