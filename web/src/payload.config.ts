import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ru } from '@payloadcms/translations/languages/ru'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Articles } from './collections/Articles'
import { Objects } from './collections/Objects'
import { Developers } from './collections/Developers'
import { Places } from './collections/Places'
import { Terms } from './collections/Terms'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const PG = process.env.DATABASE_URI?.startsWith('postgres') ? process.env.DATABASE_URI : ''

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' — Шахматка', icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' }] },
    components: { graphics: { Logo: '/components/admin/Graphics#Logo', Icon: '/components/admin/Graphics#Icon' } },
  },
  i18n: { supportedLanguages: { ru }, fallbackLanguage: 'ru' },
  collections: [Articles, Objects, Developers, Places, Terms, Media, Users],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  // Продакшен: PostgreSQL (DATABASE_URI=postgres://…), схема — только миграциями из src/migrations, они применяются при старте.
  // Локально без DATABASE_URI: SQLite-файл, схема подтягивается автоматически в dev.
  db: PG
    ? postgresAdapter({ pool: { connectionString: PG, ssl: process.env.DATABASE_SSL === '1' ? { rejectUnauthorized: false } : undefined }, push: false, prodMigrations: migrations })
    : sqliteAdapter({ client: { url: process.env.DATABASE_URL || 'file:./shakhmatka.db' } }),
  sharp,
  // Файлы (фото) — в S3-хранилище, если оно задано: контейнер при каждом деплое создаётся заново и свои файлы теряет.
  // Отдаются через /api/media/file/…, так что бакет может быть приватным.
  plugins: process.env.S3_BUCKET
    ? [s3Storage({
        collections: { media: true },
        bucket: process.env.S3_BUCKET,
        config: {
          endpoint: process.env.S3_ENDPOINT || 'https://s3.twcstorage.ru',
          region: process.env.S3_REGION || 'ru-1',
          forcePathStyle: true,
          credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID || '', secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '' },
        },
      })]
    : [],
})
