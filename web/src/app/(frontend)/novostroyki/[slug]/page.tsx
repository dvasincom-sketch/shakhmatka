import type { Metadata } from 'next'
import Link from 'next/link'
import { FollowButton } from '@/lib/follow-button'
import { notFound } from 'next/navigation'
import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import { DISTRICT_STATS } from '@/lib/district-stats'
import { BUREAUS } from '@/lib/architects'
import { TROUBLE, TROUBLE_BADGE } from '@/lib/trouble'
import { CLASS_LABELS } from '@/lib/geo'
import { ArticleCard, ObjectCard, SITE, STAGES, StageStrip, stageLabel, coverOf, devName } from '@/lib/ui'
import { plural } from '@/lib/geo'
import { cap, faqFor, getAllObjects, getLandings, indexable, metaFor, stats } from '@/lib/landings'
import { pub } from '@/lib/public'
import type { Media } from '@/payload-types'
import { JsonLd } from '@/lib/jsonld'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'

async function load(slug: string) {
  const [landings, all] = await Promise.all([getLandings(), getAllObjects()])
  const l = landings.find((x) => x.slug === decodeURIComponent(slug))
  if (!l) return null
  return { l, landings, all, objs: all.filter(l.match) }
}

/** Сколько карточек показываем в подборке; остальное — в каталоге */
const LAND_CARDS = 24

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = await load((await params).slug)
  if (!d) return {}
  const { title, description } = metaFor(d.l, d.objs)
  const url = `${SITE}/novostroyki/${d.l.slug}/`
  return {
    title: { absolute: `${title} | Шахматка`.length > 70 ? `${title.replace(/ и сроки сдачи$/, '')} | Шахматка` : `${title} | Шахматка` },
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, title, description, locale: 'ru_RU', siteName: 'Шахматка', images: [{ url: '/og-default.png', width: 1200, height: 630 }] },
    robots: indexable(d.l, d.objs.length) ? undefined : { index: false, follow: true },
  }
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const d = await load((await params).slug)
  if (!d) notFound()
  const { l, landings, all, objs } = d
  const payload = await getPayload({ config })
  const ids = objs.map((o) => o.id)
  const or: Where[] = [
    ...(ids.length ? [{ objects: { in: ids } }] : []),
    ...(l.mentions || []).map((m) => ({ body: { like: m } })),
    ...(l.articleRegion ? [{ region: { equals: l.articleRegion } }] : []),
  ]
  // материалы о самом районе (серия «Районы»: история, парки) — по метке темы rayon-<ключ района>
  const districtKey = l.group === 'district' ? l.slug : undefined
  const stories = districtKey ? (await payload.find({ collection: 'articles', where: pub({ 'topics.value': { equals: `rayon-${districtKey}` } }), sort: '-datePublished', limit: 6, depth: 1 })).docs : []
  const arts = or.length ? (await payload.find({ collection: 'articles', where: pub({ or }), sort: '-datePublished', limit: 12, depth: 1 })).docs : []
  const img = (id: number) => coverOf(arts.find((a) => (a.objects || []).some((o) => (typeof o === 'object' ? o.id : o) === id) && coverOf(a.heroImage))?.heroImage)
  const { cheapest, priced, soonest } = stats(objs)
  const faq = faqFor(l, objs, stageLabel)
  const H = cap(l.subject)
  const url = `${SITE}/novostroyki/${l.slug}/`
  const n1 = (x: number) => x.toLocaleString('ru-RU', { maximumFractionDigits: 1 })

  // Перелинковка: соседи по группе (для района — сначала тот же округ), потом подборки других типов
  const count = (x: typeof l) => all.filter(x.match).length
  const same = landings.filter((x) => x.slug !== l.slug && x.group === l.group && count(x) > 0)
    .sort((a, b) => Number(b.okrug === l.okrug) - Number(a.okrug === l.okrug) || count(b) - count(a))
  const other = landings.filter((x) => x.group !== l.group && count(x) > 0 && !(l.group !== 'region' && x.group === 'region' && x.slug !== 'moskva')).slice(0, 8)

  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Лента', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Новостройки', item: `${SITE}/novostroyki/` },
        ...(l.group === 'district' ? [{ '@type': 'ListItem', position: 3, name: 'Москва', item: `${SITE}/novostroyki/moskva/` }] : []),
        { '@type': 'ListItem', position: l.group === 'district' ? 4 : 3, name: H, item: url },
      ],
    },
    {
      '@context': 'https://schema.org', '@type': 'ItemList', name: H, numberOfItems: objs.length,
      itemListElement: objs.slice(0, LAND_CARDS).map((o, i) => ({ '@type': 'ListItem', position: i + 1, name: o.name, url: `${SITE}/obekty/${o.slug}/` })),
    },
    ...(faq.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : []),
  ]

  return (
    <>
      <JsonLd data={ld} />
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><Link href="/novostroyki/">Новостройки</Link><span>/</span>{l.group === 'district' ? <><Link href="/novostroyki/moskva/">Москва</Link><span>/</span></> : null}<span>{l.label}</span></nav>
      <h1 className="page-h tt">{H}{l.note ? <span>{l.note}</span> : null}</h1>
      {l.group === 'district' || l.group === 'region' ? <FollowButton kind="place" id={l.key || l.slug} label={l.label} hint="Новые проекты, старты продаж, КРТ и сигналы в этом районе." /> : null}
      {l.intro ? <div className="land-intro">{l.intro.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</div> : null}

      {objs.length ? <dl className="land-stats">
        <div className="card"><dt>Проектов в базе</dt><dd>{objs.length}</dd></div>
        <div className="card"><dt>Цена квартиры</dt><dd>{cheapest ? `от ${n1(cheapest.priceFrom!)} млн ₽` : '—'}</dd>{cheapest ? <small>«{cheapest.name}»{priced.length > 1 ? `, цена известна у ${priced.length}` : ''}</small> : <small>цены пока не публикуются</small>}</div>
        <div className="card"><dt>Ближайший ввод</dt><dd>{soonest?.completion || '—'}</dd>{soonest ? <small>«{soonest.name}»</small> : null}</div>
        <div className="card"><dt>По стадиям</dt><dd className="land-stages">
          {STAGES.map((s) => { const k = objs.filter((o) => o.stage === s.value).length; return k ? <span key={s.value}><StageStrip stage={s.value} />{s.label}<b>{k}</b></span> : null })}
        </dd></div>
      </dl> : null}

      {l.group === 'district' && objs.length ? (() => {
        const ds = DISTRICT_STATS[l.key || '']
        const devCount = new Map<string, { name: string; slug: string; n: number }>()
        objs.forEach((o) => { const d = o.developer as { name?: string; slug?: string } | undefined; if (d?.slug) { const c = devCount.get(d.slug) || { name: devName(d.name), slug: d.slug, n: 0 }; c.n++; devCount.set(d.slug, c) } })
        const topDevs = [...devCount.values()].sort((a, b) => b.n - a.n).slice(0, 5)
        const slugs = new Set(objs.map((o) => o.slug))
        const bureaus = BUREAUS.filter((b) => b.kind === 'architecture').map((b) => ({ b, n: b.objects.filter((x) => slugs.has(x.slug)).length })).filter((x) => x.n).sort((a, b) => b.n - a.n).slice(0, 5)
        const classes = (['comfort', 'business', 'premium', 'deluxe'] as const).map((c) => ({ c, n: objs.filter((o) => o.class === c).length })).filter((x) => x.n)
        const sig = objs.reduce((s, o) => s + (o.signalCount || 0), 0)
        const future = objs.filter((o) => ['land', 'concept', 'architecture', 'permit'].includes(o.stage || '')).length
        const troubled = objs.filter((o) => TROUBLE[o.slug])
        const lines = ds?.stations ? [...new Set(ds.stations.flatMap((st) => st.lines))] : []
        return (
          <section className="sec" aria-labelledby="h-fig">
            <div className="sec-h"><h2 id="h-fig" className="tt">Район в цифрах<span>по базе Шахматки{ds?.population ? ' и открытым данным' : ''}</span></h2></div>
            <div className="dfig">
              {ds?.population ? <div className="card"><p className="f-k">Население</p><p className="dfig-n">{ds.population.toLocaleString('ru-RU')}</p><small>{ds.populationYear}{ds.areaKm2 ? ` · ${String(ds.areaKm2).replace('.', ',')} км² · ${Math.round(ds.population / ds.areaKm2).toLocaleString('ru-RU')} чел./км²` : ''}{ds.populationSource ? <> · <a className="muted-link" href={ds.populationSource} target="_blank" rel="noopener">источник</a></> : null}</small></div> : null}
              {ds?.stations?.length ? <div className="card"><p className="f-k">Метро, МЦК, МЦД</p><p className="dfig-n">{ds.stations.length} {plural(ds.stations.length, 'станция', 'станции', 'станций')}</p><small>{lines.length} {plural(lines.length, 'линия', 'линии', 'линий')}: {ds.stations.map((st) => st.name).join(', ')}</small></div> : null}
              <div className="card"><p className="f-k">Будущие проекты</p><p className="dfig-n">{future}</p><small>участки, концепции, архитектура и разрешения — то, что ещё не продаётся</small></div>
              {sig ? <div className="card"><p className="f-k">Сигналы</p><p className="dfig-n">{sig}</p><small>сообщений о проектах района до официальных новостей</small></div> : null}
              {topDevs.length ? <div className="card dfig-list"><p className="f-k">Кто строит</p><ol>{topDevs.map((d) => <li key={d.slug}><Link href={`/zastroyshchiki/${d.slug}/`}>{d.name}</Link><b>{d.n}</b></li>)}</ol></div> : null}
              {classes.length ? <div className="card dfig-list"><p className="f-k">Классы</p><ol>{classes.map((x) => <li key={x.c}><Link href={`/obekty/?geo=moscow&district=${l.key}&class=${x.c}`}>{CLASS_LABELS[x.c]}</Link><b>{x.n}</b></li>)}</ol><small>заявленный класс, есть не у всех проектов</small></div> : null}
              {bureaus.length ? <div className="card dfig-list"><p className="f-k">Архитекторы</p><ol>{bureaus.map((x) => <li key={x.b.key}><Link href={`/arhitektory/${x.b.key}/`}>{x.b.name}</Link><b>{x.n}</b></li>)}</ol></div> : null}
              {troubled.length ? <div className="card dfig-list dfig-tr"><p className="f-k">Проблемные и бывшие долгострои</p><ol>{troubled.map((o) => <li key={o.slug}><Link href={`/obekty/${o.slug}/`}>{o.name}</Link><i className={`tr-badge tr-${TROUBLE[o.slug].status}`}>{TROUBLE_BADGE[TROUBLE[o.slug].status]}</i></li>)}</ol></div> : null}
            </div>
          </section>
        )
      })() : null}

      {objs.length ? (
      <section className="sec" aria-labelledby="h-objs">
        <div className="sec-h"><h2 id="h-objs" className="tt">{objs.length} {plural(objs.length, 'проект', 'проекта', 'проектов')}<span>от участка до ключей</span></h2><Link className="more" href={l.catalog}>В каталоге с фильтрами</Link></div>
        {objs.length ? (
          <>
            <div className="obj-grid land-grid">{objs.slice(0, LAND_CARDS).map((o) => <ObjectCard key={o.id} o={o} im={img(o.id)} />)}</div>
            {objs.length > LAND_CARDS ? <Link className="land-cta card" href={l.catalog}><span>Ещё {objs.length - LAND_CARDS} {plural(objs.length - LAND_CARDS, 'проект', 'проекта', 'проектов')}</span><small>все проекты подборки — в каталоге с фильтрами</small></Link> : null}
          </>
        ) : (
          <div className="empty card"><p>Таких проектов в базе пока нет. Каталог пополняется с каждым проверенным материалом.</p><Link className="btn ghost" href="/obekty/">Все объекты</Link></div>
        )}
      </section>
      ) : null}

      {stories.length ? (
        <section className="sec" aria-labelledby="h-stories">
          <div className="sec-h"><h2 id="h-stories" className="tt">О районе<span>история, парки и скверы</span></h2></div>
          <div className="a-grid">{stories.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </section>
      ) : null}

      {arts.length ? (
        <section className="sec" aria-labelledby="h-arts">
          <div className="sec-h"><h2 id="h-arts" className="tt">Материалы<span>{objs.length ? 'о проектах подборки' : l.label}</span></h2></div>
          <div className="a-grid">{arts.slice(0, 4).map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </section>
      ) : null}

      {!objs.length ? (
        <div className="empty card sec"><p>Проектов {l.subject.replace(/^новостройки /, '')} в базе Шахматки пока нет: каталог пополняется с каждым проверенным материалом.</p><Link className="btn ghost" href="/obekty/">Все объекты</Link></div>
      ) : null}

      {faq.length ? (
        <section className="sec faq-sec" aria-labelledby="h-faq">
          <div className="sec-h"><h2 id="h-faq" className="tt">Вопросы<span>и ответы</span></h2></div>
          <div className="faq">{faq.map((f) => <details key={f.q} className="card"><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
        </section>
      ) : null}

      {same.length || other.length ? (
        <nav className="sec land-links" aria-label="Другие подборки">
          {same.length ? <><p className="f-k">{l.group === 'district' ? 'Другие районы' : l.group === 'region' ? 'Другие регионы' : l.group === 'class' ? 'Другие классы' : 'Другие стадии'}</p>
            <div className="chips wrap">{same.slice(0, 12).map((x) => <Link key={x.slug} className="chip" href={`/novostroyki/${x.slug}/`}>{x.label}<i>{count(x)}</i></Link>)}</div>
            {same.length > 12 ? (
              <details className="more-chips">
                <summary>Ещё {same.length - 12} {l.group === 'district' ? 'районов' : 'подборок'}</summary>
                <div className="chips wrap">{same.slice(12).map((x) => <Link key={x.slug} className="chip" href={`/novostroyki/${x.slug}/`}>{x.label}<i>{count(x)}</i></Link>)}</div>
              </details>
            ) : null}</> : null}
          {other.length ? <><p className="f-k">Ещё подборки</p>
            <div className="chips wrap">{other.map((x) => <Link key={x.slug} className="chip" href={`/novostroyki/${x.slug}/`}>{cap(x.subject)}<i>{count(x)}</i></Link>)}</div></> : null}
          <Link className="note link" href="/novostroyki/">Все подборки и районы</Link>
        </nav>
      ) : null}
    </>
  )
}
