import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SITE, devName } from '@/lib/ui'
import { pub } from '@/lib/public'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Застройщики: проекты, новости, судебные риски', description: 'Застройщики Москвы и регионов: объекты, проверенные новости и аналитика Шахматки.', alternates: { canonical: `${SITE}/zastroyshchiki/` } }

export default async function Developers() {
  const payload = await getPayload({ config })
  const devs = (await payload.find({ collection: 'developers', limit: 5000, pagination: false, sort: 'name', depth: 0 })).docs
  const arts = (await payload.find({ collection: 'articles', where: pub(), limit: 5000, pagination: false, depth: 0, select: { developers: true } })).docs
  const objs = (await payload.find({ collection: 'objects', limit: 10000, pagination: false, depth: 0, select: { developer: true } })).docs
  const na = new Map<unknown, number>(), no = new Map<unknown, number>()
  arts.forEach((a) => (a.developers || []).forEach((d) => na.set(d, (na.get(d) || 0) + 1)))
  objs.forEach((x) => x.developer && no.set(x.developer, (no.get(x.developer) || 0) + 1))
  const list = devs.map((d) => ({ d, a: na.get(d.id) || 0, o: no.get(d.id) || 0 })).filter((x) => x.a || x.o).sort((x, y) => y.a + y.o / 3 - (x.a + x.o / 3))
  return (
    <>
      <nav className="crumbs"><Link href="/">Лента</Link><span>/</span><span>Застройщики</span></nav>
      <h1 className="page-h tt">Застройщики<span>в материалах Шахматки</span></h1>
      <div className="dev-grid sec">
        {list.map(({ d, a, o }) => (
          <Link key={d.id} className="dcard card" href={`/zastroyshchiki/${d.slug}/`}>
            <span className="mono">{devName(d.name).replace(/^(ГК|ПАО|АО|ООО)\s*/, '').replace(/[«»"]/g, '').slice(0, 2).toUpperCase()}</span>
            <span><b>{devName(d.name)}</b><small>{a} мат.{o ? ` · ${o} объект.` : ''}</small></span>
          </Link>
        ))}
      </div>
    </>
  )
}
