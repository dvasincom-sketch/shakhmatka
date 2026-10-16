/**
 * Поиск на Meilisearch. Один индекс на всё: материалы, объекты, застройщики, районы, термины.
 * Включается переменными MEILI_HOST (адрес сервера) и MEILI_MASTER_KEY (или MEILI_API_KEY с правами на индекс).
 * Без них сайт ищет по базе, как раньше (lib/search-fallback в странице /poisk/).
 * Индекс пересобирается при старте контейнера (npm run search:index) и обновляется хуками Payload при правке документов.
 */
import type { Payload } from 'payload'
import { editorialSettings, type SearchSettingsDoc } from './search-config'

export const MEILI_HOST = (process.env.MEILI_HOST || '').replace(/\/$/, '')
const KEY = process.env.MEILI_MASTER_KEY || process.env.MEILI_API_KEY || ''
export const INDEX = process.env.MEILI_INDEX || 'shakhmatka'
export const searchEnabled = () => !!MEILI_HOST

export type DocType = 'article' | 'interior' | 'object' | 'developer' | 'place' | 'term'
export type SearchDoc = {
  id: string // <type>-<id>
  type: DocType
  title: string
  subtitle?: string
  text?: string
  aliases?: string[]
  zu?: string
  developer?: string
  district?: string
  stage?: string
  url: string
  date?: number // unix, для сортировки свежих
  weight: number // важность внутри типа: события, материалы
}

async function meili<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${MEILI_HOST}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(KEY ? { Authorization: `Bearer ${KEY}` } : {}), ...(init?.headers || {}) },
    cache: 'no-store',
  })
  if (!r.ok) throw new Error(`meilisearch ${path}: ${r.status} ${await r.text()}`)
  return (await r.json()) as T
}

async function waitTask(uid: number) {
  for (let i = 0; i < 600; i++) {
    const t = await meili<{ status: string; error?: unknown }>(`/tasks/${uid}`)
    if (t.status === 'succeeded') return
    if (t.status === 'failed' || t.status === 'canceled') throw new Error(`meilisearch task ${uid}: ${JSON.stringify(t.error)}`)
    await new Promise((r) => setTimeout(r, 250))
  }
}

/** «ё» → «е»: Meilisearch не считает их одной буквой */
export const fold = (s?: string | null) => (s || '').replace(/ё/g, 'е').replace(/Ё/g, 'Е')

const SETTINGS = {
  searchableAttributes: ['title', 'aliases', 'zu', 'developer', 'district', 'subtitle', 'text'],
  displayedAttributes: ['id', 'type', 'title', 'subtitle', 'url', 'stage', 'district', 'developer', 'zu', 'date'],
  filterableAttributes: ['type', 'stage', 'district'],
  sortableAttributes: ['date', 'weight'],
  rankingRules: ['words', 'typo', 'proximity', 'attribute', 'exactness', 'weight:desc', 'date:desc'],
  pagination: { maxTotalHits: 500 },
}

/** Синонимы, стоп-слова и опечатки — из админки (глобал «Настройки поиска»), без него — значения по умолчанию */
async function fullSettings(payload: Payload) {
  const doc = await payload.findGlobal({ slug: 'search-settings' as never, depth: 0, overrideAccess: true }).catch(() => null)
  return { ...SETTINGS, ...editorialSettings(doc as SearchSettingsDoc | null) }
}

/** Сохранили настройки в админке — применяем к живому индексу без пересборки */
export async function applyEditorialSettings(doc: SearchSettingsDoc) {
  if (!searchEnabled()) return
  try { await meili(`/indexes/${INDEX}/settings`, { method: 'PATCH', body: JSON.stringify(editorialSettings(doc)) }) }
  catch (e) { console.warn('поиск: настройки не применены', String(e).slice(0, 200)) }
}

const ts = (d?: string | null) => (d ? Math.floor(new Date(d).getTime() / 1000) : undefined)
const clip = (s: string | null | undefined, n: number) => (s ? fold(s).slice(0, n) : undefined)

type AnyDoc = Record<string, unknown> & { id: number | string }

export function articleDoc(a: AnyDoc): SearchDoc | null {
  if (a._status && a._status !== 'published') return null
  return {
    id: `article-${a.id}`, type: a.type === 'interior' ? 'interior' : 'article', title: fold(a.title as string), subtitle: clip(a.lead as string, 300),
    text: clip(String(a.body || '').replace(/[#*_>`|[\]()!-]/g, ' '), 4000), url: `/novosti/${a.slug}/`,
    date: ts((a.datePublished as string) || null), weight: 1,
  }
}
export function objectDoc(o: AnyDoc, devName?: string, districtName?: string): SearchDoc {
  const tl = (o.timeline as { title?: string }[] | undefined) || []
  return {
    id: `object-${o.id}`, type: 'object', title: fold(o.name as string),
    aliases: ((o.aliases as { value?: string }[] | undefined) || []).map((x) => fold(x.value)).filter(Boolean),
    zu: fold(o.zu as string) || undefined, developer: fold(devName) || undefined, district: fold(districtName) || undefined,
    stage: (o.stage as string) || undefined, subtitle: clip(o.summary as string, 300),
    text: clip(tl.map((t) => t.title).join(' · '), 3000), url: `/obekty/${o.slug}/`,
    date: ts(o.lastEventAt as string), weight: Math.min(50, tl.length),
  }
}
export function developerDoc(d: AnyDoc, projects = 0): SearchDoc {
  return {
    id: `developer-${d.id}`, type: 'developer', title: fold(d.name as string),
    aliases: ((d.legalNames as { value?: string }[] | undefined) || []).map((x) => fold(x.value)).filter(Boolean),
    text: clip(d.about as string, 1500), subtitle: projects ? `${projects} проектов в досье` : undefined,
    url: `/zastroyshchiki/${d.slug}/`, weight: Math.min(80, projects),
  }
}
export function placeDoc(p: AnyDoc): SearchDoc {
  return { id: `place-${p.id}`, type: 'place', title: fold(`Новостройки ${p.nameIn || p.name}`), aliases: [fold(p.name as string)], district: fold(p.name as string), subtitle: (p.okrug as string) || undefined, text: clip(p.intro as string, 1500), url: `/novostroyki/${p.slug}/`, weight: 30 }
}
export function termDoc(t: AnyDoc): SearchDoc | null {
  if (!t.published) return null
  return { id: `term-${t.id}`, type: 'term', title: fold(t.term as string), aliases: t.full ? [fold(t.full as string)] : [], subtitle: clip(t.short as string, 300), text: clip(t.body as string, 1500), url: `/slovar/${t.slug}/`, weight: 20 }
}

/** Все документы для индекса (полная пересборка) */
export async function buildDocs(payload: Payload): Promise<SearchDoc[]> {
  const all = async (collection: string, extra: Record<string, unknown> = {}) =>
    (await payload.find({ collection: collection as never, limit: 100000, pagination: false, depth: 0, ...extra })).docs as unknown as AnyDoc[]
  const [arts, objs, devs, places, terms] = await Promise.all([all('articles'), all('objects'), all('developers'), all('places'), all('terms').catch(() => [] as AnyDoc[])])
  const devName = new Map(devs.map((d) => [d.id, d.name as string]))
  const placeName = new Map(places.map((p) => [p.key as string, p.name as string]))
  const projects = new Map<string | number, number>()
  objs.forEach((o) => { if (o.developer != null) projects.set(o.developer as number, (projects.get(o.developer as number) || 0) + 1) })
  return [
    ...arts.map(articleDoc),
    ...objs.map((o) => objectDoc(o, devName.get(o.developer as number), placeName.get((o.district as string) || (o.region as string)))),
    ...devs.map((d) => developerDoc(d, projects.get(d.id) || 0)),
    ...places.map(placeDoc),
    ...terms.map(termDoc),
  ].filter((x): x is SearchDoc => !!x)
}

/** Полная пересборка: новый индекс с настройками → документы → атомарная подмена старого */
export async function reindexAll(payload: Payload) {
  const docs = await buildDocs(payload)
  const tmp = `${INDEX}_tmp`
  await meili(`/indexes/${tmp}`, { method: 'DELETE' }).then((t) => waitTask((t as { taskUid: number }).taskUid)).catch(() => {})
  await waitTask((await meili<{ taskUid: number }>('/indexes', { method: 'POST', body: JSON.stringify({ uid: tmp, primaryKey: 'id' }) })).taskUid)
  await waitTask((await meili<{ taskUid: number }>(`/indexes/${tmp}/settings`, { method: 'PATCH', body: JSON.stringify(await fullSettings(payload)) })).taskUid)
  for (let i = 0; i < docs.length; i += 1000) {
    await waitTask((await meili<{ taskUid: number }>(`/indexes/${tmp}/documents`, { method: 'POST', body: JSON.stringify(docs.slice(i, i + 1000)) })).taskUid)
  }
  const exists = await meili(`/indexes/${INDEX}`).then(() => true).catch(() => false)
  if (!exists) await waitTask((await meili<{ taskUid: number }>('/indexes', { method: 'POST', body: JSON.stringify({ uid: INDEX, primaryKey: 'id' }) })).taskUid)
  await waitTask((await meili<{ taskUid: number }>('/swap-indexes', { method: 'POST', body: JSON.stringify([{ indexes: [INDEX, tmp] }]) })).taskUid)
  await meili(`/indexes/${tmp}`, { method: 'DELETE' }).catch(() => {})
  return docs.length
}

/** Точечное обновление из хуков Payload; ошибки не ломают сохранение документа */
export async function upsertDocs(docs: (SearchDoc | null)[], removeIds: string[] = []) {
  if (!searchEnabled()) return
  try {
    const add = docs.filter((x): x is SearchDoc => !!x)
    if (add.length) await meili(`/indexes/${INDEX}/documents`, { method: 'POST', body: JSON.stringify(add) })
    if (removeIds.length) await meili(`/indexes/${INDEX}/documents/delete-batch`, { method: 'POST', body: JSON.stringify(removeIds) })
  } catch (e) {
    console.warn('поиск: не удалось обновить индекс', String(e).slice(0, 200))
  }
}

export type Hit = SearchDoc & { _formatted?: Partial<Record<'title' | 'subtitle' | 'text', string>> }
export type SearchResult = { hits: Hit[]; estimatedTotalHits?: number; totalHits?: number; facetDistribution?: { type?: Record<string, number> }; processingTimeMs: number }

export async function search(q: string, opts: { type?: string; limit?: number; offset?: number; highlight?: boolean } = {}): Promise<SearchResult> {
  return meili<SearchResult>(`/indexes/${INDEX}/search`, {
    method: 'POST',
    body: JSON.stringify({
      q: fold(q), limit: opts.limit ?? 20, offset: opts.offset ?? 0,
      filter: opts.type ? [`type = ${JSON.stringify(opts.type)}`] : undefined,
      facets: ['type'],
      ...(opts.highlight ? { attributesToHighlight: ['title', 'subtitle'], attributesToCrop: ['text'], cropLength: 24, highlightPreTag: '<mark>', highlightPostTag: '</mark>', attributesToRetrieve: ['*'] } : {}),
    }),
  })
}

/** Подсказки для поля поиска в шапке: по несколько лучших каждого типа */
export async function suggest(q: string) {
  const types: DocType[] = ['object', 'developer', 'place', 'article', 'interior', 'term']
  const r = await meili<{ results: SearchResult[] }>('/multi-search', {
    method: 'POST',
    body: JSON.stringify({ queries: types.map((t) => ({ indexUid: INDEX, q: fold(q), limit: t === 'article' ? 4 : 3, filter: [`type = "${t}"`], attributesToRetrieve: ['type', 'title', 'subtitle', 'url', 'stage', 'developer', 'district', 'zu'] })) }),
  })
  return r.results.flatMap((x) => x.hits)
}

/** Хуки Payload: документ изменился — обновить его в индексе (в фоне, без ожидания) */
export function syncDoc(payload: Payload, collection: 'articles' | 'objects' | 'developers' | 'terms', doc: AnyDoc) {
  if (!searchEnabled() || process.env.SEARCH_HOOKS === '0') return
  void (async () => {
    const id = `${{ articles: 'article', objects: 'object', developers: 'developer', terms: 'term' }[collection]}-${doc.id}`
    let d: SearchDoc | null = null
    if (collection === 'articles') d = articleDoc(doc)
    else if (collection === 'terms') d = termDoc(doc)
    else if (collection === 'developers') d = developerDoc(doc, (await payload.count({ collection: 'objects', where: { developer: { equals: doc.id } } })).totalDocs)
    else {
      const devId = typeof doc.developer === 'object' && doc.developer ? (doc.developer as AnyDoc).id : doc.developer
      const dev = devId != null ? await payload.findByID({ collection: 'developers', id: devId as number, depth: 0 }).catch(() => null) : null
      const key = (doc.district as string) || (doc.region as string)
      const place = key ? (await payload.find({ collection: 'places', where: { key: { equals: key } }, limit: 1, depth: 0 })).docs[0] : undefined
      d = objectDoc(doc, dev?.name as string | undefined, place?.name as string | undefined)
    }
    await upsertDocs(d ? [d] : [], d ? [] : [id])
  })().catch((e) => console.warn('поиск: хук', String(e).slice(0, 200)))
}
export function removeDoc(collection: 'articles' | 'objects' | 'developers' | 'terms', id: number | string) {
  if (!searchEnabled() || process.env.SEARCH_HOOKS === '0') return
  void upsertDocs([], [`${{ articles: 'article', objects: 'object', developers: 'developer', terms: 'term' }[collection]}-${id}`])
}
