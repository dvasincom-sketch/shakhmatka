import { marked } from 'marked'
import { domainToUnicode } from 'url'

marked.setOptions({ gfm: true })

/** Markdown статьи → HTML для сайта: убирает H1 (он в шапке), пути к фото, блок «Коротко», фигуры, таблицы. */
const COMMERCIAL = /(^|\.)(novostroy-m\.ru|novostroy\.ru|cian\.ru|domclick\.ru|avito\.ru|realty\.yandex\.ru|m2\.ru|whitewill\.ru|kalinka-realty\.ru|incom\.ru|etagi\.com|move\.ru|domofond\.ru|irr\.ru|bnmap\.pro|erzrf\.ru|pik\.ru|samolet\.ru|level\.ru|sminex\.com|mr-group\.ru|donstroy\.com|a101\.ru|kortros\.ru|lsr\.ru|glorax\.com|fsk\.ru|granelle\.ru|etalongroup\.ru|brusnika\.ru|osnova\.ru|capitalgroup\.ru|stone\.ru|pioneer\.ru|forma\.ru)$/i
/** rel для внешней ссылки: noopener всегда, nofollow — для коммерческих сайтов (каталоги, застройщики) */
export function relFor(href: string) {
  let host = ''
  try { host = new URL(href).hostname.replace(/^www\./, '') } catch { return 'noopener nofollow' }
  return COMMERCIAL.test(host) ? 'noopener nofollow' : 'noopener'
}

export function renderArticle(md: string, opts: { skipImage?: string; resolve?: (href: string) => string | null } = {}): string {
  let src = md.replace(/^\s*# .+\n/, '')
  src = src.replace(/\]\(media\/([\w-]+\.(?:jpe?g|png|webp))\)/g, '](/api/media/file/$1)')
  if (opts.skipImage) {
    const re = new RegExp(`!\\[[^\\]]*\\]\\(/api/media/file/${opts.skipImage.replace('.', '\\.')}\\)\\n(\\*[^\\n]*\\*\\n?)?`)
    src = src.replace(re, '')
  }
  let html = marked.parse(src, { async: false }) as string
  html = html.replace(/<p><strong>Коротко<\/strong><\/p>\s*<ul>([\s\S]*?)<\/ul>/, '<section class="short soft"><h2 class="short-h">Коротко</h2><ul>$1</ul></section>')
  html = html.replace(/<p><img src="([^"]+)" alt="([^"]*)">\s*(?:<br>)?\s*<em>([\s\S]*?)<\/em><\/p>/g, '<figure class="fig"><img src="$1" alt="$2" loading="lazy"><figcaption>$3</figcaption></figure>')
  html = html.replace(/<p><img src="([^"]+)" alt="([^"]*)"><\/p>/g, '<figure class="fig"><img src="$1" alt="$2" loading="lazy"></figure>')
  html = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_m, t: string) => `<h2 id="${anchor(t.replace(/&[a-z]+;/g, ''))}">${t}</h2>`)
  html = html.replace(/<table>/g, '<div class="tbl card"><table>').replace(/<\/table>/g, '</table></div>')
  // короткие ячейки (даты, цифры) не переносим, длинные — переносим на широком экране
  html = html.replace(/<td([^>]*)>([^<]{1,22})<\/td>/g, (_m, a: string, t: string) => `<td${a} class="nw">${t}</td>`)
  // голая ссылка → название сайта: «e-disclosure.ru» вместо длинного URL
  html = html.replace(/<a href="(https?:\/\/[^"]+)">([^<]+)<\/a>/g, (m, href: string, text: string) => {
    if (text !== href && !text.startsWith('http')) return m
    let host = href
    try { host = domainToUnicode(new URL(href).hostname).replace(/^www\./, '') } catch {}
    return `<a href="${href}">${host}</a>`
  })
  // кириллические адреса (наш.дом.рф) marked не превращает в ссылки — делаем сами
  html = html.replace(/(^|[\s(>])(https?:\/\/[^\s<]*[^\s<.,;:)])/g, (_m, pre: string, url: string) => {
    let host = url
    try { host = domainToUnicode(new URL(url).hostname).replace(/^www\./, '') } catch {}
    return `${pre}<a href="${url}">${host}</a>`
  })
  // внешние ссылки: новая вкладка; коммерческим каталогам и агрегаторам — nofollow (не передаём им вес и не выглядим как обмен ссылками),
  // официальным источникам и СМИ — обычная ссылка: цитирование первоисточников поисковики считают признаком качества
  html = html.replace(/<a href="(https?:\/\/[^"]+)"/g, (_m, href: string) => `<a href="${href}" target="_blank" rel="${relFor(href)}"`)
  // внутренние ссылки: старые адреса → новые, несуществующие страницы → обычный текст
  if (opts.resolve) {
    html = html.replace(/<a href="(\/[^"]*)"([^>]*)>([\s\S]*?)<\/a>/g, (_m, href: string, rest: string, text: string) => {
      const ok = opts.resolve!(href.replace(/&amp;/g, '&'))
      return ok ? `<a href="${ok.replace(/&/g, '&amp;')}"${rest}>${text}</a>` : text
    })
  }
  return typo(html, true)
}

const TR: Record<string, string> = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' }
export const anchor = (t: string) => t.toLowerCase().replace(/[а-яё]/g, (c) => TR[c] ?? c).replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

/** Оглавление: H2 статьи без служебных разделов */
export function toc(md: string): { id: string; text: string }[] {
  return [...md.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim()).filter((t) => !/^(Источники|Коротко)$/.test(t)).map((text) => ({ id: anchor(text), text }))
}

export const readMinutes = (md: string) => Math.max(1, Math.round(md.replace(/\s+/g, ' ').length / 1500))

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
export const ruDate = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/**
 * Типограф: неразрывные пробелы по правилам русской вёрстки.
 * После коротких слов и предлогов, перед тире, между числом и единицей, «лот 6», «№ 214».
 * Работает с обычной строкой или с HTML (трогает только текст между тегами).
 */
const NB = ' '
const SHORT = 'а|в|во|и|к|ко|о|об|с|со|у|я|на|не|ни|но|по|от|до|из|за|об|для|при|без|про|под|над|что|как|или|ее|её|их|его|ее'
const UNITS = 'млн|млрд|тыс\\.|руб\\.?|₽|м²|м2|га|км|м|%|год[ау]?|г\\.|лет|кв\\.|этаж(?:а|ей)?|квартир|корпус(?:а|ов)?|лот(?:а|ов)?|мин|сек|п\\.п\\.'
const LEAD = '№|лот|корпус|дом|этап|очередь|квартал|ст\\.|ч\\.|п\\.|гл\\.|ФЗ'
function typoText(t: string) {
  return t
    .replace(new RegExp(`(^|[\\s(«"„${NB}])(${SHORT}) `, 'gi'), `$1$2${NB}`)
    .replace(new RegExp(`(^|[\\s(«"„${NB}])(${SHORT}) `, 'gi'), `$1$2${NB}`) // повтор для «и в Москве»
    .replace(/ (—|–) /g, `${NB}$1 `)
    .replace(new RegExp(`(\\d) (${UNITS})(?=[\\s.,;:)»!?]|$)`, 'g'), `$1${NB}$2`)
    .replace(new RegExp(`(^|[\\s(«])(${LEAD}) (\\d)`, 'gi'), `$1$2${NB}$3`)
    .replace(/(\d) (\d{3})(?!\d)/g, `$1${NB}$2`) // 1 068 — разряды
    .replace(/(млн|млрд|тыс\.) (₽|руб)/g, `$1${NB}$2`)
}
export function typo(s: string, html = false): string {
  if (!s) return s
  if (!html) return typoText(s)
  return s.replace(/(^|>)([^<]+)(?=<|$)/g, (_m, gt: string, text: string) => gt + typoText(text))
}

/** Материал обновлялся после первой публикации (разница от суток) */
export const isUpdated = (pub?: string | null, mod?: string | null) =>
  !!pub && !!mod && new Date(mod).getTime() - new Date(pub).getTime() >= 86400000

/** Даты в JSON-LD всегда берём из полей статьи, а не из текста микроразметки */
export function withDates(schema: unknown, pub?: string | null, mod?: string | null): unknown {
  const TYPES = ['NewsArticle', 'Article', 'BlogPosting', 'Report', 'AnalysisNewsArticle']
  const walk = (n: unknown): unknown => {
    if (Array.isArray(n)) return n.map(walk)
    if (!n || typeof n !== 'object') return n
    const o = Object.fromEntries(Object.entries(n as Record<string, unknown>).map(([k, v]) => [k, walk(v)]))
    if (TYPES.includes(String(o['@type']))) {
      if (pub) o.datePublished = pub.slice(0, 10)
      if (mod) o.dateModified = mod.slice(0, 10)
    }
    return o
  }
  return walk(schema)
}
