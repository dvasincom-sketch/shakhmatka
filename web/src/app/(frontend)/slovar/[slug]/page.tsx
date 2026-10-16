import type { Metadata } from 'next'
import { redirectIfCyrillic } from '@/lib/cyr-redirect'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ArticleCard, SITE } from '@/lib/ui'
import { renderArticle } from '@/lib/markdown'
import { withWideImages } from '@/lib/media-wide'
import { getResolver } from '@/lib/site-links'
import { autolink, getAutolinks } from '@/lib/autolink'
import { pub } from '@/lib/public'
import { JsonLd } from '@/lib/jsonld'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'

async function getTerm(slug: string) {
  const payload = await getPayload({ config })
  return (await payload.find({ collection: 'terms', where: { and: [{ slug: { equals: decodeURIComponent(slug) } }, { published: { equals: true } }] }, limit: 1 })).docs[0]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  await redirectIfCyrillic('slovar', (await params).slug)
  const t = await getTerm((await params).slug)
  if (!t) return {}
  return {
    title: `${t.term}${t.full ? ` (${t.full.toLowerCase()})` : ''}: что это простыми словами`,
    description: t.short,
    alternates: { canonical: `${SITE}/slovar/${t.slug}/` },
  }
}

export default async function TermPage({ params }: { params: Promise<{ slug: string }> }) {
  await redirectIfCyrillic('slovar', (await params).slug)
  const t = await getTerm((await params).slug)
  if (!t) notFound()
  const payload = await getPayload({ config })
  // статьи, где есть ссылка на этот термин
  const arts = (await payload.find({ collection: 'articles', where: pub({ body: { like: `/slovar/${t.slug}/` } }), sort: '-datePublished', limit: 4, depth: 1 })).docs
  const url = `${SITE}/slovar/${t.slug}/`
  const ld = [
    { '@context': 'https://schema.org', '@type': 'DefinedTerm', name: t.term, alternateName: t.full || undefined, description: t.short, url, inDefinedTermSet: `${SITE}/slovar/` },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Лента', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Словарь', item: `${SITE}/slovar/` }, { '@type': 'ListItem', position: 3, name: t.term, item: url }] },
  ]
  return (
    <article>
      <JsonLd data={ld} />
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><Link href="/slovar/">Словарь</Link><span>/</span><span>{t.term}</span></nav>
      <h1 className="page-h tt">{t.term}{t.full ? <span>{t.full}</span> : null}</h1>
      <div className="page-text">
        <p className="term-short">{t.short}</p>
        {t.body ? <div className="body" dangerouslySetInnerHTML={{ __html: await withWideImages(autolink(renderArticle(t.body, { resolve: await getResolver() }), await getAutolinks())) }} /> : null}
        {t.sources?.length ? <><h2>Источники</h2><ul>{t.sources.map((s) => <li key={s.id}>{s.url ? <a href={s.url} target="_blank" rel="noopener">{s.title || s.url}</a> : s.title}</li>)}</ul></> : null}
      </div>
      {arts.length ? (
        <section className="sec"><div className="sec-h"><h2 className="tt">Где встречается<span>в материалах</span></h2></div>
          <div className="a-grid">{arts.map((a) => <ArticleCard key={a.id} a={a} />)}</div></section>
      ) : null}
    </article>
  )
}
