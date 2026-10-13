import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ArticleCard, SITE, StageStrip, devName, stageLabel } from '@/lib/ui'
import { pub } from '@/lib/public'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'

async function load(slug: string) {
  const payload = await getPayload({ config })
  const d = (await payload.find({ collection: 'developers', where: { slug: { equals: decodeURIComponent(slug) } }, limit: 1 })).docs[0]
  if (!d) return null
  const objs = (await payload.find({ collection: 'objects', where: { developer: { equals: d.id } }, limit: 100 })).docs
  const arts = (await payload.find({ collection: 'articles', where: pub({ developers: { contains: d.id } }), sort: '-datePublished', limit: 50, depth: 1 })).docs
  return { d, objs, arts }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const x = await load((await params).slug)
  if (!x) return {}
  const name = devName(x.d.name)
  return { title: `${name}: проекты, новости, судебные риски`, description: `Застройщик ${name}: объекты в базе Шахматки, проверенные новости и аналитика.`, alternates: { canonical: `${SITE}/zastroyshchiki/${x.d.slug}/` } }
}

export default async function DeveloperPage({ params }: { params: Promise<{ slug: string }> }) {
  const x = await load((await params).slug)
  if (!x) notFound()
  const { d, objs, arts } = x
  const name = devName(d.name)
  return (
    <>
      <nav className="crumbs"><Link href="/">Лента</Link><span>/</span><Link href="/zastroyshchiki/">Застройщики</Link><span>/</span><span>{name}</span></nav>
      <div className="dev-h"><span className="dev-mono" aria-hidden="true">{name.replace(/^(ГК|ПАО|АО|ООО)\s*/, '').replace(/[«»"]/g, '').slice(0, 2).toUpperCase()}</span><h1 className="tt">{name}<span>{arts.length} мат. в Шахматке</span></h1></div>
      {objs.length ? (
        <section className="sec"><div className="sec-h"><h2 className="tt">Объекты<span>в базе</span></h2></div>
          <ul className="rows card">{objs.map((o) => <li key={o.id}><Link href={`/obekty/${o.slug}/`}><span className="t">{o.name}</span><StageStrip stage={o.stage} /><span className="s">{stageLabel(o.stage)}{o.zu ? <span className="zu"><b>ЗУ</b>{o.zu}</span> : null}</span></Link></li>)}</ul>
        </section>
      ) : null}
      <section className="sec"><div className="sec-h"><h2 className="tt">Материалы<span>о компании</span></h2></div>
        <div className="a-grid">{arts.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
      </section>
      <section className="sec"><div className="sec-h"><h2 className="tt">Судебные риски<span>застройщика</span></h2></div>
        <div className="courts"><b>Проверка по официальным источникам появится после запуска</b><p className="note">Иски дольщиков в Мосгорсуде и районных судах, арбитражные дела, исполнительные производства ФССП.</p></div>
      </section>
    </>
  )
}
