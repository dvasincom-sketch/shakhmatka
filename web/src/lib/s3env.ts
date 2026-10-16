/**
 * Настройки S3 из переменных окружения. Ключи принимаются под разными распространёнными именами,
 * чтобы опечатка в названии переменной в панели хостинга не выключала хранилище молча.
 */
const pick = (...names: string[]) => names.map((n) => process.env[n]).find((v) => v && v.trim())?.trim() || ''
export const s3Env = () => ({
  bucket: pick('S3_BUCKET', 'S3_BUCKET_NAME', 'AWS_BUCKET'),
  accessKeyId: pick('S3_ACCESS_KEY_ID', 'S3_ACCESS_KEY', 'S3_KEY', 'AWS_ACCESS_KEY_ID'),
  secretAccessKey: pick('S3_SECRET_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_SECRET', 'AWS_SECRET_ACCESS_KEY'),
  endpoint: pick('S3_ENDPOINT', 'AWS_ENDPOINT_URL') || 'https://s3.twcstorage.ru',
  region: pick('S3_REGION', 'AWS_REGION') || 'ru-1',
})
/** Хранилище включаем, только если есть и бакет, и оба ключа */
export const s3Ready = () => { const e = s3Env(); return !!(e.bucket && e.accessKeyId && e.secretAccessKey) }
/** Чего не хватает — для /healthz/ и логов (без значений) */
export const s3Missing = () => { const e = s3Env(); return [!e.bucket && 'S3_BUCKET', !e.accessKeyId && 'S3_ACCESS_KEY_ID', !e.secretAccessKey && 'S3_SECRET_ACCESS_KEY'].filter(Boolean) as string[] }
