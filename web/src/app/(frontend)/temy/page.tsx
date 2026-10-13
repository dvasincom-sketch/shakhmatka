import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SITE } from '@/lib/ui'
import { topicSubject } from '@/lib/topics'
import { pub } from '@/lib/public'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Темы: цены, ипотека, регулирование', description: 'Материалы Шахматки по темам: цены на новостройки, ипотека, законы и регулирование, рынок.', alternates: { canonical: `${SITE}/temy/` } }

export default async function Topics() {
  const payload = await getPayload({ config })
  const arts = (await payload.find({ collection: 'articles', where: pub(), limit: 100000, pagination: false, depth: 0, select: { topics: true } })).docs
  const count = new Map<string, number>()
  arts.forEach((a) => (a.topics || []).forEach((t) => t.value && count.set(t.value, (count.get(t.value) || 0) + 1)))
  return (
    <>
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><span>Темы</span></nav>
      <h1 className="page-h tt">Темы<span>материалов</span></h1>
      <div className="hub card"><div className="chips wrap">
        {[...count.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => <Link key={k} className="chip" href={`/temy/${k}/`}>{topicSubject(k)}<i>{n}</i></Link>)}
      </div></div>
    </>
  )
}
