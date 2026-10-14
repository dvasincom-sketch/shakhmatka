import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Where } from 'payload'
import { ArticleCard, SITE, TYPES } from '@/lib/ui'
import { pub } from '@/lib/public'
import { JsonLd } from '@/lib/jsonld'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'

type SP = { type?: string; page?: string }
const PER = 24

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams
  const page = Number(sp.page) > 1 ? Number(sp.page) : 1
  return {
    title: page > 1 ? `Новости новостроек Москвы — страница ${page}` : 'Новости новостроек Москвы: проверенные материалы',
    description: 'Все материалы Шахматки о новостройках Москвы и регионов: старты продаж, сделки с участками, КРТ, архитектура и застройщики. Каждый факт сверен с источниками.',
    alternates: { canonical: `${SITE}/novosti/${!sp.type && page > 1 ? `?page=${page}` : ''}` },
    // разрезы по рубрике не индексируем — это те же статьи, что и в общей ленте
    robots: sp.type ? { index: false, follow: true } : undefined,
  }
}

export default async function News({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const type = sp.type && TYPES[sp.type] ? sp.type : undefined
  const page = Number(sp.page) > 1 ? Math.floor(Number(sp.page)) : 1
  const payload = await getPayload({ config })
  const where: Where | undefined = type ? { type: { equals: type } } : undefined
  const [res, all] = await Promise.all([
    payload.find({ collection: 'articles', where: pub(where), sort: '-datePublished', limit: PER, page, depth: 1 }),
    payload.find({ collection: 'articles', where: pub(), limit: 10000, pagination: false, depth: 0, select: { type: true } }),
  ])
  const counts: Record<string, number> = {}
  all.docs.forEach((a) => { if (a.type) counts[a.type] = (counts[a.type] || 0) + 1 })
  const href = (p: { type?: string; page?: number }) => {
    const q = new URLSearchParams()
    if (p.type) q.set('type', p.type)
    if (p.page && p.page > 1) q.set('page', String(p.page))
    const s = q.toString()
    return `/novosti/${s ? `?${s}` : ''}`
  }
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Лента', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Новости', item: `${SITE}/novosti/` },
    ],
  }

  return (
    <>
      <JsonLd data={ld} />
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><span>Новости</span></nav>
      <h1 className="page-h tt">Новости<span>с проверкой фактов</span></h1>
      <p className="hello-sub">Все материалы Шахматки — от свежих к старым. Дата в карточке — когда событие произошло; факты в тексте сверены на дату обновления.</p>
      <div className="chips wrap news-f" role="group" aria-label="Рубрики">
        <Link className={`chip${!type ? ' on' : ''}`} href="/novosti/">Все<i>{all.docs.length}</i></Link>
        {Object.entries(TYPES).filter(([k]) => counts[k]).map(([k, label]) => (
          <Link key={k} className={`chip${type === k ? ' on' : ''}`} href={href({ type: k })}>{label}<i>{counts[k]}</i></Link>
        ))}
      </div>
      {res.docs.length ? (
        <div className="a-grid news-grid">{res.docs.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
      ) : (
        <p className="empty">Материалов пока нет.</p>
      )}
      {res.totalPages > 1 ? (
        <nav className="pager" aria-label="Страницы">
          {page > 1 ? <Link href={href({ type, page: page - 1 })} rel="prev">← Новее</Link> : <span />}
          <span className="pg">{page} из {res.totalPages}</span>
          {page < res.totalPages ? <Link href={href({ type, page: page + 1 })} rel="next">Старее →</Link> : <span />}
        </nav>
      ) : null}
    </>
  )
}
