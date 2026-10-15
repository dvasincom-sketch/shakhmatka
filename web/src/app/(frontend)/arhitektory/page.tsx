import type { Metadata } from 'next'
import Link from 'next/link'
import { BUREAU_GEO } from '@/lib/bureau-geo'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SITE, ogFor, coverOf } from '@/lib/ui'
import { plural } from '@/lib/geo'
import { BUREAUS } from '@/lib/architects'
import { BUREAU_PROFILES } from '@/lib/architect-profiles'
import { ARCH_STATS } from '@/lib/arch-stats'
import { JsonLd } from '@/lib/jsonld'
import { pub } from '@/lib/public'
import type { Media, Object as Obj } from '@/payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Архитектурные бюро новостроек Москвы',
  description: 'Кто проектирует новостройки Москвы: APEX, Kleinewelt, WALL, KAMEN, GAFA и ещё полторы сотни бюро — проекты, застройщики, доля концепций, дошедших до стройки.',
  alternates: { canonical: `${SITE}/arhitektory/` },
  openGraph: ogFor(`${SITE}/arhitektory/`),
}

const KIND_H: Record<string, [string, string]> = {
  architecture: ['Все архитектурные бюро', 'по числу проектов в досье'],
  landscape: ['Ландшафт', 'благоустройство, дворы и парки'],
  interior: ['Интерьеры', 'лобби и общие пространства'],
}
const ST = ['land', 'concept', 'architecture', 'permit', 'sales', 'completed'] as const
const ST_L: Record<string, string> = { land: 'участок', concept: 'концепция', architecture: 'архитектура', permit: 'разрешение', sales: 'продажи', completed: 'ввод' }
const pct = (x: number) => `${Math.round(x * 100)}%`

export default async function Architects() {
  const arch = BUREAUS.filter((b) => b.kind === 'architecture')
  const top = arch.slice(0, 12)
  const total = new Set(BUREAUS.flatMap((b) => b.objects.map((o) => o.slug))).size
  const payload = await getPayload({ config })
  const slugs = [...new Set(top.flatMap((b) => b.objects.map((o) => o.slug)))]
  const [objs, art] = await Promise.all([
    payload.find({ collection: 'objects', where: { slug: { in: slugs } }, limit: slugs.length, pagination: false, depth: 1, select: { slug: true, name: true, gallery: true, lastEventAt: true } }),
    payload.find({ collection: 'articles', where: pub({ slug: { equals: 'kto-risuet-novuyu-moskvu' } }), limit: 1, depth: 0, select: { slug: true, title: true, lead: true } }),
  ])
  const bySlug = new Map((objs.docs as Obj[]).map((o) => [o.slug, o]))
  const coverFor = (keys: string[]) => {
    const os = keys.map((k) => bySlug.get(k)).filter(Boolean) as Obj[]
    os.sort((a, c) => (c.lastEventAt || '').localeCompare(a.lastEventAt || ''))
    for (const o of os) { const m = (o.gallery || []).find((g) => typeof g === 'object' && coverOf(g as Media)) as Media | undefined; if (m) return { m: coverOf(m)!, o } }
    return null
  }
  const shares = top.map((b) => ARCH_STATS.bureaus[b.key]?.share).filter((x): x is number => x != null)
  const allSt = Object.values(ARCH_STATS.bureaus).reduce((acc, b) => { for (const [k, v] of Object.entries(b.stages)) acc[k] = (acc[k] || 0) + v; return acc }, {} as Record<string, number>)
  const allN = ST.reduce((s, k) => s + (allSt[k] || 0), 0)
  const reached = (allSt.permit || 0) + (allSt.sales || 0) + (allSt.completed || 0)
  const ld = {
    '@type': 'CollectionPage', name: 'Архитектурные бюро', url: `${SITE}/arhitektory/`, inLanguage: 'ru',
    mainEntity: { '@type': 'ItemList', numberOfItems: BUREAUS.length, itemListElement: top.map((b, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Organization', name: b.name, url: `${SITE}/arhitektory/${b.key}/` } })) },
  }
  const a = art.docs[0] as { slug: string; title: string; lead?: string } | undefined
  return (
    <>
      <JsonLd data={ld} />
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><span>Архитекторы</span></nav>
      <h1 className="page-h tt">Архитектурные бюро<span>кто рисует новую Москву</span></h1>
      <p className="hello-sub">Бюро и мастерские из досье проектов Шахматки: чьи концепции согласовали, с какими застройщиками работают, сколько проектов дошло до стройки. Справка о бюро — по открытым источникам, со ссылками.</p>

      <dl className="land-stats sp-stats">
        <div className="card"><dt>Бюро</dt><dd>{arch.length}</dd><small>архитектурных, ещё {BUREAUS.length - arch.length} — ландшафт и интерьеры</small></div>
        <div className="card"><dt>Проектов</dt><dd>{total}</dd><small>с известным архитектором</small></div>
        <div className="card"><dt>Дошли до стройки</dt><dd>{pct(reached / allN)}</dd><small>получили разрешение, в продаже или введены</small></div>
        <div className="card"><dt>Несколько бюро</dt><dd>{ARCH_STATS.multi}</dd><small>проектов, где работали два бюро и больше</small></div>
      </dl>

      <div className="card arch-funnel" aria-label="Стадии проектов с известным архитектором">
        <div className="bur-bar">{ST.map((k) => allSt[k] ? <i key={k} className={`st-${k}`} style={{ flex: allSt[k] }} title={`${ST_L[k]}: ${allSt[k]}`} /> : null)}</div>
        <ul>{ST.map((k) => allSt[k] ? <li key={k}><i className={`st-${k}`} />{ST_L[k]}<b>{allSt[k]}</b></li> : null)}</ul>
        {a ? <Link className="arch-read" href={`/novosti/${a.slug}/`}><b>{a.title}</b><span>{a.lead}</span></Link> : null}
      </div>

      <section className="sec" aria-labelledby="h-top">
        <div className="sec-h"><h2 id="h-top" className="tt">Лидеры<span>больше всего проектов в досье</span></h2></div>
        <ul className="arch-top">
          {top.map((b) => {
            const c = coverFor(b.objects.map((o) => o.slug)), s = ARCH_STATS.bureaus[b.key], p = BUREAU_PROFILES[b.key]
            return (
              <li key={b.key}>
                <Link className="arch-tc card" href={`/arhitektory/${b.key}/`}>
                  <div className={`ph${c ? '' : ' ph-empty'}`}>{c ? <img src={c.m.url!} alt={`${c.o.name} — проект ${b.name}`} loading="lazy" /> : <span>{b.name.slice(0, 2)}</span>}</div>
                  <div className="tx">
                    <b>{b.name}</b>
                    <small>{[BUREAU_GEO[b.key] ? `${BUREAU_GEO[b.key].flag} ${BUREAU_GEO[b.key].city || BUREAU_GEO[b.key].country}` : null, p?.founded ? `с ${p.founded}` : null, `${b.objects.length} ${plural(b.objects.length, 'проект', 'проекта', 'проектов')}`].filter(Boolean).join(' · ')}</small>
                    {s ? <div className="bur-bar sm">{ST.map((k) => s.stages[k] ? <i key={k} className={`st-${k}`} style={{ flex: s.stages[k] }} /> : null)}</div> : null}
                    {s?.share != null ? <small>до стройки дошли {pct(s.share)}{s.devs.length ? ` · чаще всего с ${s.devs.slice(0, 2).map((d) => d[0]).join(', ')}` : ''}</small> : null}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="sec" aria-labelledby="h-pairs">
        <div className="sec-h"><h2 id="h-pairs" className="tt">Связки<span>бюро и застройщики, которые работают вместе чаще всего</span></h2></div>
        <ol className="card arch-pairs">
          {ARCH_STATS.pairs.map(([b, d, n], i) => {
            const k = arch.find((x) => x.name === b)?.key
            return <li key={i}><span>{k ? <Link href={`/arhitektory/${k}/`}>{b}</Link> : b}</span><i>×</i><span>{d}</span><b>{n} {plural(n, 'проект', 'проекта', 'проектов')}</b></li>
          })}
        </ol>
      </section>

      {(['architecture', 'landscape', 'interior'] as const).map((k) => ({ k, list: BUREAUS.filter((b) => b.kind === k) })).filter((g) => g.list.length).map((g) => (
        <section key={g.k} className="sec" aria-labelledby={`h-${g.k}`}>
          <div className="sec-h"><h2 id={`h-${g.k}`} className="tt">{KIND_H[g.k][0]}<span>{KIND_H[g.k][1]}</span></h2></div>
          <ul className="arch-list">
            {g.list.map((b) => {
              const p = BUREAU_PROFILES[b.key], geo = BUREAU_GEO[b.key]
              return (
                <li key={b.key}>
                  <Link className="arch-card card" href={`/arhitektory/${b.key}/`}>
                    <span className="ac-geo">{geo ? <><i aria-hidden="true">{geo.flag}</i>{geo.city || geo.country}</> : <span className="ac-none">место не указано</span>}</span>
                    <b>{b.name}</b>
                    <span className="n">{[b.objects.length ? `${b.objects.length} ${plural(b.objects.length, 'проект', 'проекта', 'проектов')}` : null, b.articles.length ? `${b.articles.length} ${plural(b.articles.length, 'статья', 'статьи', 'статей')}` : null, (p?.founded || geo?.founded) ? `с ${p?.founded || geo?.founded}` : null].filter(Boolean).join(' · ')}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      <Link className="land-cta card" href="/razmorozka/"><span>Конкурс «Разморозка»</span><small>концепции для замороженных площадок Москвы — для студентов, молодых бюро и фрилансеров</small></Link>
      <p className="note">Связи бюро с проектами — по досье Шахматки: часть из них сигналы с рынка, а не официальные сообщения; это помечено на странице бюро. «Дошли до стройки» — доля проектов бюро на стадиях «разрешение», «продажи» и «ввод» без альтернативных и отклонённых вариантов. Нашли ошибку — напишите нам.</p>
    </>
  )
}
