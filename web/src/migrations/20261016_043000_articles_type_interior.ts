import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Новый тип материала «Интерьер» (рубрика /temy/interer/)
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_articles_type" ADD VALUE IF NOT EXISTS 'interior';
  ALTER TYPE "public"."enum__articles_v_version_type" ADD VALUE IF NOT EXISTS 'interior';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Postgres не умеет удалять значение из enum без пересоздания типа; откат не требуется
  await db.execute(sql`SELECT 1;`)
}
