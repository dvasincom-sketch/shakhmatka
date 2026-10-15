import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SITE, devName, ogFor } from '@/lib/ui'
import { pub } from '@/lib/public'
import { plural } from '@/lib/geo'
import { DevDirectory, type DevRow } from '@/lib/dev-directory'
import { JsonLd } from '@/lib/jsonld'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Застройщики Москвы: проекты, сделки и смены владельцев',
  description: 'Справочник застройщиков Москвы и Подмосковья: сколько проектов у каждого, что продаётся сейчас, кому переходили участки и что о компании писали до официальных новостей.',
  alternates: { canonical: `${SITE}/zastroyshchiki/` },
    openGraph: ogFor(`${SITE}/zastroyshchiki/`),
}

const STAGE_SHORT = [['sales', 'в продаже'], ['completed', 'сданы'], ['permit', 'с разрешением'], ['architecture', 'проект'], ['concept', 'концепция'], ['land', 'участок']] as const
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

export default async function Developers() {
  const payload = await getPayload({ config })
  const [devs, arts, objs] = await Promise.all([
    payload.find({ collection: 'developers', limit: 5000, pagination: false, depth: 0, select: { name: true, slug: true } }),
    payload.find({ collection: 'articles', where: pub(), limit: 5000, pagination: false, depth: 0, select: { developers: true } }),
    payload.find({ collection: 'objects', limit: 10000, pagination: false, depth: 0, sort: '-lastEventAt', select: { name: true, slug: true, developer: true, stage: true, signalCount: true, lastEventAt: true, owners: true } }),
  ])
  const nArt = new Map<unknown, number>()
  arts.docs.forEach((a) => (a.developers || []).forEach((d) => nArt.set(d, (nArt.get(d) || 0) + 1)))
  const byDev = new Map<unknown, typeof objs.docs>()
  objs.docs.forEach((o) => { if (o.developer) byDev.set(o.developer, [...(byDev.get(o.developer) || []), o]) })

  const rows: (DevRow & { stages: Record<string, number> })[] = devs.docs.map((d) => {
    const os = byDev.get(d.id) || []
    const stages: Record<string, number> = {}
    os.forEach((o) => { if (o.stage) stages[o.stage] = (stages[o.stage] || 0) + 1 })
    return {
      slug: d.slug, name: devName(d.name), objects: os.length, selling: stages.sales || 0, articles: nArt.get(d.id) || 0,
      signals: os.reduce((s, o) => s + (o.signalCount || 0), 0), last: os[0]?.lastEventAt || null,
      projects: os.slice(0, 3).map((o) => ({ name: o.name, slug: o.slug })), stages,
    }
  }).filter((r) => r.objects || r.articles)

  const top = [...rows].sort((a, b) => b.objects - a.objects).slice(0, 8)
  const totalObjects = rows.reduce((s, r) => s + r.objects, 0)
  const ownerChanges = objs.docs.filter((o) => (o.owners || []).some((w) => w.since)).length
  const selling = rows.filter((r) => r.selling).length
  const now = new Date()

  const ld = {
    '@type': 'CollectionPage', name: 'Застройщики Москвы', url: `${SITE}/zastroyshchiki/`, inLanguage: 'ru',
    mainEntity: { '@type': 'ItemList', numberOfItems: rows.length, itemListElement: top.map((r, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Organization', name: r.name, url: `${SITE}/zastroyshchiki/${r.slug}/` } })) },
  }

  return (
    <>
      <JsonLd data={ld} />
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><span>Застройщики</span></nav>
      <h1 className="page-h tt">Застройщики<span>кто строит Москву</span></h1>
      <p className="hello-sub">Все компании из досье Шахматки: сколько у кого проектов, что продаётся сейчас и кому переходили участки. Данные на {now.getDate()} {MONTHS[now.getMonth()]} {now.getFullYear()} года.</p>

      <dl className="land-stats dev-stats">
        <div className="card"><dt>Застройщиков</dt><dd>{rows.length}</dd><small>с проектами или материалами</small></div>
        <div className="card"><dt>Проектов в досье</dt><dd>{totalObjects}</dd><small>с известным застройщиком</small></div>
        <div className="card"><dt>Продают сейчас</dt><dd>{selling}</dd><small>есть проект на стадии продаж</small></div>
        <div className="card"><dt>Смена владельца</dt><dd>{ownerChanges}</dd><small>проектов, где известен переход к новому владельцу</small></div>
      </dl>

      <section className="sec" aria-labelledby="h-top">
        <div className="sec-h"><h2 id="h-top" className="tt">Крупнейшие<span>по числу проектов в досье</span></h2></div>
        <ol className="dev-top">
          {top.map((r) => (
            <li key={r.slug}>
              <Link className="dtop card" href={`/zastroyshchiki/${r.slug}/`}>
                <span className="dtop-h"><b>{r.name}</b><span className="dtop-n">{r.objects}<small>{plural(r.objects, 'проект', 'проекта', 'проектов')}</small></span></span>
                <span className="dtop-st" aria-label="Проекты по стадиям">
                  {STAGE_SHORT.filter(([s]) => r.stages[s]).map(([s, label]) => (
                    <span key={s} className={`st-${s}`}><i>{r.stages[s]}</i>{label}</span>
                  ))}
                </span>
                {r.projects.length ? <small className="dtop-p">{r.projects.map((p) => p.name).join(' · ')}</small> : null}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="sec" aria-labelledby="h-all">
        <div className="sec-h"><h2 id="h-all" className="tt">Все застройщики<span>поиск по названию и проектам</span></h2></div>
        <DevDirectory rows={rows.map(({ stages: _s, ...r }) => r)} />
      </section>
    </>
  )
}
