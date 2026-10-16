import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getUser } from '@/lib/auth'
import { LoginForm } from '@/lib/staff'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Аналитика поиска', robots: { index: false, follow: false } }

type Ev = { kind: 'search' | 'click' | 'suggest'; q: string; hits?: number | null; url?: string | null; position?: number | null }
type Row = { q: string; searches: number; zero: number; hitsSum: number; clicks: number; posSum: number }
const PERIODS = [7, 30, 90]
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—')

/** Отчёт по поиску: что ищут, что не находится и куда переходят. Данные — журнал search-events. */
export default async function SearchAnalytics({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const user = await getUser()
  if (!user) return <section className="cab"><h1 className="page-h tt">Аналитика поиска<span>для редакции</span></h1><LoginForm /></section>
  const days = PERIODS.includes(Number((await searchParams).d)) ? Number((await searchParams).d) : 30
  const since = new Date(Date.now() - days * 864e5).toISOString()
  const payload = await getPayload({ config })
  const ev = (await payload.find({
    collection: 'search-events', where: { createdAt: { greater_than: since } }, limit: 100000, pagination: false, depth: 0, overrideAccess: true,
    select: { kind: true, q: true, hits: true, url: true, position: true },
  })).docs as unknown as Ev[]

  // запрос считается поиском и на странице /poisk/, и в подсказках; переход — клик по результату или выбор подсказки
  const rows = new Map<string, Row>()
  const row = (q: string) => rows.get(q) || (rows.set(q, { q, searches: 0, zero: 0, hitsSum: 0, clicks: 0, posSum: 0 }), rows.get(q)!)
  const dest = new Map<string, number>()
  let searches = 0, zero = 0, clicks = 0, sugg = 0, suggPicked = 0
  for (const e of ev) {
    const r = row(e.q)
    if (e.kind === 'search' || e.kind === 'suggest') {
      searches++; r.searches++; r.hitsSum += e.hits || 0
      if (!e.hits) { zero++; r.zero++ }
    }
    if (e.kind === 'suggest') { sugg++; if (e.url && e.url !== '/poisk/') suggPicked++ }
    const picked = e.kind === 'click' || (e.kind === 'suggest' && e.url && !e.url.startsWith('/poisk/'))
    if (picked && e.url) { clicks++; r.clicks++; r.posSum += e.position || 0; dest.set(e.url, (dest.get(e.url) || 0) + 1) }
  }
  const all = [...rows.values()].filter((r) => r.searches)
  const top = [...all].sort((a, b) => b.searches - a.searches).slice(0, 60)
  const empty = all.filter((r) => r.zero === r.searches).sort((a, b) => b.searches - a.searches).slice(0, 40)
  const noClick = all.filter((r) => r.zero < r.searches && !r.clicks).sort((a, b) => b.searches - a.searches).slice(0, 40)
  const dests = [...dest.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)
  const conv = (r: Row) => pct(Math.min(r.clicks, r.searches), r.searches)

  return (
    <section className="cab" style={{ maxWidth: 1000 }}>
      <h1 className="page-h tt">Аналитика поиска<span>за {days} дней</span></h1>
      <div className="cab-actions">
        {PERIODS.map((d) => <Link key={d} className={`chip${d === days ? ' on' : ''}`} href={`/kabinet/poisk/?d=${d}`}>{d} дней</Link>)}
        <Link className="btn" href="/admin/globals/search-settings">Синонимы и стоп-слова</Link>
        <Link className="chip" href="/kabinet/">← Кабинет</Link>
      </div>
      <dl className="land-stats">
        <div className="card"><dt>Поисков</dt><dd>{searches}</dd><small>уникальных запросов {all.length}</small></div>
        <div className="card"><dt>Без результатов</dt><dd>{pct(zero, searches)}</dd><small>{zero} поисков</small></div>
        <div className="card"><dt>Конверсия в переход</dt><dd>{pct(Math.min(clicks, searches), searches)}</dd><small>{clicks} переходов</small></div>
        <div className="card"><dt>Подсказки в шапке</dt><dd>{pct(suggPicked, sugg)}</dd><small>выбрали подсказку в {suggPicked} из {sugg}</small></div>
      </dl>
      {!ev.length ? <p className="hello-sub">Событий пока нет. Журнал пишется, когда поиск работает через Meilisearch: страница /poisk/ и подсказки в шапке.</p> : null}

      <h2 className="tt cab-h" style={{ marginTop: 40 }}>Частые запросы<span>поиски, найдено в среднем, переходы, конверсия</span></h2>
      <div className="tbl card"><table><thead><tr><th>Запрос</th><th>Поисков</th><th>Найдено</th><th>Переходов</th><th>Конверсия</th><th>Позиция клика</th></tr></thead>
        <tbody>{top.map((r) => <tr key={r.q}><td><Link href={`/poisk/?q=${encodeURIComponent(r.q)}`}>{r.q}</Link></td><td>{r.searches}</td><td>{Math.round(r.hitsSum / r.searches)}</td><td>{r.clicks}</td><td>{conv(r)}</td><td>{r.clicks ? (r.posSum / r.clicks).toFixed(1) : '—'}</td></tr>)}</tbody></table></div>

      <h2 className="tt cab-h" style={{ marginTop: 40 }}>Ничего не нашлось<span>кандидаты в синонимы, новые досье и статьи</span></h2>
      {empty.length ? <div className="tbl card"><table><thead><tr><th>Запрос</th><th>Раз</th></tr></thead><tbody>{empty.map((r) => <tr key={r.q}><td>{r.q}</td><td>{r.searches}</td></tr>)}</tbody></table></div> : <p className="hello-sub">Нет таких запросов.</p>}

      <h2 className="tt cab-h" style={{ marginTop: 40 }}>Нашлось, но не перешли<span>результаты есть, но не те — проверьте выдачу</span></h2>
      {noClick.length ? <div className="tbl card"><table><thead><tr><th>Запрос</th><th>Поисков</th><th>Найдено</th></tr></thead><tbody>{noClick.map((r) => <tr key={r.q}><td><Link href={`/poisk/?q=${encodeURIComponent(r.q)}`}>{r.q}</Link></td><td>{r.searches}</td><td>{Math.round(r.hitsSum / r.searches)}</td></tr>)}</tbody></table></div> : <p className="hello-sub">Нет таких запросов.</p>}

      <h2 className="tt cab-h" style={{ marginTop: 40 }}>Куда переходят из поиска</h2>
      {dests.length ? <div className="tbl card"><table><thead><tr><th>Страница</th><th>Переходов</th></tr></thead><tbody>{dests.map(([u, n]) => <tr key={u}><td><Link href={u}>{u}</Link></td><td>{n}</td></tr>)}</tbody></table></div> : <p className="hello-sub">Пока нет переходов.</p>}
    </section>
  )
}
