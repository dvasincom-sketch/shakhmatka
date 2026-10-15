import { NextResponse } from 'next/server'
import { runDigest } from '@/lib/digest'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** Запуск рассылки по расписанию (внешний cron раз в день): GET /akkaunt/rassylka/?key=<DIGEST_KEY>. Без ключа — 404. */
export async function GET(req: Request) {
  const key = process.env.DIGEST_KEY
  if (!key || new URL(req.url).searchParams.get('key') !== key) return new NextResponse('Not found', { status: 404 })
  const dry = new URL(req.url).searchParams.get('dry') === '1'
  return NextResponse.json(await runDigest({ dry }))
}
