/**
 * Где взять исходный файл фото для загрузки в Media.
 * Исходники фото не входят в образ приложения (они уже в S3), поэтому ищем по порядку:
 *   1) локальная папка content/… — при запуске на компьютере редакции;
 *   2) папка incoming/ в бакете S3 — туда редакция кладёт новые фото (например, через Cyberduck) перед деплоем;
 *   3) сам исходник в бакете (с тем же именем) — чтобы пересоздать уменьшенные копии уже загруженного фото.
 * Возвращает путь к файлу на диске или null.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { s3ClientConfig, s3Env, s3Ready } from '../lib/s3env'

export const INCOMING = 'incoming/'
let client: S3Client | null | undefined
const s3 = () => (client === undefined ? (client = s3Ready() ? new S3Client(s3ClientConfig()) : null) : client)

export async function sourcePath(dirs: string | string[], file: string): Promise<string | null> {
  for (const d of Array.isArray(dirs) ? dirs : [dirs]) {
    const p = path.join(d, file)
    if (fs.existsSync(p)) return p
  }
  const c = s3()
  if (!c) return null
  const name = path.basename(file)
  for (const Key of [INCOMING + name, name]) {
    try {
      const r = await c.send(new GetObjectCommand({ Bucket: s3Env().bucket, Key }))
      const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'src-')), name)
      fs.writeFileSync(tmp, Buffer.from(await r.Body!.transformToByteArray()))
      return tmp
    } catch {
      // нет такого объекта — пробуем следующий вариант
    }
  }
  return null
}
