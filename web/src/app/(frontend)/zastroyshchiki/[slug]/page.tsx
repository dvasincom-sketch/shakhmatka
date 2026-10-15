import { monthGen } from '@/lib/months'
import type { Metadata } from 'next'
import Link from 'next/link'
import { FollowButton } from '@/lib/follow-button'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ArticleCard, SITE, STAGES, StageStrip, devName, stageLabel, ogFor, coverOf } from '@/lib/ui'
import { pub } from '@/lib/public'
import { signalHref, signalSlugs, isSnapshot, outcomeLabel } from '@/lib/signals'
import { TROUBLE, TROUBLE_BADGE } from '@/lib/trouble'
import { CLASS_LABELS, districtName, plural, priceText, regionName } from '@/lib/geo'
import { typo } from '@/lib/markdown'
import { JsonLd } from '@/lib/jsonld'
import type { Developer, Media, Object as Obj } from '@/payload-types'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими

export const dynamic = 'force-dynamic'

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const MONTHS_N = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
const dmy = (iso: string) => { const d = new Date(iso); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` }
const my = (iso: string) => { const d = new Date(iso); return `${MONTHS_N[d.getUTCMonth()]} ${d.getUTCFullYear()}` }
const KIND: Record<string, string> = {
  land: 'Участок', krt: 'КРТ', tender: 'Торги', concept: 'Концепция', architecture: 'Архитектура', permit: 'Разрешение',
  sales: 'Продажи', price: 'Цены', deal: 'Сделка', construction: 'Стройка', court: 'Суд', other: 'Событие',
}
const OBJ_SELECT = { name: true, slug: true, zu: true, stage: true, region: true, district: true, timeline: true, owners: true, signalCount: true, lastEventAt: true, developer: true, gallery: true, class: true, priceFrom: true, priceM2From: true, completion: true } as const

async function load(slug: string) {
  const payload = await getPayload({ config })
  const d = (await payload.find({ collection: 'developers', where: { slug: { equals: decodeURIComponent(slug) } }, limit: 1, depth: 0 })).docs[0] as Developer | undefined
  if (!d) return null
  const [own, past, arts] = await Promise.all([
    payload.find({ collection: 'objects', where: { developer: { equals: d.id } }, limit: 1000, pagination: false, depth: 1, sort: '-lastEventAt', select: OBJ_SELECT }),
    // проекты, где компания была прежним владельцем или участником сделки
    payload.find({ collection: 'objects', where: { and: [{ developer: { not_equals: d.id } }, { or: [{ previousDevelopers: { contains: d.id } }, { 'owners.developer': { equals: d.id } }] }] }, limit: 200, pagination: false, depth: 1, select: OBJ_SELECT }),
    payload.find({ collection: 'articles', where: pub({ developers: { contains: d.id } }), sort: '-datePublished', limit: 24, depth: 1 }),
  ])
  return { d, objs: own.docs as Obj[], past: past.docs as Obj[], arts: arts.docs }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const x = await load((await params).slug)
  if (!x) return {}
  const name = devName(x.d.name)
  const n = x.objs.length
  const selling = x.objs.filter((o) => o.stage === 'sales').length
  const description = x.d.about
    ? x.d.about.slice(0, 157).replace(/\s+\S*$/, '') + '…'
    : `${name} в досье Шахматки: ${n} ${plural(n, 'проект', 'проекта', 'проектов')}${selling ? `, ${selling} в продаже` : ''}. Сделки и смены собственника, сигналы рынка и проверенные материалы о компании.`
  return {
    title: `${name}: проекты, сделки и новости застройщика`,
    description,
    alternates: { canonical: `${SITE}/zastroyshchiki/${x.d.slug}/` },
    openGraph: ogFor(`${SITE}/zastroyshchiki/${x.d.slug}/`),
  }
}

type Ev = { id: string; date: string; dateLabel?: string | null; kind?: string | null; title: string; certainty?: string | null; confirmedOn?: string | null; outcome?: string | null; o: Obj }

export default async function DeveloperPage({ params }: { params: Promise<{ slug: string }> }) {
  const x = await load((await params).slug)
  if (!x) notFound()
  const { d, objs, past, arts } = x
  const name = devName(d.name)
  const url = `${SITE}/zastroyshchiki/${d.slug}/`

  // события всех проектов компании
  const events: Ev[] = objs.flatMap((o) => (o.timeline || []).map((t) => ({ ...t, id: t.id!, o }))).sort((a, b) => b.date.localeCompare(a.date))
  const signals = events.filter((e) => e.certainty === 'signal')
  const sigUrl = new Map<string, string>()
  objs.forEach((o) => signalSlugs(o.slug, o.timeline).forEach((v, k) => sigUrl.set(k, signalHref(v))))
  const confirmed = signals.filter((e) => e.confirmedOn).length
  const unconfirmed = signals.filter((e) => e.outcome).length
  const recent = events.slice(0, 12)
  // сначала то, что сбылось (свежие подтверждения сверху), затем остальные сигналы по дате
  const sigShown = [...signals.filter((e) => e.confirmedOn).sort((a, b) => b.confirmedOn!.localeCompare(a.confirmedOn!)), ...signals.filter((e) => !e.confirmedOn)].slice(0, 12)

  // проекты по стадиям: от продаж к земле
  const stageOrder = ['sales', 'permit', 'architecture', 'concept', 'land', 'completed']
  const byStage = stageOrder.map((s) => ({ s, list: objs.filter((o) => o.stage === s) })).filter((g) => g.list.length)
  const noStage = objs.filter((o) => !o.stage)
  // обложка проекта: первое фото досье, иначе обложка статьи о нём
  const artCover = (id: number) => coverOf(arts.find((a) => (a.objects || []).some((x) => (typeof x === 'object' ? x.id : x) === id) && coverOf(a.heroImage as Media))?.heroImage as Media | undefined)

  // сделки: смены собственника, где компания — покупатель или продавец
  const deals = [...objs, ...past].flatMap((o) => {
    const ow = o.owners || []
    return ow.map((w, i) => {
      const dev = w.developer as Developer | undefined
      if (!dev || dev.id !== d.id) return null
      const prev = ow[i - 1]?.developer as Developer | undefined
      const next = ow[i + 1]?.developer as Developer | undefined
      return { o, w, prev, next, key: `${o.id}-${i}` }
    }).filter(Boolean) as { o: Obj; w: NonNullable<Obj['owners']>[number]; prev?: Developer; next?: Developer; key: string }[]
  })

  // где работает
  const where = new Map<string, number>()
  objs.forEach((o) => { const k = o.region === 'moscow' ? (o.district ? `d:${o.district}` : 'r:moscow') : `r:${o.region}`; where.set(k, (where.get(k) || 0) + 1) })
  const geo = [...where.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const geoLabel = (k: string) => (k.startsWith('d:') ? districtName(k.slice(2)) : regionName(k.slice(2)))
  const geoHref = (k: string) => (k === 'r:moscow' ? '/novostroyki/moskva/' : `/novostroyki/${k.slice(2)}/`)

  const ld = {
    '@type': 'Organization', name, url,
    description: d.about || undefined,
    subjectOf: arts.slice(0, 10).map((a) => ({ '@type': 'NewsArticle', headline: a.title, url: `${SITE}/novosti/${a.slug}/` })),
  }
  const crumbs = {
    '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Лента', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Застройщики', item: `${SITE}/zastroyshchiki/` },
      { '@type': 'ListItem', position: 3, name, item: url },
    ],
  }

  const about = (d.about || '').split(/\n\s*\n/).map((p: string) => p.trim()).filter(Boolean)
  return (
    <>
      <JsonLd data={[ld, crumbs]} />
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><Link href="/zastroyshchiki/">Застройщики</Link><span>/</span><span>{name}</span></nav>
      <h1 className="page-h tt">{name}<span>застройщик</span></h1>
      <FollowButton kind="developer" id={d.slug} label={name} hint="Новые проекты, сделки с участками, сигналы и материалы о компании." />
      {about.length ? (
        <div className="dev-about">
          <p>{typo(about[0])}</p>
          {about.length > 1 ? <details><summary>Подробнее о компании</summary>{about.slice(1).map((p, i) => <p key={i}>{typo(p)}</p>)}</details> : null}
        </div>
      ) : null}

      <dl className="land-stats dev-stats">
        <div className="card"><dt>Проектов в досье</dt><dd>{objs.length}</dd><small>{STAGES.filter((s) => objs.some((o) => o.stage === s.value)).map((s) => `${objs.filter((o) => o.stage === s.value).length} — ${s.label.toLowerCase()}`).slice(0, 3).join(', ') || 'стадии уточняются'}</small></div>
        <div className="card"><dt>Продаёт сейчас</dt><dd>{objs.filter((o) => o.stage === 'sales').length}</dd><small>{plural(objs.filter((o) => o.stage === 'sales').length, 'проект', 'проекта', 'проектов')} на стадии продаж</small></div>
        <div className="card"><dt>Сигналы</dt><dd>{signals.length}</dd><small>{confirmed ? `${confirmed} подтвердились` : 'о компании до новостей'}{unconfirmed ? `, ${unconfirmed} — нет` : ''}</small></div>
        <div className="card"><dt>Сделки</dt><dd>{deals.length}</dd><small>{deals.length ? 'смены собственника с участием компании' : 'подтверждённых сделок пока нет'}</small></div>
      </dl>

      {geo.length > 1 ? (
        <div className="chips wrap dev-geo" aria-label="Где строит">
          {geo.map(([k, n]) => <Link key={k} className="chip" href={geoHref(k)}>{geoLabel(k)}<i>{n}</i></Link>)}
        </div>
      ) : null}

      {deals.length ? (
        <section className="sec" aria-labelledby="h-deals">
          <div className="sec-h"><h2 id="h-deals" className="tt">Сделки<span>какие проекты купила и продала компания</span></h2></div>
          <ol className="owners">
            {deals.map(({ o, w, prev, next, key }) => {
              const sold = !!next
              return (
                <li key={key} className={`card${sold ? '' : ' now'}`}>
                  <p className="ow-when">{sold ? `продан${w.until ? ` · ${w.until}` : ''}` : `${w.since ? `с ${monthGen(w.since)}` : 'владеет'}`}<span className={`pill ${sold ? '' : 'sun'}`}>{sold ? 'продала' : prev ? 'купила' : 'владеет'}</span></p>
                  <p className="ow-who"><Link href={`/obekty/${o.slug}/`}>{o.name}</Link></p>
                  <p className="ow-how">
                    {prev ? <>у <Link href={`/zastroyshchiki/${prev.slug}/`}>{devName(prev.name)}</Link>. </> : null}
                    {sold && next ? <>Новый владелец — <Link href={`/zastroyshchiki/${next.slug}/`}>{devName(next.name)}</Link>. </> : null}
                    {w.how && !sold ? typo(w.how) : null}
                  </p>
                  {w.source?.startsWith('http') ? <a className="ow-src" href={w.source} target="_blank" rel="noopener">источник</a> : null}
                </li>
              )
            })}
          </ol>
        </section>
      ) : null}

      {objs.length ? (
        <section className="sec" aria-labelledby="h-obj">
          <div className="sec-h"><h2 id="h-obj" className="tt">Проекты<span>по стадиям, свежие события сверху</span></h2></div>
          <div className="dev-stages">
            {[...byStage, ...(noStage.length ? [{ s: '', list: noStage }] : [])].map((g) => (
              <details key={g.s || 'none'} className="dev-stage card" open={g.s === 'sales' || byStage.length <= 2}>
                <summary><StageStrip stage={g.s || undefined} /><b>{g.s ? stageLabel(g.s) : 'Стадия уточняется'}</b><i>{g.list.length}</i></summary>
                <ul className="dproj">
                  {g.list.map((o) => {
                    const im = coverOf((o.gallery || []).find((m) => typeof m === 'object' && coverOf(m as Media)) as Media | undefined) || artCover(o.id)
                    const last = [...(o.timeline || [])].sort((a, b) => b.date.localeCompare(a.date))[0]
                    const price = priceText(o)
                    const where = o.region === 'moscow' ? districtName(o.district) || 'Москва' : regionName(o.region)
                    return (
                      <li key={o.id}><Link href={`/obekty/${o.slug}/`}>
                        <span className={`dp-ph${im?.url ? '' : ' ph-empty'}`}>{im?.url ? <img src={im.url} alt="" loading="lazy" /> : <b aria-hidden="true">{o.name.slice(0, 1)}</b>}</span>
                        <span className="dp-tx">
                          <span className="dp-h"><b>{o.name}</b>{TROUBLE[o.slug] && TROUBLE[o.slug].status !== 'resolved' ? <i className={`tr-badge tr-${TROUBLE[o.slug].status}`}>{TROUBLE_BADGE[TROUBLE[o.slug].status]}</i> : null}{o.signalCount ? <i className="dp-sig" title="Сигналы до официальных новостей">{o.signalCount} {plural(o.signalCount, 'сигнал', 'сигнала', 'сигналов')}</i> : null}</span>
                          <span className="dp-f">
                            <span>{where}</span>
                            {o.class ? <span>{CLASS_LABELS[o.class]}</span> : null}
                            {price ? <span className="dp-price">{price}</span> : null}
                            {o.completion ? <span>ввод {o.completion}</span> : null}
                            {o.zu && o.zu !== o.name ? <span className="zu"><b>ЗУ</b>{o.zu}</span> : null}
                          </span>
                          {last ? <span className="dp-last"><time dateTime={last.date.slice(0, 10)}>{last.dateLabel || my(last.date)}</time><em>{KIND[last.kind || 'other']}</em>{typo(last.title)}</span> : null}
                        </span>
                      </Link></li>
                    )
                  })}
                </ul>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {signals.length ? (
        <section className="sec" aria-labelledby="h-sig">
          <div className="sec-h"><h2 id="h-sig" className="tt">Сигналы<span>{confirmed ? `сбылось ${confirmed} из ${signals.length} — подтверждённые сверху` : 'что говорили о компании до официальных новостей'}</span></h2><Link className="more" href="/signaly/">Все сигналы</Link></div>
          <ol className="tl sig-tl dev-tl">
            {sigShown.map((e) => (
              <li key={e.id} className="tl-item is-sig">
                <div className="tl-meta">
                  <time dateTime={e.date.slice(0, 10)}>{e.dateLabel || dmy(e.date)}</time>
                  <span className="tl-sig">Сигнал</span>
                  {e.confirmedOn ? <span className="tl-conf">подтвердилось: {my(e.confirmedOn)}</span> : null}
                  {e.outcome ? <span className={isSnapshot(e) ? 'tl-snap' : 'tl-unc'}>{outcomeLabel(e)}</span> : null}
                </div>
                <div className="tl-body">
                  <p className="tl-t">{e.outcome && !isSnapshot(e) ? <span className="tl-said">Участники рынка говорили: </span> : null}{sigUrl.get(e.id) ? <Link href={sigUrl.get(e.id)!}>{typo(e.title)}</Link> : typo(e.title)}</p>
                  <p className="tl-x"><Link href={`/obekty/${e.o.slug}/`}>{e.o.name}</Link></p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {recent.length ? (
        <section className="sec" aria-labelledby="h-ev">
          <div className="sec-h"><h2 id="h-ev" className="tt">Последние события<span>по всем проектам компании</span></h2></div>
          <ol className="tl dev-tl">
            {recent.map((e) => (
              <li key={e.id} className={`tl-item k-${e.kind}${e.certainty === 'signal' ? ' is-sig' : ''}`}>
                <div className="tl-meta">
                  <time dateTime={e.date.slice(0, 10)}>{e.dateLabel || dmy(e.date)}</time>
                  <span className="tl-kind">{KIND[e.kind || 'other']}</span>
                  {e.certainty === 'signal' ? <span className="tl-sig">Сигнал</span> : null}
                </div>
                <div className="tl-body">
                  <p className="tl-t">{typo(e.title)}</p>
                  <p className="tl-x"><Link href={`/obekty/${e.o.slug}/`}>{e.o.name}</Link></p>
                </div>
              </li>
            ))}
          </ol>
          <p className="note">По данным редакции на дату события; «сверено» и источники — в досье объектов.</p>
        </section>
      ) : null}

      {arts.length ? (
        <section className="sec" aria-labelledby="h-arts">
          <div className="sec-h"><h2 id="h-arts" className="tt">Материалы<span>о компании и её проектах</span></h2></div>
          <div className="a-grid">{arts.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </section>
      ) : null}

      {past.length ? (
        <section className="sec" aria-labelledby="h-past">
          <div className="sec-h"><h2 id="h-past" className="tt">Раньше<span>проекты, которые компания вела или продала</span></h2></div>
          <ul className="rows card">{past.map((o) => <li key={o.id}><Link href={`/obekty/${o.slug}/`}><span className="t">{o.name}</span><StageStrip stage={o.stage} /><span className="s">сейчас — {devName((o.developer as Developer | undefined)?.name) || 'застройщик уточняется'}</span></Link></li>)}</ul>
        </section>
      ) : null}

      {/* Раздел «Судебные риски» скрыт до подключения источников (Мосгорсуд, районные суды, арбитраж, ФССП) */}
    </>
  )
}
