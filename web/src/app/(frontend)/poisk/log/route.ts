import { NextResponse } from 'next/server'
import { logSearch, type SearchEvent } from '@/lib/search-log'

// приём событий поиска из браузера (переходы по результатам и сессии подсказок); отвечаем сразу, пишем в фоне
export const dynamic = 'force-dynamic'
const KINDS = new Set(['click', 'suggest'])

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Partial<SearchEvent>
    if (b && KINDS.has(String(b.kind)) && typeof b.q === 'string') {
      await logSearch({ kind: b.kind as SearchEvent['kind'], q: b.q, tab: typeof b.tab === 'string' ? b.tab : undefined, hits: Number(b.hits), url: typeof b.url === 'string' ? b.url : undefined, position: Number(b.position) })
    }
  } catch { /* битый запрос — молча игнорируем */ }
  return new NextResponse(null, { status: 204 })
}
