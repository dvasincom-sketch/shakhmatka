/**
 * Рассылка «Следить»: что нового у объектов, застройщиков, районов и бюро, на которые подписан читатель.
 * Новое = события досье с датой позже прошлого письма (или подписки), подтверждённые сигналы и материалы, появившиеся на сайте.
 * Запуск: GET /akkaunt/rassylka/?key=<DIGEST_KEY> (внешний cron раз в день) или `npm run digest`.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { BUREAUS } from './architects'
import { esc, sendMail, siteUrl } from './reader'
import { signalHref, signalSlugs } from './signals'
import { districtName, regionName } from './geo'
import { pub } from './public'

type TL = { id?: string | null; date: string; title: string; kind?: string | null; certainty?: string | null; confirmedOn?: string | null }
type ObjLite = { id: number; slug: string; name: string; timeline?: TL[] | null }
type Item = { date: string; text: string; href: string; tag: string }
type Section = { title: string; href: string; items: Item[] }

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const dm = (iso: string) => { const d = new Date(iso); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}${d.getUTCFullYear() !== new Date().getUTCFullYear() ? ` ${d.getUTCFullYear()}` : ''}` }

function objItems(o: ObjLite, since: string): Item[] {
  const sl = signalSlugs(o.slug, o.timeline)
  const out: Item[] = []
  for (const t of o.timeline || []) {
    const href = t.certainty === 'signal' && t.id && sl.get(t.id) ? signalHref(sl.get(t.id)!) : `/obekty/${o.slug}/`
    if (t.date > since) out.push({ date: t.date, text: `${o.name}: ${t.title}`, href, tag: t.certainty === 'signal' ? 'Сигнал' : 'Событие' })
    if (t.confirmedOn && t.confirmedOn > since) out.push({ date: t.confirmedOn, text: `${o.name}: подтвердилось — ${t.title}`, href, tag: 'Подтвердилось' })
  }
  return out
}

export async function buildDigest(readerId: number, sinceGlobal: string): Promise<Section[]> {
  const payload = await getPayload({ config })
  const follows = (await payload.find({ collection: 'follows', where: { and: [{ reader: { equals: readerId } }, { status: { equals: 'active' } }] }, limit: 200, depth: 0, overrideAccess: true })).docs as unknown as { kind: string; key: string; label?: string; createdAt: string }[]
  const sections: Section[] = []
  const objSel = { slug: true, name: true, timeline: true } as const
  const findObjs = async (where: object) => (await payload.find({ collection: 'objects', where: where as never, limit: 500, depth: 0, pagination: false, select: objSel })).docs as unknown as ObjLite[]
  const newArts = async (where: object, since: string) => (await payload.find({ collection: 'articles', where: pub({ and: [{ createdAt: { greater_than: since } }, where] } as never), limit: 6, depth: 0, sort: '-datePublished', select: { slug: true, title: true, datePublished: true } })).docs as unknown as { slug: string; title: string; datePublished?: string }[]
  for (const f of follows) {
    const since = f.createdAt > sinceGlobal ? f.createdAt : sinceGlobal
    let objs: ObjLite[] = [], title = f.label || f.key, href = '/', artWhere: object | null = null
    if (f.kind === 'object') { objs = await findObjs({ slug: { equals: f.key } }); href = `/obekty/${f.key}/`; if (objs[0]) artWhere = { objects: { contains: objs[0].id } } }
    else if (f.kind === 'developer') {
      const d = (await payload.find({ collection: 'developers', where: { slug: { equals: f.key } }, limit: 1, depth: 0 })).docs[0]
      if (d) { objs = await findObjs({ developer: { equals: d.id } }); artWhere = { developers: { contains: d.id } } }
      href = `/zastroyshchiki/${f.key}/`
    } else if (f.kind === 'place') {
      objs = await findObjs(f.key === 'moscow' ? { region: { equals: 'moscow' } } : { or: [{ and: [{ region: { equals: 'moscow' } }, { district: { equals: f.key } }] }, { region: { equals: f.key } }] })
      title = f.label || districtName(f.key) || regionName(f.key) || f.key
      const pl = (await payload.find({ collection: 'places', where: { key: { equals: f.key } }, limit: 1, depth: 0 })).docs[0]
      href = `/novostroyki/${pl?.slug || f.key}/`
    } else if (f.kind === 'bureau') {
      const b = BUREAUS.find((x) => x.key === f.key)
      if (b) { objs = await findObjs({ slug: { in: b.objects.map((o) => o.slug) } }); title = b.name }
      href = `/arhitektory/${f.key}/`
    } else if (f.kind === 'signals') {
      objs = (await findObjs({ signalCount: { greater_than: 0 } })).map((o) => ({ ...o, timeline: (o.timeline || []).filter((t) => t.certainty === 'signal') }))
      title = 'Все сигналы'; href = '/signaly/'
    }
    const items = objs.flatMap((o) => objItems(o, since))
    if (artWhere) for (const a of await newArts(artWhere, since)) items.push({ date: a.datePublished || since, text: a.title, href: `/novosti/${a.slug}/`, tag: 'Материал' })
    items.sort((a, b) => b.date.localeCompare(a.date))
    if (items.length) sections.push({ title, href, items: items.slice(0, 8) })
  }
  return sections
}

function render(sections: Section[], unsubscribe: string) {
  const S = siteUrl()
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1b1b1d;max-width:600px">
<p style="font-size:22px;font-weight:700;margin:0 0 4px">Шахматка</p><p style="color:#777;margin:0 0 18px">Что нового там, где вы следите</p>
${sections.map((s) => `<h2 style="font-size:18px;margin:22px 0 8px"><a href="${S}${s.href}" style="color:#1b1b1d">${esc(s.title)}</a></h2>
<ul style="padding-left:18px;margin:0">${s.items.map((i) => `<li style="margin:0 0 8px"><span style="color:#777">${dm(i.date)} · ${i.tag}</span><br><a href="${S}${i.href}" style="color:#1b1b1d">${esc(i.text)}</a></li>`).join('')}</ul>`).join('')}
<p style="color:#777;font-size:13px;margin-top:28px">Вы получаете это письмо, потому что нажали «Следить» на шахматка.москва. <a href="${S}/akkaunt/" style="color:#777">Настроить подписки</a> · <a href="${unsubscribe}" style="color:#777">Отписаться от рассылки</a></p></div>`
  const text = sections.map((s) => `${s.title}\n${s.items.map((i) => `— ${dm(i.date)}, ${i.tag}: ${i.text} ${S}${i.href}`).join('\n')}`).join('\n\n') + `\n\nНастроить: ${S}/akkaunt/\nОтписаться: ${unsubscribe}`
  return { html, text }
}

export async function runDigest({ dry = false, only }: { dry?: boolean; only?: number } = {}) {
  const payload = await getPayload({ config })
  const readers = (await payload.find({ collection: 'readers', where: { and: [{ confirmed: { equals: true } }, { frequency: { not_equals: 'off' } }, ...(only ? [{ id: { equals: only } }] : [])] }, limit: 10000, depth: 0, pagination: false, overrideAccess: true, showHiddenFields: true })).docs as unknown as { id: number; email: string; frequency: string; lastDigestAt?: string; createdAt: string; unsubscribeKey?: string }[]
  const now = Date.now()
  let sent = 0, empty = 0, skipped = 0
  for (const r of readers) {
    const gap = r.frequency === 'daily' ? 20 * 36e5 : 6.5 * 864e5
    if (r.lastDigestAt && now - new Date(r.lastDigestAt).getTime() < gap) { skipped++; continue }
    const since = r.lastDigestAt || r.createdAt
    const sections = await buildDigest(r.id, since)
    if (!sections.length) { empty++; continue }
    const unsub = `${siteUrl()}/akkaunt/otpiska/?k=${r.unsubscribeKey || ''}`
    const { html, text } = render(sections, unsub)
    const n = sections.reduce((s, x) => s + x.items.length, 0)
    if (!dry) {
      await sendMail(r.email, `Шахматка: ${n} ${n % 10 === 1 && n % 100 !== 11 ? 'новость' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'новости' : 'новостей'} там, где вы следите`, html, text,
        { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' })
      await payload.update({ collection: 'readers', id: r.id, overrideAccess: true, data: { lastDigestAt: new Date().toISOString() } as never })
    }
    sent++
  }
  return { readers: readers.length, sent, empty, skipped, dry }
}
