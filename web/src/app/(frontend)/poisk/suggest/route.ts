import { NextResponse } from 'next/server'
import { searchEnabled, suggest } from '@/lib/search'

// подсказки для поля поиска в шапке; ключ Meilisearch остаётся на сервере
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get('q') || '').trim().slice(0, 80)
  if (!q || !searchEnabled()) return NextResponse.json({ hits: [], enabled: searchEnabled() })
  try {
    const hits = await suggest(q)
    return NextResponse.json({ hits, enabled: true }, { headers: { 'Cache-Control': 'public, max-age=30' } })
  } catch {
    return NextResponse.json({ hits: [], enabled: false })
  }
}
