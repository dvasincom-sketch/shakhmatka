import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Media, Object as Obj, Place } from '@/payload-types'

/** Объект для карточки: без хронологии и галереи, с готовой обложкой */
export type CardObj = Obj & { cover?: Media }
import { plural } from './geo'
import { STATIC } from './landing-static'

/**
 * Посадочные страницы /novostroyki/<slug>/: районы и регионы (из коллекции places), классы и стадии (заданы здесь).
 * subject — фраза для заголовков и вопросов: «новостройки в Хорошёво-Мнёвниках».
 */
export type Landing = {
  slug: string
  /** Ключ места (район/регион) — как в объектах; у классов и стадий нет */
  key?: string
  group: 'district' | 'region' | 'class' | 'stage'
  label: string // коротко, для чипов: «Хорошёво-Мнёвники», «Премиум»
  subject: string
  note?: string // подпись под H1: «СЗАО, Москва»
  intro?: string
  okrug?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  forceIndex?: boolean | null
  /** Ссылка на тот же набор в каталоге с фильтрами */
  catalog: string
  match: (o: Obj) => boolean
  /** Статьи подборки помимо статей об её объектах: адреса, ссылка на которые в тексте значит «материал про это место», и код региона статьи */
  mentions?: string[]
  articleRegion?: string
}

export async function getLandings(): Promise<Landing[]> {
  const payload = await getPayload({ config })
  const places = (await payload.find({ collection: 'places', limit: 1000, pagination: false, sort: 'name' })).docs as Place[]
  const fromPlaces: Landing[] = places.map((p) => ({
    slug: p.slug,
    key: p.key,
    group: p.kind === 'district' ? 'district' : 'region',
    label: p.name,
    subject: `новостройки ${p.nameIn}`,
    note: p.kind === 'district' ? [p.okrug, 'Москва'].filter(Boolean).join(', ') : undefined,
    intro: p.intro || undefined,
    okrug: p.okrug,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    forceIndex: p.forceIndex,
    catalog: p.kind === 'district' ? `/obekty/?geo=moscow&district=${p.key}` : p.key === 'moscow' ? '/obekty/?geo=moscow' : '/obekty/?geo=regions',
    match: p.kind === 'district' ? (o) => o.region === 'moscow' && o.district === p.key : (o) => o.region === p.key,
    mentions: [`/novostroyki/${p.slug}/`, p.kind === 'district' ? `/moskva/${p.slug}/` : `/regiony/${p.slug}/`],
    articleRegion: p.kind === 'region' && p.key !== 'moscow' ? p.key : undefined,
  }))
  // классы и стадии — по Москве: так их ищут, а регионам хватает своих страниц
  return [...fromPlaces, ...STATIC.map((l) => ({ ...l, match: (o: Obj) => o.region === 'moscow' && l.match(o) }))]
}

/** Поля карточки объекта — без хронологии: в подборках и каталоге она не нужна, а весит больше всего */
export const CARD_SELECT = {
  name: true, slug: true, zu: true, stage: true, region: true, district: true, class: true, priceFrom: true, priceM2From: true,
  priceAsOf: true, completion: true, developer: true, lastEventAt: true, signalCount: true, gallery: true,
} as const

/** Объекты для карточек: без хронологии, застройщики подставляются одним запросом (depth 1 на сотнях объектов медленный) */
export async function findCards(where?: import('payload').Where) {
  const payload = await getPayload({ config })
  const [objs, devs] = await Promise.all([
    payload.find({ collection: 'objects', where, limit: 10000, depth: 0, pagination: false, sort: '-lastEventAt', select: CARD_SELECT }),
    payload.find({ collection: 'developers', limit: 10000, depth: 0, pagination: false, select: { name: true, slug: true } }),
  ])
  const byId = new Map(devs.docs.map((d) => [d.id, d]))
  // обложка карточки — первое фото галереи, уменьшенная копия (card); тоже одним запросом
  const firstId = (o: { gallery?: unknown[] | null }) => { const g = o.gallery?.[0]; return typeof g === 'object' && g ? (g as { id: number }).id : (g as number | undefined) }
  const coverIds = [...new Set(objs.docs.map(firstId).filter((x): x is number => x != null))]
  const media = coverIds.length
    ? (await payload.find({ collection: 'media', where: { id: { in: coverIds } }, limit: coverIds.length, depth: 0, pagination: false, select: { url: true, alt: true, sizes: true } })).docs
    : []
  const mById = new Map(media.map((m) => [m.id, m]))
  return objs.docs.map((o) => {
    const m = mById.get(firstId(o) as number) as (Media & { sizes?: { card?: { url?: string | null } } }) | undefined
    const cover = m ? ({ ...m, url: m.sizes?.card?.url || m.url } as Media) : undefined
    return { ...o, gallery: undefined, cover, developer: o.developer != null ? byId.get(o.developer as number) ?? o.developer : o.developer }
  }) as CardObj[]
}

// Все карточки нужны каталогу, подборкам и указателю: держим в памяти процесса минуту, чтобы не собирать на каждый запрос
let memo: { at: number; data: Promise<Obj[]> } | null = null
export const getAllObjects = cache(() => {
  if (!memo || Date.now() - memo.at > 60_000) {
    const data = findCards()
    memo = { at: Date.now(), data }
    data.catch(() => { memo = null })
  }
  return memo.data
})

/** Открываем для поиска, только когда странице есть что показать: иначе Яндекс сочтёт её малоценной */
export const indexable = (l: Landing, n: number) => !!l.forceIndex || n >= 2 || (l.intro?.length || 0) >= 400

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** «I кв. 2030» → 20301 для сортировки; не распознали — в конец */
const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 }
export function completionKey(s?: string | null) {
  const m = s?.match(/\b(IV|III|II|I)\s*кв\.?\s*(\d{4})/)
  if (m) return +m[2] * 10 + ROMAN[m[1]]
  const y = s?.match(/(\d{4})/)
  return y ? +y[1] * 10 + 5 : Infinity
}

const n1 = (x: number) => x.toLocaleString('ru-RU', { maximumFractionDigits: 1 })

export function stats(objs: Obj[]) {
  const priced = objs.filter((o) => o.priceFrom).sort((a, b) => a.priceFrom! - b.priceFrom!)
  const done = objs.filter((o) => o.completion).sort((a, b) => completionKey(a.completion) - completionKey(b.completion))
  return { cheapest: priced[0], priced, soonest: done[0], done }
}

export function metaFor(l: Landing, objs: Obj[]) {
  const S = cap(l.subject)
  const { cheapest, soonest } = stats(objs)
  const cnt = `${objs.length} ${plural(objs.length, 'проект', 'проекта', 'проектов')}`
  const title = l.metaTitle || (cheapest ? `${S}: цены от ${n1(cheapest.priceFrom!)} млн ₽ и сроки сдачи` : `${S}: ${cnt}, стадии и сроки сдачи`)
  const parts = [`${S} в базе Шахматки: ${cnt}${objs.length ? ` — ${objs.slice(0, 3).map((o) => `«${o.name}»`).join(', ')}${objs.length > 3 ? ' и другие' : ''}` : ''}.`]
  if (cheapest) parts.push(`Квартиры от ${n1(cheapest.priceFrom!)} млн ₽.`)
  if (soonest) parts.push(`Ближайший ввод — ${soonest.completion}.`)
  parts.push('Проверенные цены, застройщики и стадии.')
  // собираем описание целыми фразами, не длиннее 160 знаков
  let description = l.metaDescription || ''
  if (!description) for (const p of parts) { const next = description ? `${description} ${p}` : p; if (next.length <= 160 || !description) description = next }
  return { title, description }
}

const median = (xs: number[]) => { const a = [...xs].sort((x, y) => x - y); const k = Math.floor(a.length / 2); return a.length % 2 ? a[k] : (a[k - 1] + a[k]) / 2 }
const devOf = (o: Obj) => { const d = o.developer as { name?: string } | number | null | undefined; return typeof d === 'object' && d?.name ? d.name : null }
const list = (xs: string[], n = 5) => xs.slice(0, n).join(', ') + (xs.length > n ? ` и ещё ${xs.length - n}` : '')

/**
 * Вопросы и ответы подборки. Для районов — аналитика по базе: что продаётся и что на подходе, кто строит, цена метра
 * на фоне Москвы, сроки ввода, проекты без новостей, станции. Вопрос попадает в блок, только если данных хватает на содержательный ответ.
 */
export function faqFor(l: Landing, objs: Obj[], stageLabel: (s?: string | null) => string | undefined, ctx: { all?: Obj[]; stations?: string[] } = {}) {
  const { cheapest, priced, done } = stats(objs)
  const out: { q: string; a: string }[] = []
  if (!objs.length) return out
  const where = l.group === 'district' ? l.subject.replace(/^новостройки\s+/, '') : l.subject
  if (l.group !== 'district') {
    out.push({ q: `Какие ${l.subject} есть в базе Шахматки?`, a: objs.slice(0, 8).map((o) => `«${o.name}» — ${(stageLabel(o.stage) || 'стадия уточняется').toLowerCase()}`).join('; ') + (objs.length > 8 ? ` и ещё ${objs.length - 8}.` : '.') })
    if (cheapest) out.push({ q: `Сколько стоят ${l.subject}?`, a: `Самая низкая цена квартиры среди проектов с открытыми ценами — от ${n1(cheapest.priceFrom!)} млн ₽ в «${cheapest.name}»${cheapest.priceAsOf ? ` (${cheapest.priceAsOf})` : ''}. Цена известна у ${priced.length} из ${objs.length} проектов.` })
    if (done.length) out.push({ q: `Когда сдадут ${l.subject}?`, a: done.slice(0, 6).map((o) => `«${o.name}» — ${o.completion}`).join('; ') + '. Сроки — по данным застройщика и проектной декларации на дату проверки.' })
    return out
  }
  const by = (st: string) => objs.filter((o) => o.stage === st)
  const sales = by('sales'), permit = by('permit'), early = objs.filter((o) => ['land', 'concept', 'architecture'].includes(o.stage || ''))
  const named = (xs: Obj[]) => xs.map((o) => `«${o.name}»${devOf(o) ? ` (${devOf(o)})` : ''}`)
  // 1. что продаётся и что на подходе
  if (sales.length || permit.length)
    out.push({
      q: `Что сейчас продаётся ${where} и что выйдет в продажу следующим?`,
      a: [sales.length ? `В продаже ${sales.length} ${plural(sales.length, 'проект', 'проекта', 'проектов')}: ${list(named(sales))}.` : 'Сейчас в базе нет проектов района в продаже.',
        permit.length ? `Ещё у ${permit.length} ${plural(permit.length, 'проекта', 'проектов', 'проектов')} есть разрешение на строительство, но продажи не стартовали: ${list(named(permit))} — это ближайшие кандидаты на старт продаж.` : '',
      ].filter(Boolean).join(' '),
    })
  // 2. будущее района
  if (early.length >= 2) {
    const c = (st: string) => objs.filter((o) => o.stage === st).length
    const krt = objs.filter((o) => /КРТ|ТПУ|промзон/i.test(o.name))
    const sig = [...early].sort((a, b) => (b.signalCount || 0) - (a.signalCount || 0)).filter((o) => o.signalCount).slice(0, 3)
    out.push({
      q: `Что построят ${where} в ближайшие годы?`,
      a: `До стройки ещё не дошли ${early.length} ${plural(early.length, 'проект', 'проекта', 'проектов')}: ${[c('land') && `${c('land')} — участки`, c('concept') && `${c('concept')} — концепции`, c('architecture') && `${c('architecture')} — архитектура (АГР или проект)`].filter(Boolean).join(', ')}.`
        + (krt.length ? ` Среди них территории КРТ и ТПУ: ${list(krt.map((o) => `«${o.name}»`), 4)}.` : '')
        + (sig.length ? ` Больше всего ранних сигналов у ${sig.map((o) => `«${o.name}» (${o.signalCount})`).join(', ')} — это проекты, о которых рынок говорил до официальных новостей.` : ''),
    })
  }
  // 3. кто строит
  const devs = new Map<string, number>()
  objs.forEach((o) => { const d = devOf(o); if (d) devs.set(d, (devs.get(d) || 0) + 1) })
  const top = [...devs].sort((a, b) => b[1] - a[1])
  if (top.length >= 2) {
    const withDev = top.reduce((s, x) => s + x[1], 0), top3 = top.slice(0, 3).reduce((s, x) => s + x[1], 0)
    out.push({
      q: `Кто строит ${where} больше всего?`,
      a: `Застройщик известен у ${withDev} из ${objs.length} проектов. Лидеры: ${top.slice(0, 5).map(([n, k]) => `${n} — ${k}`).join(', ')}. На тройку крупнейших приходится ${Math.round((top3 / withDev) * 100)}% проектов с известным застройщиком${top3 / withDev > 0.5 ? ' — рынок района заметно сконцентрирован' : ' — рынок района раздроблен'}.`,
    })
  }
  // 4. цена метра на фоне Москвы
  const m2 = objs.filter((o) => o.priceM2From).map((o) => o.priceM2From!)
  const allM2 = (ctx.all || []).filter((o) => o.region === 'moscow' && o.priceM2From).map((o) => o.priceM2From!)
  if (m2.length >= 2 && allM2.length >= 20) {
    const md = median(m2), mm = median(allM2), d = (md / mm - 1) * 100
    out.push({
      q: `Сколько стоит метр в новостройках ${where} по сравнению с Москвой?`,
      a: `Медиана стартовой цены за метр по ${m2.length} ${plural(m2.length, 'проекту', 'проектам', 'проектам')} района с открытой ценой — ${Math.round(md).toLocaleString('ru-RU')} тыс. ₽, по ${allM2.length} проектам Москвы в базе — ${Math.round(mm).toLocaleString('ru-RU')} тыс. ₽: район ${Math.abs(d) < 5 ? 'на уровне города' : d > 0 ? `дороже на ${Math.round(d)}%` : `дешевле на ${Math.round(-d)}%`}. Сравниваются цены «от» на разные даты, поэтому это ориентир, а не оценка конкретной квартиры.`,
    })
  } else if (cheapest) out.push({ q: `Сколько стоят квартиры в новостройках ${where}?`, a: `Самый доступный вход среди проектов с открытыми ценами — от ${n1(cheapest.priceFrom!)} млн ₽ в «${cheapest.name}»${cheapest.priceAsOf ? ` (${cheapest.priceAsOf})` : ''}. Открытые цены есть у ${priced.length} из ${objs.length} проектов: у остальных стадия ещё до продаж или застройщик цену не публикует.` })
  // 5. ввод
  const soon = objs.filter((o) => o.stage !== 'completed' && o.completion && completionKey(o.completion) !== Infinity).sort((a, b) => completionKey(a.completion) - completionKey(b.completion))
  if (soon.length)
    out.push({ q: `Какие новостройки ${where} сдадут первыми?`, a: `По проектным декларациям и данным застройщиков: ${soon.slice(0, 5).map((o) => `«${o.name}» — ${o.completion}`).join('; ')}.${soon.length > 5 ? ` Всего срок ввода известен у ${soon.length} строящихся проектов.` : ''} Сроки в декларациях переносят — следите за изменениями в досье.` })
  // 6. давно без новостей
  const cut = Date.now() - 3 * 365.25 * 864e5
  const stale = objs.filter((o) => o.stage !== 'completed' && o.lastEventAt && +new Date(o.lastEventAt as string) < cut)
  if (stale.length)
    out.push({ q: `Есть ли ${where} замершие проекты?`, a: `По ${stale.length} ${plural(stale.length, 'проекту', 'проектам', 'проектам')} в досье нет новостей больше трёх лет: ${list(stale.map((o) => `«${o.name}» (последнее событие — ${String(o.lastEventAt).slice(0, 4)})`), 4)}. Это не значит, что проект заморожен, но перед покупкой стоит проверить разрешение и стройку по наш.дом.рф.` })
  // 7. метро
  if (ctx.stations?.length)
    out.push({ q: `Какие станции метро и МЦК есть ${where}?`, a: `${ctx.stations.length} ${plural(ctx.stations.length, 'станция', 'станции', 'станций')}: ${ctx.stations.join(', ')}. У каждой станции есть своя подборка проектов поблизости — ссылки в блоке «Район в цифрах».` })
  return out
}
