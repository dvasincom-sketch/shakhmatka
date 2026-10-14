import type { Payload } from 'payload'
import { STATIC } from './landing-static'
import { ONLY_READY } from './public'

/**
 * Проверка внутренних ссылок. Знает все разделы сайта и все существующие страницы.
 * Используется: при выводе статьи (битая ссылка показывается простым текстом), при сохранении статьи в админке
 * (список проблем в поле «Проверка ссылок») и в npm run check:links.
 */
export type LinkIndex = { pages: Set<string> }

const STATIC_PAGES = ['/', '/novosti/', '/krt/', '/ceny-na-starte/', '/obekty/', '/zastroyshchiki/', '/novostroyki/', '/slovar/', '/temy/', '/o-proekte/', '/pro/', '/poisk/']

/** Старые схемы адресов из промта v1.x → актуальные */
const LEGACY: [RegExp, string][] = [
  [/^\/moskva\/?$/, '/novostroyki/moskva/'],
  [/^\/moskva\/([\w-]+)\/?$/, '/novostroyki/$1/'],
  [/^\/regiony\/([\w-]+)\/?$/, '/novostroyki/$1/'],
  [/^\/rayony\/([\w-]+)\/?$/, '/novostroyki/$1/'],
]

export function normalize(href: string): { path: string; tail: string } {
  const m = href.match(/^([^?#]*)(.*)$/)!
  let path = m[1] || '/'
  if (!path.endsWith('/')) path += '/'
  for (const [re, to] of LEGACY) if (re.test(path)) { path = path.replace(re, to); break }
  return { path, tail: m[2] }
}

export async function buildLinkIndex(payload: Payload): Promise<LinkIndex> {
  const all = { limit: 100000, pagination: false as const, depth: 0 }
  const [arts, objs, devs, places, terms] = await Promise.all([
    payload.find({ collection: 'articles', ...all, select: { slug: true, reviewStatus: true, topics: true } }),
    payload.find({ collection: 'objects', ...all, select: { slug: true } }),
    payload.find({ collection: 'developers', ...all, select: { slug: true } }),
    payload.find({ collection: 'places', ...all, select: { slug: true } }),
    payload.find({ collection: 'terms', ...all, where: { published: { equals: true } }, select: { slug: true } }),
  ])
  const pages = new Set(STATIC_PAGES)
  const visible = arts.docs.filter((a) => !ONLY_READY || a.reviewStatus === 'ready')
  visible.forEach((a) => pages.add(`/novosti/${a.slug}/`))
  visible.forEach((a) => (a.topics || []).forEach((t) => t.value && pages.add(`/temy/${t.value}/`)))
  objs.docs.forEach((o) => pages.add(`/obekty/${o.slug}/`))
  devs.docs.forEach((d) => pages.add(`/zastroyshchiki/${d.slug}/`))
  places.docs.forEach((p) => pages.add(`/novostroyki/${p.slug}/`))
  STATIC.forEach((l) => pages.add(`/novostroyki/${l.slug}/`))
  terms.docs.forEach((t) => pages.add(`/slovar/${t.slug}/`))
  return { pages }
}

/** Вернёт рабочий адрес или null, если такой страницы нет */
export function resolveLink(index: LinkIndex, href: string): string | null {
  if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/api/')) return href
  const { path, tail } = normalize(href)
  return index.pages.has(decodeURI(path)) ? path + tail : null
}

const REASON: Record<string, string> = {
  novosti: 'нет такой статьи', obekty: 'нет такого объекта', zastroyshchiki: 'нет такого застройщика',
  novostroyki: 'нет такой подборки', slovar: 'термин не создан или не опубликован', temy: 'нет статей с такой темой',
}

/** Все внутренние ссылки markdown-текста, которые никуда не ведут */
export function findBroken(index: LinkIndex, md: string) {
  const out: { href: string; text: string; reason: string; fixed?: string }[] = []
  for (const m of md.matchAll(/(?<!!)\[([^\]]+)\]\((\/[^)\s]*)\)/g)) {
    const [, text, href] = m
    if (href.startsWith('/api/')) continue
    const ok = resolveLink(index, href)
    const section = normalize(href).path.split('/')[1]
    if (!ok) out.push({ href, text, reason: REASON[section] || 'нет такого раздела на сайте' })
  }
  return out
}

export const brokenReport = (b: ReturnType<typeof findBroken>) =>
  b.map((x) => `${x.href} — «${x.text}»: ${x.reason}`).join('\n')
