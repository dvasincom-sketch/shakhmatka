import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE } from '@/lib/ui'
import { cap, getAllObjects, getLandings } from '@/lib/landings'
import { JsonLd } from '@/lib/jsonld'
import { MoscowMap, type MapArea } from '@/lib/moscow-map-ui'
import { MOSCOW_DISTRICTS } from '@/lib/districts'
import { priceText } from '@/lib/geo'
import { stageLabel } from '@/lib/ui'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Новостройки Москвы по районам, классам и стадиям',
  description: 'Подборки новостроек Москвы и регионов: по районам и округам, по классу жилья и стадии — от купленного участка до сданного дома. Только проверенные данные.',
  alternates: { canonical: `${SITE}/novostroyki/` },
}

export default async function Hub() {
  const [landings, all] = await Promise.all([getLandings(), getAllObjects()])
  const n = (l: (typeof landings)[number]) => all.filter(l.match).length
  const districts = landings.filter((l) => l.group === 'district')
  const okrugs = [...new Set(districts.map((d) => d.okrug || 'Другие'))].sort()
  const block = (title: string, items: typeof landings, label: (l: (typeof landings)[number]) => string = (l) => l.label) => {
    const list = items.filter((l) => n(l) > 0)
    return list.length ? (
      <div className="hub-g">
        <p className="f-k">{title}</p>
        <div className="chips wrap">{list.map((l) => <Link key={l.slug} className="chip" href={`/novostroyki/${l.slug}/`}>{label(l)}<i>{n(l)}</i></Link>)}</div>
      </div>
    ) : null
  }
  // данные для карты: по району — подборка, число проектов и пять свежих; НАО и ТАО — целиком, с поселениями
  const areas: Record<string, MapArea> = {}
  const moscow = all.filter((o) => o.region === 'moscow')
  const bySlugKey = new Map(districts.filter((l) => l.key).map((l) => [l.key!, l]))
  for (const [key, d] of Object.entries(MOSCOW_DISTRICTS)) {
    const l = bySlugKey.get(key)
    const objs = moscow.filter((o) => o.district === key)
    const top = objs.slice(0, 5).map((o) => ({
      name: o.name,
      slug: o.slug,
      note: [typeof o.developer === 'object' && o.developer ? o.developer.name : '', stageLabel(o.stage), priceText(o)].filter(Boolean).join(' · ') || undefined,
    }))
    if (d.okrug === 'НАО' || d.okrug === 'ТАО') {
      const a = (areas[d.okrug === 'НАО' ? 'nao' : 'tao'] ||= { n: 0, top: [], parts: [] })
      a.n += objs.length
      a.top = [...a.top, ...top].slice(0, 5)
      if (objs.length && l) a.parts!.push({ label: d.name, slug: l.slug, n: objs.length })
    } else areas[key] = { slug: l?.slug, n: objs.length, top }
  }
  const unplaced = moscow.filter((o) => !o.district || !MOSCOW_DISTRICTS[o.district]).length
  const ld = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Лента', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Новостройки', item: `${SITE}/novostroyki/` }] }
  return (
    <>
      <JsonLd data={ld} />
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><span>Новостройки</span></nav>
      <h1 className="page-h tt">Новостройки<span>по районам и подборкам</span></h1>
      <p className="hello-sub">Все проекты из базы Шахматки, сгруппированные по месту, классу и стадии. Цифра на кнопке — сколько проектов в подборке сейчас.</p>
      <MoscowMap areas={areas} unplaced={unplaced} />
      <p className="krt-links">Территории комплексного развития — в <Link href="/krt/">трекере КРТ</Link>: где решение уже принято и кто застройщик. Как менялась цена с начала продаж — в подборке <Link href="/ceny-na-starte/">«Цена на старте и сейчас»</Link>.</p>
      <div className="hub card">
        {block('Москва', landings.filter((l) => l.slug === 'moskva'), (l) => cap(l.subject))}
        {okrugs.map((o) => <div key={o}>{block(o, districts.filter((d) => (d.okrug || 'Другие') === o))}</div>)}
        {block('Регионы', landings.filter((l) => l.group === 'region' && l.slug !== 'moskva'))}
        {block('По классу', landings.filter((l) => l.group === 'class'))}
        {block('По стадии', landings.filter((l) => l.group === 'stage'))}
      </div>
    </>
  )
}
