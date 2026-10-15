/**
 * Автоматические внутренние ссылки: первое упоминание застройщика, архитектурного бюро или объекта в тексте
 * становится ссылкой на его страницу (/zastroyshchiki/…, /arhitektory/…, /obekty/…).
 * Работает на готовом HTML: не трогает заголовки, подписи, код и уже существующие ссылки;
 * каждую страницу связывает не больше одного раза и не ссылается на страницу, где стоит текст.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { BUREAUS } from './architects'

export type LinkTarget = { re: RegExp; href: string; title: string }

const L = '\\p{L}\\p{N}'
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** Падежные формы для кириллического названия: «Основа» → Основ(а|ы|е|у|ой) */
function forms(name: string): string {
  if (/[\s-]/.test(name) || !/[а-яё]$/i.test(name)) return esc(name)
  const st = esc(name.slice(0, -1)), last = name.slice(-1)
  if (last === 'а') return `${st}(?:а|ы|е|у|ой|ою)`
  if (last === 'я') return `${st}(?:я|и|е|ю|ей)`
  if (last === 'ь') return `${st}(?:ь|и|ью)`
  if (last === 'й') return `${st}(?:й|я|ю|ем|е)`
  return `${esc(name)}(?:|а|у|ом|е)`
}
/** Названия, которые совпадают с обычными словами или топонимами — без кавычек их не связываем */
const COMMON = new Set(['Атлас', 'Град', 'Рост', 'Родина', 'Север', 'Среда', 'Страна', 'Стена', 'Спартак', 'Черноголовка', 'Киевская площадь', 'Яндекс', 'Сумма', 'Консоль', 'Единство', 'Отрада', 'Остров Мечты', 'Новая Жизнь', 'Новая Эра', 'Капиталист', 'Капиталисты', 'Монарх', 'Атриум', 'Абсолют', 'Тач', 'Русич', 'Догма', 'Доходный Дом', 'Первый девелопер', 'Пионер', 'Основа', 'Эталон', 'Сити', 'Парк', 'Москва', 'Фонд реновации'])

const bare = (name: string) => new RegExp(`(?<![${L}„"])(«${forms(name)}»|(?<!«)${forms(name)}(?![${L}»]))`, 'u')
const quoted = (name: string) => new RegExp(`(«${forms(name)}»)`, 'u')
/** Обычное слово-название — только в кавычках; латиница и аббревиатуры — как есть */
const smart = (name: string) => (COMMON.has(name) ? quoted(name) : bare(name))

let memo: { at: number; data: Promise<LinkTarget[]> } | null = null
export function getAutolinks(): Promise<LinkTarget[]> {
  if (memo && Date.now() - memo.at < 5 * 60_000) return memo.data
  const data = (async () => {
    const payload = await getPayload({ config })
    const all = { limit: 100000, pagination: false as const, depth: 0 }
    const [devs, objs] = await Promise.all([
      payload.find({ collection: 'developers', ...all, select: { name: true, slug: true } }),
      payload.find({ collection: 'objects', ...all, select: { name: true, slug: true } }),
    ])
    const out: LinkTarget[] = []
    const devNames = new Set<string>()
    for (const d of devs.docs) {
      const name = String(d.name || '').replace(/[«»]/g, '').trim()
      if (name.length < 3 || /^(ГК|СЗ|ООО|АО|ПАО)\s/.test(name)) continue
      devNames.add(name)
      out.push({ re: smart(name), href: `/zastroyshchiki/${d.slug}/`, title: name })
    }
    for (const b of BUREAUS) {
      const names = [b.name, ...b.aliases].map((s) => s.replace(/[«»]/g, '').trim())
        .filter((s) => s.length >= 4 && /^[A-ZА-ЯЁ]/.test(s) && !/^(бюро|мастерская|студия)/i.test(s) && !devNames.has(s))
      for (const n of [...new Set(names)]) out.push({ re: smart(n), href: `/arhitektory/${b.key}/`, title: b.name })
    }
    for (const o of objs.docs) {
      const name = String(o.name || '').trim()
      // объекты: латинское название — как есть, кириллическое — только в кавычках («Влюблино»), адреса не связываем
      if (name.length < 4 || /\d|,/.test(name) || devNames.has(name)) continue
      const re = /[а-яё]/i.test(name) ? quoted(name) : bare(name)
      out.push({ re, href: `/obekty/${o.slug}/`, title: name })
    }
    // длинные названия раньше коротких: «Сумма Элементов» не должна стать ссылкой на «Сумму»
    return out.sort((a, b) => b.title.length - a.title.length)
  })()
  memo = { at: Date.now(), data }
  data.catch(() => { memo = null })
  return data
}

const SKIP = /^(a|h[1-6]|figcaption|code|pre|script|style|time)$/i

/** Расставить ссылки в HTML. self — адрес текущей страницы, max — сколько ссылок добавить не больше */
export function autolink(html: string, targets: LinkTarget[], opts: { self?: string; max?: number; used?: Set<string> } = {}): string {
  const max = opts.max ?? 20
  // used можно передать снаружи, чтобы на одной странице из нескольких фрагментов ссылаться на страницу один раз
  const used = opts.used || new Set<string>()
  if (opts.self) used.add(opts.self)
  for (const m of html.matchAll(/<a [^>]*href="(\/[^"#?]*)/g)) used.add(m[1].endsWith('/') ? m[1] : m[1] + '/')
  // токены: теги и текст; текст внутри SKIP-тегов не трогаем
  const parts = html.split(/(<[^>]+>)/)
  const lock: boolean[] = []
  let depth = 0
  for (const p of parts) {
    const t = p.match(/^<(\/?)([a-z0-9]+)/i)
    if (t && SKIP.test(t[2]) && !p.endsWith('/>')) depth += t[1] ? -1 : 1
    lock.push(!!t || depth > 0)
  }
  let added = 0
  for (const tg of targets) {
    if (added >= max) break
    if (used.has(tg.href)) continue
    for (let i = 0; i < parts.length; i++) {
      if (lock[i] || !parts[i]) continue
      const m = parts[i].match(tg.re)
      if (!m || m.index === undefined) continue
      const before = parts[i].slice(0, m.index), hit = m[0], after = parts[i].slice(m.index + hit.length)
      parts.splice(i, 1, before, `<a href="${tg.href}" class="auto">${hit}</a>`, after)
      lock.splice(i, 1, false, true, false)
      used.add(tg.href); added++
      break
    }
  }
  return parts.join('')
}
