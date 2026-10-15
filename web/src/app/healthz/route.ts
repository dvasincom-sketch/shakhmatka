/** Проверка состояния для хостинга: /healthz/ отвечает 200, пока процесс жив. Вторая строка — где хранятся фото (s3 или disk). */
export const dynamic = 'force-dynamic'

export function GET() {
  const storage = process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY ? 's3' : 'disk'
  return new Response(`ok\nstorage: ${storage}\n`, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } })
}
