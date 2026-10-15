import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "readers" ALTER COLUMN "email" DROP NOT NULL;
  ALTER TABLE "readers" ADD COLUMN "phone" varchar;
  CREATE UNIQUE INDEX "readers_phone_idx" ON "readers" USING btree ("phone");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "readers_phone_idx";
  ALTER TABLE "readers" ALTER COLUMN "email" SET NOT NULL;
  ALTER TABLE "readers" DROP COLUMN "phone";`)
}
