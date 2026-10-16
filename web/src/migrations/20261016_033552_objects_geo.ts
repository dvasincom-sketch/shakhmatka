import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN CREATE TYPE "public"."enum_objects_geo_precision" AS ENUM('building', 'street', 'area'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  ALTER TABLE "objects" ADD COLUMN IF NOT EXISTS "address" varchar;
  ALTER TABLE "objects" ADD COLUMN IF NOT EXISTS "lat" numeric;
  ALTER TABLE "objects" ADD COLUMN IF NOT EXISTS "lng" numeric;
  ALTER TABLE "objects" ADD COLUMN IF NOT EXISTS "geo_precision" "enum_objects_geo_precision";
  ALTER TABLE "objects" ADD COLUMN IF NOT EXISTS "geo_source" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "objects" DROP COLUMN IF EXISTS "address";
  ALTER TABLE "objects" DROP COLUMN IF EXISTS "lat";
  ALTER TABLE "objects" DROP COLUMN IF EXISTS "lng";
  ALTER TABLE "objects" DROP COLUMN IF EXISTS "geo_precision";
  ALTER TABLE "objects" DROP COLUMN IF EXISTS "geo_source";
  DROP TYPE IF EXISTS "public"."enum_objects_geo_precision";`)
}
