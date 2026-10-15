/**
 * Восстанавливает файлы фото, если запись в базе есть, а самого файла в хранилище нет
 * (например, контейнер пересоздан при деплое, а S3 не был подключён). Исходники берёт из content/.
 * Запускается при старте контейнера; повторный запуск безопасен.
 * npm run media:restore
 */
import fs from 'node:fs'
import path from 'node:path'
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'
import { initPayload } from './_payload'

const CONTENT = process.env.CONTENT_DIR ? path.resolve(process.env.CONTENT_DIR, '..') : path.resolve('../content')
const SOURCES = [path.join(CONTENT, 'articles', 'media'), path.join(CONTENT, 'objects', 'photos'), path.join(CONTENT, 'objects', 'media')]
const LOCAL = path.resolve('media')

const s3 = process.env.S3_BUCKET
  ? new S3Client({
      endpoint: process.env.S3_ENDPOINT || 'https://s3.twcstorage.ru',
      region: process.env.S3_REGION || 'ru-1',
      forcePathStyle: true,
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID || '', secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '' },
    })
  : null

async function exists(filename: string): Promise<boolean> {
  if (!s3) return fs.existsSync(path.join(LOCAL, filename))
  try {
    await s3.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET, Key: filename }))
    return true
  } catch {
    return false
  }
}

async function run() {
  const payload = await initPayload()
  console.log(`→ проверка фото: хранилище ${s3 ? `S3 (${process.env.S3_BUCKET})` : 'диск контейнера — ⚠ без S3 файлы пропадут при следующем деплое'}`)
  const docs = (await payload.find({ collection: 'media', limit: 100000, pagination: false, depth: 0 })).docs as unknown as {
    id: number
    filename?: string
    sizes?: { card?: { filename?: string | null } }
  }[]
  let ok = 0, fixed = 0, miss = 0, failed = 0
  for (const m of docs) {
    if (!m.filename) continue
    const card = m.sizes?.card?.filename
    if ((await exists(m.filename)) && (!card || (await exists(card)))) { ok++; continue }
    const src = SOURCES.map((d) => path.join(d, m.filename!)).find((p) => fs.existsSync(p))
    if (!src) { miss++; continue }
    const tmp = path.join(fs.mkdtempSync('/tmp/mr-'), m.filename)
    fs.copyFileSync(src, tmp)
    try {
      await payload.update({ collection: 'media', id: m.id, data: {}, filePath: tmp, overwriteExistingFiles: true } as never)
      fixed++
    } catch (e) {
      failed++
      if (failed <= 3) console.log(`  ошибка загрузки ${m.filename}: ${String(e)}`)
    }
  }
  console.log(`✓ фото: на месте ${ok}, восстановлено ${fixed}, нет исходника ${miss}, ошибок ${failed}`)
  process.exit(0)
}
await run()
