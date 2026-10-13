/** Проверка состояния для хостинга: /healthz/ отвечает 200, пока процесс жив */
export const dynamic = 'force-dynamic'

export function GET() {
  return new Response('ok', { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } })
}
