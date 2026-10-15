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
import { Readers } from './collections/Readers'
import { Follows } from './collections/Follows'
import { Leads } from './collections/Leads'
import { Media } from './collections/Media'
import { Articles } from './collections/Articles'
import { Objects } from './collections/Objects'
import { Developers } from './collections/Developers'
import { Places } from './collections/Places'
import { Terms } from './collections/Terms'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
// Адрес базы: DATABASE_URI (наш) или DATABASE_URL (так его передаёт Timeweb при подключении базы к приложению).
// Параметры sslmode/sslrootcert из адреса убираем и включаем SSL сами: сертификат управляемой базы самоподписанный.
const RAW_DB = process.env.DATABASE_URI || process.env.DATABASE_URL || ''
const IS_PG = /^postgres(ql)?:\/\//.test(RAW_DB)
let PG = ''
let PG_SSL = process.env.DATABASE_SSL === '1'
if (IS_PG) {
  const u = new URL(RAW_DB)
  const mode = u.searchParams.get('sslmode')
  if (mode && mode !== 'disable') PG_SSL = true
  for (const k of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey']) u.searchParams.delete(k)
  PG = u.toString()
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' — Шахматка', icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' }] },
    components: { graphics: { Logo: '/components/admin/Graphics#Logo', Icon: '/components/admin/Graphics#Icon' } },
  },
  i18n: { supportedLanguages: { ru }, fallbackLanguage: 'ru' },
  collections: [Articles, Objects, Developers, Places, Terms, Media, Users, Readers, Follows, Leads],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  // Продакшен: PostgreSQL (DATABASE_URI или DATABASE_URL = postgres://…), схема — только миграциями из src/migrations, они применяются при старте.
  // Локально без DATABASE_URI: SQLite-файл, схема подтягивается автоматически в dev.
  db: PG
    ? postgresAdapter({ pool: { connectionString: PG, ssl: PG_SSL ? { rejectUnauthorized: false } : undefined }, push: false, prodMigrations: migrations })
    : sqliteAdapter({ client: { url: RAW_DB.startsWith('file:') ? RAW_DB : 'file:./shakhmatka.db' } }),
  sharp,
  // роли появились позже пользователей: если администратора нет, им становится самый первый пользователь
  onInit: async (payload) => {
    try {
      const admins = await payload.count({ collection: 'users', where: { role: { equals: 'admin' } } })
      if (admins.totalDocs) return
      const first = (await payload.find({ collection: 'users', sort: 'createdAt', limit: 1, depth: 0 })).docs[0]
      if (first) await payload.update({ collection: 'users', id: first.id, data: { role: 'admin' }, overrideAccess: true })
    } catch (e) { payload.logger.warn(`роли пользователей: ${String(e)}`) }
  },
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
