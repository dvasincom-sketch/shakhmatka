/**
 * Восстанавливает файлы фото, если запись в базе есть, а самого файла в хранилище нет
 * (например, контейнер пересоздан при деплое, а S3 не был подключён). Исходники берёт из content/.
 * Запускается при старте контейнера; повторный запуск безопасен.
 * npm run media:restore
 */
import fs from 'node:fs'
import path from 'node:path'
import { S3Client, HeadObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { initPayload } from './_payload'
import { sourcePath } from './_source'
import { s3ClientConfig, s3Describe, s3Env, s3Missing, s3Ready } from '../lib/s3env'

const CONTENT = process.env.CONTENT_DIR ? path.resolve(process.env.CONTENT_DIR, '..') : path.resolve('../content')
const SOURCES = [path.join(CONTENT, 'articles', 'media'), path.join(CONTENT, 'objects', 'photos'), path.join(CONTENT, 'objects', 'media')]
const LOCAL = path.resolve('media')

const S3 = s3Env()
const s3 = s3Ready()
  ? new S3Client(s3ClientConfig())
  : null

async function exists(filename: string): Promise<boolean> {
  if (!s3) return fs.existsSync(path.join(LOCAL, filename))
  try {
    await s3.send(new HeadObjectCommand({ Bucket: S3.bucket, Key: filename }))
    return true
  } catch {
    return false
  }
}

const HINT: Record<string, string> = {
  SignatureDoesNotMatch: 'секретный ключ не подходит к ключу доступа: скопируйте заново пару «Ключ доступа» + «Секретный ключ» из настроек этого хранилища',
  InvalidAccessKeyId: 'ключ доступа не найден: S3_ACCESS_KEY_ID от другого хранилища или с опечаткой',
  NoSuchBucket: 'бакета с таким именем нет: S3_BUCKET должен совпадать с именем бакета в панели',
  AccessDenied: 'у ключа нет прав на запись в этот бакет',
}
/** Пробная запись маленького файла: если хранилище не принимает файлы, сразу говорим почему, а не сыплем тысячей ошибок */
async function probe(): Promise<boolean> {
  if (!s3) return true
  const Key = '_proverka.txt'
  try {
    await s3.send(new PutObjectCommand({ Bucket: S3.bucket, Key, Body: 'ok', ContentType: 'text/plain' }))
    await s3.send(new DeleteObjectCommand({ Bucket: S3.bucket, Key })).catch(() => null)
    console.log('  ✓ пробная запись в S3 прошла')
    return true
  } catch (e) {
    const name = (e as { name?: string; Code?: string }).name || (e as { Code?: string }).Code || 'ошибка'
    console.log(`  ✗ S3 не принимает файлы: ${name} — ${HINT[name] || String((e as Error).message || e)}`)
    console.log(`    настройки: ${s3Describe()}`)
    return false
  }
}

async function run() {
  if (!(await probe())) { console.log('✗ фото: загрузка в S3 пропущена, исправьте ключи и перезапустите приложение'); process.exit(1) }
  const payload = await initPayload()
  console.log(`→ проверка фото: хранилище ${s3 ? `S3 (${S3.bucket})` : `диск контейнера — ⚠ без S3 файлы пропадут при следующем деплое${s3Missing().length < 3 ? ` (не задано: ${s3Missing().join(', ')})` : ''}`}`)
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
    const src = await sourcePath(SOURCES, m.filename)
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
