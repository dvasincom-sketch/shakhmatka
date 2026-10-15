import type { Metadata } from 'next'
import Link from 'next/link'
import { BUREAU_GEO } from '@/lib/bureau-geo'
import { signalHref, signalSlugs } from '@/lib/signals'
import { FollowButton } from '@/lib/follow-button'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ObjectCard, SITE, ogFor, coverOf } from '@/lib/ui'
import { plural } from '@/lib/geo'
import { pub } from '@/lib/public'
import { typo } from '@/lib/markdown'
import { BUREAUS, bureauByKey } from '@/lib/architects'
import { JsonLd } from '@/lib/jsonld'
import { BUREAU_PROFILES } from '@/lib/architect-profiles'
import { STAGES } from '@/collections/Objects'
import type { Media, Object as Obj } from '@/payload-types'

export const dynamic = 'force-dynamic'

const MONTHS_N = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
const my = (iso: string) => { const d = new Date(iso); return `${MONTHS_N[d.getUTCMonth()]} ${d.getUTCFullYear()}` }
const KIND_W: Record<string, string> = { architecture: 'архитектурное бюро', landscape: 'ландшафтное бюро', interior: 'бюро интерьеров' }

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const b = bureauByKey(decodeURIComponent((await params).key))
  if (!b) return {}
  const url = `${SITE}/arhitektory/${b.key}/`
  const n = b.objects.length
  const title = `${b.name}: проекты в Москве`.slice(0, 60)
  const description = `${b.name} — ${KIND_W[b.kind] || 'бюро'}: ${n ? `${n} ${plural(n, 'проект', 'проекта', 'проектов')} в досье Шахматки` : 'упоминания в материалах Шахматки'}, концепции, конкурсы и согласования.`
  return {
    title, description, alternates: { canonical: url },
    // страница с одним упоминанием — тонкая, в поиск не отдаём
    robots: n + b.articles.length < 2 ? { index: false, follow: true } : undefined,
    openGraph: ogFor(url, title, description),
  }
}

export default async function Bureau({ params }: { params: Promise<{ key: string }> }) {
  const b = bureauByKey(decodeURIComponent((await params).key))
  if (!b) notFound()
  const payload = await getPayload({ config })
  const slugs = b.objects.map((o) => o.slug)
  const [objs, arts] = await Promise.all([
    slugs.length ? payload.find({ collection: 'objects', where: { slug: { in: slugs } }, limit: slugs.length, pagination: false, depth: 1 }) : { docs: [] as Obj[] },
    b.articles.length ? payload.find({ collection: 'articles', where: pub({ slug: { in: b.articles.map((a) => a.slug) } }), sort: '-datePublished', limit: 50, depth: 1 }) : { docs: [] },
  ])
  const bySlug = new Map((objs.docs as Obj[]).map((o) => [o.slug, o]))
  const list = b.objects.map((x) => ({ x, o: bySlug.get(x.slug) })).filter((r) => r.o) as { x: (typeof b.objects)[number]; o: Obj }[]
  list.sort((a, c) => (c.o.lastEventAt || '').localeCompare(a.o.lastEventAt || ''))
  const url = `${SITE}/arhitektory/${b.key}/`
  const related = BUREAUS.filter((r) => r.key !== b.key && r.objects.some((o) => slugs.includes(o.slug))).slice(0, 12)
  const cover = (o: Obj) => coverOf((o.gallery || []).find((m) => typeof m === 'object' && coverOf(m as Media)) as Media | undefined)

  const pr = BUREAU_PROFILES[b.key]
  const itemText = (x: string | { name?: string; project?: string; title?: string; award?: string; year?: number | string | null }) => typeof x === 'string' ? x : `${x.name || x.project || x.title || x.award || ''}${x.year ? ` (${x.year})` : ''}`
  const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u } }
  const stageN = STAGES.map((st) => ({ ...st, n: list.filter((r) => r.o.stage === st.value).length })).filter((x) => x.n)
  const devN = new Map<string, { name: string; slug: string; n: number }>()
  list.forEach((r) => { const d = r.o.developer as { name?: string; slug?: string } | undefined; if (d?.slug) { const c = devN.get(d.slug) || { name: d.name || d.slug, slug: d.slug, n: 0 }; c.n++; devN.set(d.slug, c) } })
  const topDevs = [...devN.values()].sort((a, c) => c.n - a.n).slice(0, 8)
  const ld = {
    '@type': 'Organization', name: b.name, url, alternateName: b.aliases.slice(0, 6), ...(pr?.founded ? { foundingDate: String(pr.founded) } : {}),
    description: `${KIND_W[b.kind] || 'Бюро'}; проекты в Москве по досье Шахматки`,
    subjectOf: list.slice(0, 20).map((r) => ({ '@type': 'Place', name: r.o.name, url: `${SITE}/obekty/${r.o.slug}/` })),
  }

  return (
    <>
      <JsonLd data={ld} />
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><Link href="/arhitektory/">Архитекторы</Link><span>/</span><span>{b.name}</span></nav>
      <h1 className="page-h tt">{b.name}<span>{KIND_W[b.kind] || 'бюро'}</span></h1>
      <FollowButton kind="bureau" id={b.key} label={b.name} hint="Новые проекты и события с участием бюро." />
      {b.aliases.length ? <p className="hello-sub">Встречается как: {b.aliases.slice(0, 8).join(', ')}</p> : null}

      <dl className="land-stats dev-stats">
        <div className="card"><dt>Проектов в досье</dt><dd>{list.length}</dd><small>в Москве и Подмосковье</small></div>
        <div className="card"><dt>Материалов</dt><dd>{b.articles.length}</dd><small>статей Шахматки с упоминанием</small></div>
        {list.length ? <div className="card"><dt>Последнее событие</dt><dd>{list[0].o.lastEventAt ? my(list[0].o.lastEventAt) : '—'}</dd><small>{list[0].o.name}</small></div> : null}
      </dl>

      {pr ? (
        <section className="sec bur-about" aria-labelledby="h-ab">
          <div className="sec-h"><h2 id="h-ab" className="tt">О бюро<span>справка по открытым источникам</span></h2></div>
          <div className="bur-grid">
            <div className="card bur-txt">
              {pr.about ? <p>{typo(pr.about)}</p> : null}
              {pr.notable?.length ? <><p className="f-k">Известные проекты</p><ul>{pr.notable.slice(0, 5).map((x, i) => <li key={i}>{itemText(x)}</li>)}</ul></> : null}
              {pr.awards?.length ? <><p className="f-k">Награды</p><ul>{pr.awards.slice(0, 3).map((x, i) => <li key={i}>{itemText(x)}</li>)}</ul></> : null}
            </div>
            <dl className="card bur-facts">
              {pr.founded ? <div><dt>Основано</dt><dd>{pr.founded}</dd></div> : null}
              {BUREAU_GEO[b.key] ? <div><dt>Где</dt><dd>{BUREAU_GEO[b.key].flag} {[BUREAU_GEO[b.key].city, BUREAU_GEO[b.key].country].filter(Boolean).join(', ')}</dd></div> : pr.city ? <div><dt>Где</dt><dd>{pr.city}</dd></div> : null}
              {pr.founders?.length ? <div><dt>Основатели и руководители</dt><dd>{pr.founders.slice(0, 4).map((f, i) => <span key={i}>{f}</span>)}</dd></div> : null}
              {pr.staff ? <div><dt>Команда</dt><dd>{String(pr.staff)}</dd></div> : null}
              {/* сайт бюро и ссылки на источники не показываем: редакция не даёт внешних ссылок и не рекламирует участников рынка; источники — в pipeline/architects/profiles */}
            </dl>
          </div>
        </section>
      ) : null}

      {list.length > 2 ? (
        <section className="sec" aria-labelledby="h-st">
          <div className="sec-h"><h2 id="h-st" className="tt">Портфель<span>на какой стадии проекты бюро</span></h2></div>
          <div className="bur-grid">
            <div className="card bur-stages">
              <div className="bur-bar">{stageN.map((x) => <i key={x.value} className={`st-${x.value}`} style={{ flex: x.n }} title={`${x.label}: ${x.n}`} />)}</div>
              <ul>{stageN.map((x) => <li key={x.value}><i className={`st-${x.value}`} />{x.label}<b>{x.n}</b></li>)}</ul>
            </div>
            {topDevs.length ? <div className="card dfig-list"><p className="f-k">С кем работает</p><ol>{topDevs.map((d) => <li key={d.slug}><Link href={`/zastroyshchiki/${d.slug}/`}>{d.name}</Link><b>{d.n}</b></li>)}</ol></div> : null}
          </div>
        </section>
      ) : null}

      {list.length ? (
        <section className="sec" aria-labelledby="h-p">
          <div className="sec-h"><h2 id="h-p" className="tt">Проекты<span>свежие события сверху</span></h2></div>
          <div className="obj-grid">{list.map((r) => <ObjectCard key={r.o.id} o={{ ...r.o, cover: cover(r.o) }} />)}</div>
        </section>
      ) : null}

      {list.some((r) => r.x.events.length) ? (
        <section className="sec" aria-labelledby="h-e">
          <div className="sec-h"><h2 id="h-e" className="tt">Что известно<span>события досье с участием бюро</span></h2></div>
          <ol className="tl sig-ctx">
            {list.flatMap((r) => { const sg = signalSlugs(r.o.slug, r.o.timeline); return r.x.events.map((e) => { const t = e.signal ? (r.o.timeline || []).find((t) => t.certainty === 'signal' && t.date.slice(0, 10) === e.date.slice(0, 10)) : undefined; return { ...e, o: r.o, href: t?.id && sg.get(t.id) ? signalHref(sg.get(t.id)!) : undefined } }) }).sort((a, c) => c.date.localeCompare(a.date)).slice(0, 40).map((e, i) => (
              <li key={i} className={`tl-item${e.signal ? ' is-sig' : ''}`}>
                <div className="tl-meta"><time dateTime={e.date.slice(0, 10)}>{my(e.date)}</time>{e.signal ? <span className="tl-sig">Сигнал</span> : null}</div>
                <div className="tl-body"><p className="tl-t">{e.href ? <Link href={e.href}>{typo(e.title)}</Link> : typo(e.title)}</p><p className="tl-x"><Link href={`/obekty/${e.o.slug}/`}>{e.o.name}</Link></p></div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {arts.docs.length ? (
        <section className="sec" aria-labelledby="h-a">
          <div className="sec-h"><h2 id="h-a" className="tt">Материалы<span>где упоминается бюро</span></h2></div>
          <ul className="rows card">
            {arts.docs.map((a) => <li key={a.id}><Link href={`/novosti/${a.slug}/`}><span className="t">{typo(a.title)}</span></Link></li>)}
          </ul>
        </section>
      ) : null}

      {related.length ? (
        <section className="sec" aria-labelledby="h-r">
          <div className="sec-h"><h2 id="h-r" className="tt">Работали рядом<span>другие бюро в тех же проектах</span></h2></div>
          <div className="chips">{related.map((r) => <Link key={r.key} className="chip" href={`/arhitektory/${r.key}/`}>{r.name}</Link>)}</div>
        </section>
      ) : null}
      <p className="note">Связи с проектами — по досье Шахматки; события с пометкой «Сигнал» — информация с рынка, а не официальное сообщение.</p>
    </>
  )
}
