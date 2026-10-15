import type { Metadata } from 'next'
import Link from 'next/link'
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

  const ld = {
    '@type': 'Organization', name: b.name, url, alternateName: b.aliases.slice(0, 6),
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
            {list.flatMap((r) => r.x.events.map((e) => ({ ...e, o: r.o }))).sort((a, c) => c.date.localeCompare(a.date)).slice(0, 40).map((e, i) => (
              <li key={i} className={`tl-item${e.signal ? ' is-sig' : ''}`}>
                <div className="tl-meta"><time dateTime={e.date.slice(0, 10)}>{my(e.date)}</time>{e.signal ? <span className="tl-sig">Сигнал</span> : null}</div>
                <div className="tl-body"><p className="tl-t">{typo(e.title)}</p><p className="tl-x"><Link href={`/obekty/${e.o.slug}/`}>{e.o.name}</Link></p></div>
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
