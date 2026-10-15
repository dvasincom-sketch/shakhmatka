import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE, ogFor } from '@/lib/ui'
import { cap, getAllObjects, getLandings } from '@/lib/landings'
import { JsonLd } from '@/lib/jsonld'
import { MoscowMap, type MapArea } from '@/lib/moscow-map-ui'
import { MOSCOW_DISTRICTS } from '@/lib/districts'
import { priceText, regionName } from '@/lib/geo'
import { ObjectCard, stageLabel } from '@/lib/ui'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Новостройки Москвы и области по районам, классам и стадиям',
  description: 'Подборки новостроек Москвы и регионов: по районам и округам, по классу жилья и стадии — от купленного участка до сданного дома. Только проверенные данные.',
  alternates: { canonical: `${SITE}/novostroyki/` },
    openGraph: ogFor(`${SITE}/novostroyki/`),
}

export default async function Hub({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const [landings, all, sp] = await Promise.all([getLandings(), getAllObjects(), searchParams])
  // регион: по умолчанию Москва; остальные — переключателем над картой
  const regions = [...all.reduce((m, o) => m.set(o.region || '', (m.get(o.region || '') || 0) + 1), new Map<string, number>())]
    .filter(([r]) => r && r !== 'moscow' && r !== 'russia').sort((a, b) => b[1] - a[1])
  const region = sp.region && regions.some(([r]) => r === sp.region) ? sp.region : 'moscow'
  const switcher = (
    <nav className="reg-sw" aria-label="Регион">
      <Link href="/novostroyki/" className={region === 'moscow' ? 'on' : ''} aria-current={region === 'moscow' ? 'page' : undefined}>Москва<i>{all.filter((o) => o.region === 'moscow').length}</i></Link>
      {regions.map(([r, k]) => <Link key={r} href={`/novostroyki/?region=${r}`} className={region === r ? 'on' : ''} aria-current={region === r ? 'page' : undefined}>{regionName(r)}<i>{k}</i></Link>)}
    </nav>
  )
  if (region !== 'moscow') {
    const objs = all.filter((o) => o.region === region)
    const landing = landings.find((l) => l.group === 'region' && l.key === region)
    return (
      <>
        <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><Link href="/novostroyki/">Новостройки</Link><span>/</span><span>{regionName(region)}</span></nav>
        <h1 className="page-h tt">Новостройки<span>{regionName(region)}</span></h1>
        {switcher}
        <p className="hello-sub">{objs.length} {objs.length === 1 ? 'проект' : objs.length < 5 ? 'проекта' : 'проектов'} из базы Шахматки за пределами Москвы. Основной фокус редакции — Москва; здесь проекты, о которых мы писали или которые ведут московские застройщики.{landing ? <> Подборка со статьями — <Link href={`/novostroyki/${landing.slug}/`}>«{cap(landing.subject)}»</Link>.</> : null}</p>
        <div className="obj-grid">{objs.map((o) => <ObjectCard key={o.id} o={o} />)}</div>
      </>
    )
  }
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
      {switcher}
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
