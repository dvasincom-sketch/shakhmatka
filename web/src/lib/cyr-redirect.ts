/**
 * Кириллические адреса как вход: /застройщики/самолёт/, /объекты/внуково-2017/, /zastroyshchiki/самолёт/ →
 * постоянный редирект (308) на латинский адрес. Основные адреса сайта остаются латинскими (короткие ссылки при пересылке).
 * Раздел узнаём по словарю или по транслиту; запись — по транслиту слага, затем по названию и другим названиям.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { permanentRedirect } from 'next/navigation'
import { stationSlug } from './metro'
import { BUREAUS } from './architects'
import { TOPICS } from './topics'
import { getLandings } from './landings'

const CYR = /[а-яё]/i
export const hasCyr = (s: string) => CYR.test(s)
const dec = (s: string) => { try { return decodeURIComponent(s) } catch { return s } }
/** «Внуково-2017», «внуково 2017», «Внуково_2017» → «внуково 2017» */
const norm = (s: string) => dec(s).toLowerCase().replace(/ё/g, 'е').replace(/[«»"'„“]/g, '').replace(/[-_+.,]+/g, ' ').replace(/\s+/g, ' ').trim()
const tr = (s: string) => stationSlug(dec(s).replace(/[«»"'„“]/g, ''))

/** Разделы: русское название (и частые варианты) → латинский адрес */
const SECTIONS: Record<string, string> = {
  лента: '', главная: '', новости: 'novosti', статьи: 'novosti', материалы: 'novosti',
  объекты: 'obekty', объект: 'obekty', проекты: 'obekty', жк: 'obekty',
  застройщики: 'zastroyshchiki', застройщик: 'zastroyshchiki', девелоперы: 'zastroyshchiki',
  новостройки: 'novostroyki', районы: 'novostroyki', район: 'novostroyki',
  архитекторы: 'arhitektory', бюро: 'arhitektory', архитектура: 'arhitektory',
  словарь: 'slovar', термины: 'slovar', темы: 'temy', тема: 'temy', сигналы: 'signaly', сигнал: 'signaly',
  поиск: 'poisk', кабинет: 'akkaunt', аккаунт: 'akkaunt', 'личный кабинет': 'akkaunt', подписка: 'akkaunt',
  'о проекте': 'o-proekte', конфиденциальность: 'konfidentsialnost', крт: 'krt', 'трекер крт': 'krt',
  'цены на старте': 'ceny-na-starte', 'московские кварталы': 'moskovskie-kvartaly', разморозка: 'razmorozka',
  про: 'pro', 'шахматка про': 'pro', карта: 'obekty',
}
const LATIN_SECTIONS = new Set(Object.values(SECTIONS).filter(Boolean))
function sectionOf(seg: string): string | null {
  if (!hasCyr(seg)) return LATIN_SECTIONS.has(seg) ? seg : null
  const n = norm(seg)
  if (n in SECTIONS) return SECTIONS[n]
  const t = tr(seg)
  return LATIN_SECTIONS.has(t) ? t : null
}

// названия записей держим в памяти процесса 10 минут: редиректы редкие, а полный список нужен для поиска по названию
type Row = { slug: string; names: string[] }
const memo = new Map<string, { at: number; rows: Promise<Row[]> }>()
function rows(collection: 'developers' | 'objects' | 'terms' | 'articles'): Promise<Row[]> {
  const m = memo.get(collection)
  if (m && Date.now() - m.at < 600_000) return m.rows
  const load = async (): Promise<Row[]> => {
    const payload = await getPayload({ config })
    const select = collection === 'developers' ? { slug: true, name: true, legalNames: true }
      : collection === 'objects' ? { slug: true, name: true, aliases: true }
      : collection === 'terms' ? { slug: true, term: true, full: true } : { slug: true, title: true }
    const docs = (await payload.find({ collection, limit: 20000, depth: 0, pagination: false, select: select as never })).docs as unknown as Record<string, unknown>[]
    return docs.map((d) => ({
      slug: String(d.slug),
      names: [d.name, d.term, d.full, d.title, ...((d.aliases || d.legalNames || []) as { value?: string }[]).map((a) => a?.value)].filter(Boolean).map((x) => norm(String(x))),
    }))
  }
  const p = load()
  memo.set(collection, { at: Date.now(), rows: p })
  p.catch(() => memo.delete(collection))
  return p
}

async function entity(section: string, raw: string): Promise<string | null> {
  const t = tr(raw), n = norm(raw)
  const find = (list: Row[]) => (list.find((r) => r.slug === t) || list.find((r) => r.names.includes(n)) || list.find((r) => r.slug.endsWith(`-${t}`)))?.slug || null
  switch (section) {
    case 'zastroyshchiki': return find(await rows('developers'))
    case 'obekty': return find(await rows('objects'))
    case 'slovar': return find(await rows('terms'))
    case 'novosti': case 'signaly': return find(await rows('articles'))
    case 'novostroyki': {
      const ls = await getLandings()
      return (ls.find((l) => l.slug === t) || ls.find((l) => norm(l.label) === n || norm(l.subject) === n))?.slug || null
    }
    case 'arhitektory': return (BUREAUS.find((b) => b.key === t) || BUREAUS.find((b) => [b.name, ...b.aliases].some((x) => norm(x) === n)))?.key || null
    case 'temy': return Object.keys(TOPICS).find((k) => k === t || norm(TOPICS[k].label) === n) || null
    default: return null
  }
}

/** Латинский адрес для кириллического пути (сегменты как в URL) или null */
export async function latinPath(segments: string[]): Promise<string | null> {
  const segs = segments.map(dec).filter(Boolean)
  if (!segs.length || !segs.some(hasCyr)) return null
  const section = sectionOf(segs[0])
  if (section === null) return null
  if (segs.length === 1) return section ? `/${section}/` : '/'
  const slug = hasCyr(segs[1]) ? await entity(section, segs[1]) : segs[1]
  if (!slug) return null
  // станция внутри района: /новостройки/даниловский/автозаводская/ → станцию дорешает страница станции
  const rest = segs.slice(2).map((s) => (hasCyr(s) ? tr(s) : s))
  return `/${section}/${[slug, ...rest].join('/')}/`
}

/** Для страниц разделов: если в слаге кириллица — отправить на латинский адрес (если запись нашлась) */
export async function redirectIfCyrillic(section: string, slug: string) {
  if (!hasCyr(dec(slug))) return
  const target = await latinPath([section, slug])
  if (target) permanentRedirect(target)
}
