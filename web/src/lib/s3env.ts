/**
 * Настройки S3 из переменных окружения. Ключи принимаются под разными распространёнными именами,
 * чтобы опечатка в названии переменной в панели хостинга не выключала хранилище молча.
 */
import type { S3ClientConfig } from '@aws-sdk/client-s3'

// значения чистим от пробелов, переносов, невидимых символов и кавычек: в панели хостинга их легко вставить вместе с ключом
const clean = (v?: string) => (v || '').replace(/[\s ​-‍⁠﻿]+/g, ' ').trim().replace(/^["'«]|["'»]$/g, '').trim()
const pick = (...names: string[]) => names.map((n) => clean(process.env[n])).find(Boolean) || ''
// в ключах пробелов не бывает вовсе
const key = (...names: string[]) => pick(...names).replace(/\s+/g, '')

/** Эндпоинт без пути и без имени бакета: https://s3.twcstorage.ru (бакет подставляется в путь сам, forcePathStyle) */
function endpointOf(raw: string, bucket: string): string {
  if (!raw) return 'https://s3.twcstorage.ru'
  try {
    const u = new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`)
    if (bucket && u.hostname.startsWith(`${bucket}.`)) u.hostname = u.hostname.slice(bucket.length + 1)
    return u.origin
  } catch {
    return 'https://s3.twcstorage.ru'
  }
}

export const s3Env = () => {
  const bucket = pick('S3_BUCKET', 'S3_BUCKET_NAME', 'AWS_BUCKET').replace(/^\/+|\/+$/g, '')
  return {
    bucket,
    accessKeyId: key('S3_ACCESS_KEY_ID', 'S3_ACCESS_KEY', 'S3_KEY', 'AWS_ACCESS_KEY_ID'),
    secretAccessKey: key('S3_SECRET_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_SECRET', 'AWS_SECRET_ACCESS_KEY'),
    endpoint: endpointOf(pick('S3_ENDPOINT', 'AWS_ENDPOINT_URL'), bucket),
    region: pick('S3_REGION', 'AWS_REGION') || 'ru-1',
  }
}

/**
 * Настройки клиента. Новые версии AWS SDK по умолчанию добавляют к загрузке контрольные суммы CRC32,
 * которые S3-совместимые хранилища часто не понимают (ошибка SignatureDoesNotMatch) — включаем их, только когда они обязательны.
 */
export const s3ClientConfig = (): S3ClientConfig => {
  const e = s3Env()
  return {
    endpoint: e.endpoint,
    region: e.region,
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    credentials: { accessKeyId: e.accessKeyId, secretAccessKey: e.secretAccessKey },
  }
}

/** Хранилище включаем, только если есть и бакет, и оба ключа */
export const s3Ready = () => { const e = s3Env(); return !!(e.bucket && e.accessKeyId && e.secretAccessKey) }
/** Чего не хватает — для /healthz/ и логов (без значений) */
export const s3Missing = () => { const e = s3Env(); return [!e.bucket && 'S3_BUCKET', !e.accessKeyId && 'S3_ACCESS_KEY_ID', !e.secretAccessKey && 'S3_SECRET_ACCESS_KEY'].filter(Boolean) as string[] }
/** Описание настроек для логов: адрес, бакет и длины ключей — сами ключи не печатаем */
export const s3Describe = () => { const e = s3Env(); return `${e.endpoint}, бакет ${e.bucket}, регион ${e.region}, длина ключа ${e.accessKeyId.length}, длина секрета ${e.secretAccessKey.length}` }
