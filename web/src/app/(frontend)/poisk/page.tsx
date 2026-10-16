import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ArticleCard, StageStrip, devName } from '@/lib/ui'
import type { Developer } from '@/payload-types'
import { pub } from '@/lib/public'
import { search, searchEnabled } from '@/lib/search'
import { logSearch } from '@/lib/search-log'
import { TrackLink } from '@/lib/search-track'

export const metadata: Metadata = { title: 'Поиск по новостройкам, адресам и застройщикам', robots: { index: false, follow: true } }

const TABS = [
  { v: '', label: 'Всё' }, { v: 'object', label: 'Объекты' }, { v: 'article', label: 'Материалы' },
  { v: 'interior', label: 'Интерьер' }, { v: 'developer', label: 'Застройщики' }, { v: 'place', label: 'Районы' }, { v: 'term', label: 'Словарь' },
]
const TYPE_LABEL: Record<string, string> = { object: 'Объект', article: 'Материал', interior: 'Интерьер', developer: 'Застройщик', place: 'Район', term: 'Термин' }
const PER = 20
// подсветка от Meilisearch: экранируем всё, кроме наших <mark>
const hl = (s?: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/&lt;mark>/g, '<mark>').replace(/&lt;\/mark>/g, '</mark>')

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string; t?: string; p?: string }> }) {
  const sp = await searchParams
  const q = (sp.q || '').trim()
  if (searchEnabled()) {
    const t = TABS.some((x) => x.v === sp.t) ? sp.t || '' : ''
    const page = Math.max(1, Number(sp.p) || 1)
    const r = q ? await search(q, { type: t || undefined, limit: PER, offset: (page - 1) * PER, highlight: true }).catch(() => null) : null
    if (r || !q) {
      const all = q ? await search(q, { limit: 0 }).catch(() => null) : null
      const counts = all?.facetDistribution?.type || {}
      const total = r?.estimatedTotalHits ?? r?.totalHits ?? 0
      const pages = Math.ceil(total / PER)
      // аналитика: запрос и число найденного — только первая страница, чтобы листание не считалось новым поиском
      if (q && r && page === 1) await logSearch({ kind: 'search', q, tab: t || undefined, hits: total })
      const href = (o: { t?: string; p?: number }) => `/poisk/?q=${encodeURIComponent(q)}${o.t ? `&t=${o.t}` : ''}${o.p && o.p > 1 ? `&p=${o.p}` : ''}`
      return (
        <>
          <h1 className="page-h tt">Поиск<span>{q ? `«${q}»` : 'по объектам, адресам и застройщикам'}</span></h1>
          <form className="search-big" action="/poisk/" role="search">
            <label htmlFor="q" className="sr">Что найти</label>
            <input id="q" name="q" type="search" defaultValue={q} placeholder="Например: Автозаводская, Силика, ПИК, КРТ Хапиловка" autoFocus />
            {t ? <input type="hidden" name="t" value={t} /> : null}
            <button className="btn" type="submit">Найти</button>
          </form>
          {q ? (
            <>
              <nav className="chips srch-tabs" aria-label="Тип результатов">
                {TABS.map((x) => {
                  const n = x.v ? counts[x.v] || 0 : Object.values(counts).reduce((a, b) => a + b, 0)
                  return x.v && !n ? null : <Link key={x.v} className={`chip${t === x.v ? ' on' : ''}`} href={href({ t: x.v })}>{x.label}<i>{n}</i></Link>
                })}
              </nav>
              {r && r.hits.length ? (
                <ol className="srch-list card">
                  {r.hits.map((h, i) => (
                    <li key={h.id}>
                      <TrackLink href={h.url} q={q} tab={t || undefined} position={(page - 1) * PER + i + 1}>
                        <span className="srch-t">{TYPE_LABEL[h.type]}{h.type === 'object' && h.stage ? <> · <StageStrip stage={h.stage} /></> : null}</span>
                        <b dangerouslySetInnerHTML={{ __html: hl(h._formatted?.title || h.title) }} />
                        {h.type === 'object' ? <small>{[h.developer, h.zu && h.zu !== h.title ? `ЗУ «${h.zu}»` : null, h.district].filter(Boolean).join(' · ')}</small> : null}
                        {h._formatted?.subtitle || h._formatted?.text ? <p dangerouslySetInnerHTML={{ __html: hl(h._formatted?.subtitle || h._formatted?.text) }} /> : null}
                      </TrackLink>
                    </li>
                  ))}
                </ol>
              ) : <p className="empty">Ничего не нашли. Попробуйте адрес участка, старое название проекта или застройщика — объект в базе часто записан по ним.</p>}
              {pages > 1 ? (
                <nav className="pager" aria-label="Страницы">
                  {page > 1 ? <Link href={href({ t, p: page - 1 })}>← Назад</Link> : <span />}
                  <span>{page} из {pages}</span>
                  {page < pages ? <Link href={href({ t, p: page + 1 })}>Дальше →</Link> : <span />}
                </nav>
              ) : null}
            </>
          ) : null}
        </>
      )
    }
  }
  // запасной поиск по базе — если Meilisearch не подключён или недоступен
  const payload = await getPayload({ config })
  const objs = q ? (await payload.find({ collection: 'objects', depth: 1, limit: 20, where: { or: [{ name: { like: q } }, { zu: { like: q } }, { 'aliases.value': { like: q } }] } })).docs : []
  const devs = q ? (await payload.find({ collection: 'developers', limit: 20, where: { name: { like: q } } })).docs : []
  const arts = q ? (await payload.find({ collection: 'articles', depth: 1, limit: 30, where: pub({ or: [{ title: { like: q } }, { lead: { like: q } }, { mainQuery: { like: q } }] }) })).docs : []
  const total = objs.length + devs.length + arts.length
  return (
    <>
      <h1 className="page-h tt">Поиск<span>{q ? `«${q}»` : 'по объектам, адресам и застройщикам'}</span></h1>
      <form className="search-big" action="/poisk/" role="search">
        <label htmlFor="q" className="sr">Что найти</label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Например: Автозаводская, Силика, ПИК" autoFocus />
        <button className="btn" type="submit">Найти</button>
      </form>
      {q && !total ? <p className="empty">Ничего не нашли. Попробуйте адрес участка или старое название проекта: объект в базе часто записан по ним.</p> : null}
      {objs.length ? (
        <section className="sec"><div className="sec-h"><h2 className="tt">Объекты<span>{objs.length}</span></h2></div>
          <ul className="rows card">{objs.map((o) => <li key={o.id}><Link href={`/obekty/${o.slug}/`}><span className="t">{o.name}</span><StageStrip stage={o.stage} /><span className="s">{devName((o.developer as Developer | undefined)?.name)}{o.zu ? <span className="zu"><b>ЗУ</b>{o.zu}</span> : null}</span></Link></li>)}</ul>
        </section>
      ) : null}
      {devs.length ? (
        <section className="sec"><div className="sec-h"><h2 className="tt">Застройщики<span>{devs.length}</span></h2></div>
          <ul className="rows card">{devs.map((d) => <li key={d.id}><Link href={`/zastroyshchiki/${d.slug}/`}><span className="t">{devName(d.name)}</span><span /></Link></li>)}</ul>
        </section>
      ) : null}
      {arts.length ? (
        <section className="sec"><div className="sec-h"><h2 className="tt">Материалы<span>{arts.length}</span></h2></div>
          <div className="a-grid">{arts.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </section>
      ) : null}
    </>
  )
}
