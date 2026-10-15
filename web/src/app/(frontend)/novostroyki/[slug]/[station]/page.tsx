import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { FollowButton } from '@/lib/follow-button'
import { ObjectCard, SITE, stageLabel } from '@/lib/ui'
import { getAllObjects, getLandings } from '@/lib/landings'
import { plural, priceText } from '@/lib/geo'
import { JsonLd } from '@/lib/jsonld'
import { LineDot, StationLinks, districtStations, lineName, mentionsStation, stationSlug } from '@/lib/metro'

// Следующий уровень после района: новостройки у конкретной станции метро или МЦК
export const dynamic = 'force-dynamic'

async function load(slug: string, station: string) {
  const [landings, all] = await Promise.all([getLandings(), getAllObjects()])
  const l = landings.find((x) => x.slug === decodeURIComponent(slug) && x.group === 'district')
  if (!l) return null
  const key = l.key || l.slug
  const sts = districtStations(key)
  const raw = decodeURIComponent(station)
  const st = sts.find((s) => s.slug === raw) || sts.find((s) => s.name.toLowerCase() === raw.toLowerCase())
  if (!st) return null
  const objs = all.filter(l.match)
  // текст досье: адрес, названия, справка и хронология — по ним ищем упоминание станции
  const payload = await getPayload({ config })
  const full = objs.length ? (await payload.find({ collection: 'objects', where: { id: { in: objs.map((o) => o.id) } }, limit: objs.length, pagination: false, depth: 0, select: { zu: true, name: true, aliases: true, summary: true, timeline: true } })).docs : []
  const text = new Map(full.map((o) => [o.id, [o.zu, o.name, ...(o.aliases || []).map((a) => a.value), o.summary, ...(o.timeline || []).map((t) => `${t.title} ${t.text || ''}`)].filter(Boolean).join(' \n ')]))
  const near = objs.filter((o) => mentionsStation(text.get(o.id) || '', st.name))
  const rest = objs.filter((o) => !near.includes(o))
  return { l, key, st, sts, near, rest, raw }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; station: string }> }): Promise<Metadata> {
  const p = await params
  const d = await load(p.slug, p.station)
  if (!d) return {}
  const title = `Новостройки у станции «${d.st.name}» — ${d.l.label}`
  const description = `${d.near.length ? `${d.near.length} ${plural(d.near.length, 'проект', 'проекта', 'проектов')} у станции «${d.st.name}»` : `Станция «${d.st.name}»`} (${d.st.lines.map(lineName).join(', ')}) в районе ${d.l.label}: стадии, застройщики, цены и сигналы по досье Шахматки.`
  const url = `${SITE}/novostroyki/${d.l.slug}/${d.st.slug}/`
  return { title, description, alternates: { canonical: url }, robots: d.near.length >= 2 ? undefined : { index: false, follow: true } }
}

export default async function StationPage({ params }: { params: Promise<{ slug: string; station: string }> }) {
  const p = await params
  const d = await load(p.slug, p.station)
  if (!d) notFound()
  const { l, st, sts, near, rest, raw } = d
  if (raw !== st.slug) permanentRedirect(`/novostroyki/${l.slug}/${st.slug}/`) // кириллический адрес → латиница
  const others = sts.filter((s) => s.slug !== st.slug)
  const url = `${SITE}/novostroyki/${l.slug}/${st.slug}/`
  const ld = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Новостройки', item: `${SITE}/novostroyki/` },
    { '@type': 'ListItem', position: 2, name: l.label, item: `${SITE}/novostroyki/${l.slug}/` },
    { '@type': 'ListItem', position: 3, name: st.name, item: url },
  ] }
  return (
    <>
      <JsonLd data={ld} />
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><Link href="/novostroyki/">Новостройки</Link><span>/</span><Link href={`/novostroyki/${l.slug}/`}>{l.label}</Link><span>/</span><span>{st.name}</span></nav>
      <h1 className="page-h tt">Новостройки у станции «{st.name}»<span>{l.label}</span></h1>
      <p className="st-head">{st.lines.map((ln) => <span key={ln} className="st-line"><LineDot line={ln} size={14} />{lineName(ln)}</span>)}</p>
      <FollowButton kind="place" id={l.key || l.slug} label={l.label} hint="Новые проекты, старты продаж, КРТ и сигналы в этом районе." />

      <section className="sec" aria-labelledby="h-near">
        <div className="sec-h"><h2 id="h-near" className="tt">У станции<span>{near.length ? `${near.length} ${plural(near.length, 'проект', 'проекта', 'проектов')}, в досье которых упоминается «${st.name}»` : 'в досье района пока нет проектов с упоминанием станции'}</span></h2></div>
        {near.length ? <div className="obj-grid">{near.map((o) => <ObjectCard key={o.id} o={o} />)}</div> : null}
      </section>

      {rest.length ? (
        <section className="sec" aria-labelledby="h-rest">
          <div className="sec-h"><h2 id="h-rest" className="tt">Ещё в районе<span>{rest.length} {plural(rest.length, 'проект', 'проекта', 'проектов')} — {l.label}</span></h2><Link className="more" href={`/novostroyki/${l.slug}/`}>Весь район</Link></div>
          <ul className="st-rest card">
            {rest.slice(0, 30).map((o) => <li key={o.id}><Link href={`/obekty/${o.slug}/`}>{o.name}</Link><span>{[stageLabel(o.stage), priceText(o)].filter(Boolean).join(' · ')}</span></li>)}
          </ul>
        </section>
      ) : null}

      {others.length ? (
        <section className="sec" aria-labelledby="h-st">
          <div className="sec-h"><h2 id="h-st" className="tt">Другие станции района<span>{l.label}</span></h2></div>
          <div className="card st-card"><StationLinks district={l.slug} stations={others} /></div>
        </section>
      ) : null}
      <p className="note">Проект попадает к станции, если её название есть в адресе или в досье («у метро …», «рядом с МЦК …»). Станции распределены по районам по координатам OpenStreetMap.</p>
    </>
  )
}
