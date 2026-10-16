import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_wide_url" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_wide_width" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_wide_height" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_wide_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_wide_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_wide_filename" varchar;
  CREATE INDEX IF NOT EXISTS "media_sizes_wide_sizes_wide_filename_idx" ON "media" USING btree ("sizes_wide_filename");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "media_sizes_wide_sizes_wide_filename_idx";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_wide_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_wide_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_wide_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_wide_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_wide_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_wide_filename";`)
}
