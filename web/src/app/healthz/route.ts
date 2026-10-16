import { s3Missing, s3Ready } from '@/lib/s3env'

/** Проверка состояния для хостинга: /healthz/ отвечает 200, пока процесс жив. Ниже — где хранятся фото и каких переменных S3 не хватает. */
export const dynamic = 'force-dynamic'

export function GET() {
  const miss = s3Missing()
  const storage = s3Ready() ? 's3' : `disk${miss.length < 3 ? ` (не задано: ${miss.join(', ')})` : ''}`
  return new Response(`ok\nstorage: ${storage}\n`, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } })
}
