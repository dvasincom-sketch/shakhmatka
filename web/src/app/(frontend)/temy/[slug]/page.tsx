import { CrumbsLd } from '@/lib/jsonld'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ArticleCard, SITE, ogFor } from '@/lib/ui'
import { topicSubject } from '@/lib/topics'
import { pub } from '@/lib/public'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'

async function load(slug: string) {
  const payload = await getPayload({ config })
  const s = decodeURIComponent(slug)
  return { s, arts: (await payload.find({ collection: 'articles', where: pub({ 'topics.value': { equals: s } }), sort: '-datePublished', limit: 60, depth: 1 })).docs }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { s, arts } = await load((await params).slug)
  if (!arts.length) return {}
  return {
    title: `${topicSubject(s)}: новости и разборы`,
    description: `${topicSubject(s)} — материалы Шахматки: ${arts.slice(0, 2).map((a) => a.title).join('; ')}.`.slice(0, 160),
    alternates: { canonical: `${SITE}/temy/${s}/` },
    openGraph: ogFor(`${SITE}/temy/${s}/`),
    // тема с 1–2 материалами — пока тонкая страница
    robots: arts.length >= 3 ? undefined : { index: false, follow: true },
  }
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { s, arts } = await load((await params).slug)
  if (!arts.length) notFound()
  return (
    <>
      <CrumbsLd items={[['Лента', '/'], ['Темы', '/temy/'], [topicSubject(s), `/temy/${s}/`]]} />
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><Link href="/temy/">Темы</Link><span>/</span><span>{topicSubject(s)}</span></nav>
      <h1 className="page-h tt">{topicSubject(s)}<span>{arts.length} мат.</span></h1>
      <div className="a-grid sec">{arts.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
    </>
  )
}
