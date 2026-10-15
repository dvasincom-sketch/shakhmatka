import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getLandings, indexable } from '@/lib/landings'
import { pub } from '@/lib/public'
import { signalHref, signalSlugs } from '@/lib/signals'
import { BUREAUS } from '@/lib/architects'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'

// Кириллический домен в sitemap отдаём в punycode: так требуют протокол Sitemaps и Яндекс Вебмастер
const ORIGIN = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://шахматка.москва').origin

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const [arts, objs, devs] = await Promise.all([
    payload.find({ collection: 'articles', where: pub(), limit: 50000, depth: 0, pagination: false, select: { slug: true, dateModified: true, datePublished: true, updatedAt: true } }),
    payload.find({ collection: 'objects', limit: 50000, depth: 0, pagination: false, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: 'developers', limit: 50000, depth: 0, pagination: false, select: { slug: true, updatedAt: true } }),
  ])
  const landings = await getLandings()
  const objAll = (await payload.find({ collection: 'objects', limit: 50000, depth: 0, pagination: false, select: { region: true, district: true, stage: true, class: true, priceFrom: true } })).docs as never[]
  const sigObjs = (await payload.find({ collection: 'objects', where: { signalCount: { greater_than: 0 } }, limit: 50000, depth: 0, pagination: false, select: { slug: true, timeline: true } })).docs
  const sigs = sigObjs.flatMap((o) => {
    const m = signalSlugs(o.slug as string, o.timeline as never)
    return ((o.timeline || []) as { id?: string | null; certainty?: string | null; outcome?: string | null; confirmedOn?: string | null }[])
      .filter((t) => t.certainty === 'signal' && !t.outcome && t.id && m.get(t.id))
      .map((t) => ({ url: `${ORIGIN}${signalHref(m.get(t.id!)!)}`, lastModified: t.confirmedOn ? new Date(t.confirmedOn) : undefined, changeFrequency: 'monthly' as const, priority: 0.4 }))
  })
  const land = landings.filter((l) => indexable(l, objAll.filter(l.match).length))
  const d = (...v: (string | null | undefined)[]) => { const x = v.find(Boolean); return x ? new Date(x) : undefined }
  const last = arts.docs.map((a) => d(a.dateModified, a.datePublished)).filter(Boolean).sort((a, b) => +b! - +a!)[0]
  return [
    { url: `${ORIGIN}/`, lastModified: last, changeFrequency: 'hourly', priority: 1 },
    { url: `${ORIGIN}/novosti/`, lastModified: last, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${ORIGIN}/obekty/`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${ORIGIN}/novostroyki/`, changeFrequency: 'daily', priority: 0.9 },
    ...land.map((l) => ({ url: `${ORIGIN}/novostroyki/${l.slug}/`, changeFrequency: 'daily' as const, priority: 0.8 })),
    { url: `${ORIGIN}/zastroyshchiki/`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${ORIGIN}/arhitektory/`, changeFrequency: 'weekly', priority: 0.6 },
    ...BUREAUS.filter((b) => b.objects.length + b.articles.length >= 2).map((b) => ({ url: `${ORIGIN}/arhitektory/${b.key}/`, changeFrequency: 'monthly' as const, priority: 0.4 })),
    { url: `${ORIGIN}/pro/`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${ORIGIN}/o-proekte/`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${ORIGIN}/ceny-na-starte/`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${ORIGIN}/krt/`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${ORIGIN}/signaly/`, changeFrequency: 'daily', priority: 0.7 },
    ...arts.docs.map((a) => ({ url: `${ORIGIN}/novosti/${a.slug}/`, lastModified: d(a.dateModified, a.datePublished, a.updatedAt), changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...objs.docs.map((o) => ({ url: `${ORIGIN}/obekty/${o.slug}/`, lastModified: d(o.updatedAt), changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...sigs,
    ...devs.docs.map((x) => ({ url: `${ORIGIN}/zastroyshchiki/${x.slug}/`, lastModified: d(x.updatedAt), changeFrequency: 'weekly' as const, priority: 0.5 })),
  ]
}
