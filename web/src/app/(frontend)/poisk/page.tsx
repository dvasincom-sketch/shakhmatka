import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ArticleCard, StageStrip, devName } from '@/lib/ui'
import type { Developer } from '@/payload-types'
import { pub } from '@/lib/public'

export const metadata: Metadata = { title: 'Поиск', robots: { index: false, follow: true } }

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q || '').trim()
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
