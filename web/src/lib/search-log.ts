/**
 * Запись событий поиска в журнал (коллекция search-events). Без IP и cookie — только запрос, число найденного и переход.
 * Боты и пустые запросы не пишутся. Ошибки записи не мешают поиску.
 */
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

const BOT = /bot|crawl|spider|slurp|yandex|google|bing|mail\.ru|preview|headless|lighthouse|monitor|curl|wget|python|http/i
export const normQ = (q: string) => q.replace(/ё/g, 'е').replace(/Ё/g, 'Е').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 120)

export type SearchEvent = { kind: 'search' | 'click' | 'suggest'; q: string; tab?: string; hits?: number; url?: string; position?: number }

export async function logSearch(e: SearchEvent) {
  try {
    const h = await headers()
    if (BOT.test(h.get('user-agent') || '') || h.get('purpose') === 'prefetch' || h.get('next-router-prefetch')) return
    const q = normQ(e.q)
    if (q.length < 2) return
    const url = e.url && /^\/[\w\-/%.?=&]*$/.test(e.url) ? e.url.slice(0, 300) : undefined
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'search-events', overrideAccess: true,
      data: { kind: e.kind, q, tab: e.tab?.slice(0, 20) || undefined, hits: Number.isFinite(e.hits) ? e.hits : undefined, url, position: Number.isFinite(e.position) ? e.position : undefined },
    })
  } catch (err) {
    console.warn('поиск: событие не записано', String(err).slice(0, 160))
  }
}
