import type { Metadata } from 'next'
import Link from 'next/link'
import { signalHref, signalSlugs } from '@/lib/signals'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isUpdated, renderArticle, readMinutes, ruDate, toc, typo, withDates } from '@/lib/markdown'
import { ArticleCard, SITE, StageStrip, StageTrack, TYPES, devName, stageLabel, coverOf, wideImg } from '@/lib/ui'
import { withWideImages } from '@/lib/media-wide'
import type { Article, Developer, Media, Object as Obj } from '@/payload-types'
import { ONLY_READY, pub } from '@/lib/public'
import { ReadingProgress, Share } from '@/lib/client'
import { getResolver } from '@/lib/site-links'
import { autolink, getAutolinks } from '@/lib/autolink'
import { JsonLd } from '@/lib/jsonld'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'

async function getArticle(slug: string) {
  const payload = await getPayload({ config })
  const res = await payload.find({ collection: 'articles', where: { slug: { equals: decodeURIComponent(slug) } }, limit: 1, depth: 2 })
  return res.docs[0] as Article | undefined
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const a = await getArticle(slug)
  if (!a) return {}
  const hero = wideImg(coverOf(a.heroImage))
  const url = `${SITE}/novosti/${a.slug}/`
  return {
    title: a.metaTitle || a.title,
    description: a.metaDescription || a.lead || undefined,
    alternates: { canonical: url },
    openGraph: { type: 'article', url, title: a.metaTitle || a.title, description: a.metaDescription || undefined, locale: 'ru_RU', siteName: 'Шахматка', images: hero?.url ? [{ url: hero.url, alt: hero.alt }] : [{ url: '/og-default.png', width: 1200, height: 630 }], publishedTime: a.datePublished || undefined, modifiedTime: a.dateModified || undefined },
  }
}

const FC: Record<string, string> = { confirmed: 'подтверждено', changed: 'изменилось', refuted: 'опровергнуто', unverified: 'не подтверждено' }

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const a = await getArticle(slug)
  if (!a || (ONLY_READY && a.reviewStatus !== 'ready')) notFound()
  const payload = await getPayload({ config })
  const hero = wideImg(coverOf(a.heroImage))
  const objects = (a.objects || []) as Obj[]
  const devs = (a.developers || []) as Developer[]
  const main = objects[0]
  const html0 = renderArticle(a.body || '', { skipImage: hero?.filename || undefined, resolve: await getResolver() })
  // первое упоминание застройщика, бюро или объекта — ссылка на его страницу
  const html = await withWideImages(autolink(html0, await getAutolinks()))
  const contents = toc(a.body || '')
  const fc = a.factcheck || []
  const count = (s: string) => fc.filter((x) => x.status === s).length
  const st = stageLabel(main?.stage)
  const devIds = devs.map((d) => d.id)
  const related = (await payload.find({
    collection: 'articles', depth: 1, limit: 4, sort: '-datePublished',
    where: pub({ and: [{ id: { not_equals: a.id } }, devIds.length ? { or: [{ developers: { in: devIds } }, { type: { equals: a.type } }] } : { type: { equals: a.type } }] }),
  })).docs
  const more = related.length < 3 ? (await payload.find({ collection: 'articles', depth: 1, limit: 4 - related.length, sort: '-datePublished', where: pub({ id: { not_in: [a.id, ...related.map((r) => r.id)] } }) })).docs : []
  const reads = [...related, ...more].slice(0, 4)

  // История проекта: окно хронологии досье вокруг события статьи — что было до и что случилось после
  const tl = [...(main?.timeline || [])].sort((x, y) => +new Date(x.date) - +new Date(y.date))
  const at = tl.findIndex((t) => t.sourceNote && t.sourceNote === a.sourceNoteId)
  const pivot = at >= 0 ? at : tl.findIndex((t) => a.datePublished && t.date >= a.datePublished)
  const from = pivot >= 0 ? Math.max(0, pivot - 3) : Math.max(0, tl.length - 6)
  const story = tl.slice(from, from + 7)
  const sig = signalSlugs(main?.slug || '', main?.timeline)

  const crumbsLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Лента', item: `${SITE}/` },
      ...(main ? [{ '@type': 'ListItem', position: 2, name: 'Объекты', item: `${SITE}/obekty/` }, { '@type': 'ListItem', position: 3, name: main.name, item: `${SITE}/obekty/${main.slug}/` }] : []),
      { '@type': 'ListItem', position: main ? 4 : 2, name: a.title, item: `${SITE}/novosti/${a.slug}/` },
    ],
  }

  return (
    <article className="art">
      <ReadingProgress />
      <JsonLd data={crumbsLd} />
      {a.schema ? <JsonLd data={withDates(a.schema, a.datePublished, a.dateModified)} /> : null}
      <header className="art-head">
        <nav className="crumbs" aria-label="Путь">
          <Link href="/">Лента</Link><span>/</span>
          {main ? <><Link href="/obekty/">Объекты</Link><span>/</span><Link href={`/obekty/${main.slug}/`}>{main.name}</Link></> : <span>{TYPES[a.type] || 'Материал'}</span>}
        </nav>
        {a.reviewStatus !== 'ready' ? <p className="review">Часть фактов в этой статье ещё сверяется с первоисточниками. Протокол проверки — в конце статьи.</p> : null}
        <div className="art-meta">
          {devs.slice(0, 2).map((d) => <Link key={d.id} className="pill" href={`/zastroyshchiki/${d.slug}/`}>{devName(d.name)}</Link>)}
          {st ? <span className={`pill ${main?.stage === 'sales' ? 'sun' : ''}`}>{st}</span> : <span className="pill">{TYPES[a.type]}</span>}
          <time dateTime={a.datePublished || undefined}>{ruDate(a.datePublished)}</time>
          {isUpdated(a.datePublished, a.dateModified) ? <span className="upd">обновлено <time dateTime={a.dateModified || undefined}>{ruDate(a.dateModified)}</time></span> : null}
          <span className="rd">{readMinutes(a.body || '')} мин чтения</span>
        </div>
        <h1>{typo(a.title)}</h1>
      </header>

      {hero?.url ? (
        <figure className="fig hero"><img src={hero.url} alt={hero.alt} width={hero.width || undefined} height={hero.height || undefined} />{hero.caption ? <figcaption>{hero.caption}</figcaption> : null}</figure>
      ) : null}

      <div className="art-grid">
        <div className="art-main">
          <div className="body" dangerouslySetInnerHTML={{ __html: html }} />
          {main && story.length >= 2 ? (
            <section className="story" aria-labelledby="h-story">
              <h2 id="h-story" className="tt">История проекта<span>{main.name}</span></h2>
              <p className="note story-note">По данным редакции на дату события. <span className="tl-sig">Сигнал</span> — о событии говорили до официальных новостей.</p>
              <ol className="story-list">
                {story.map((t) => {
                  const here = at >= 0 && t.id === tl[at].id
                  const after = at >= 0 && +new Date(t.date) > +new Date(tl[at].date)
                  return (
                    <li key={t.id} className={`${here ? 'here' : ''}${after ? ' after' : ''}${t.certainty === 'signal' ? ' sig' : ''}`}>
                      <time dateTime={t.date.slice(0, 10)}>{t.dateLabel || ruDate(t.date)}</time>
                      <p>{t.certainty === 'signal' && t.id && sig.get(t.id) ? <Link href={signalHref(sig.get(t.id)!)}>{typo(t.title)}</Link> : typo(t.title)}{here ? <b className="story-here">этот материал</b> : null}{t.certainty === 'signal' ? <span className="tl-sig">Сигнал</span> : null}</p>
                    </li>
                  )
                })}
              </ol>
              <Link className="more" href={`/obekty/${main.slug}/`}>Вся хронология — в досье «{main.name}» →</Link>
            </section>
          ) : null}
          <section className="check card" aria-labelledby="h-ck">
            <h2 id="h-ck" className="tt">Как мы проверяли<span>протокол фактчекинга</span></h2>
            <p className="note">Проверено утверждений: {fc.length}. Подтверждено — {count('confirmed')}, изменилось — {count('changed')}, опровергнуто — {count('refuted')}. Не вошло в текст как неподтверждённое — {count('unverified') + (a.removed?.length || 0)}. Дата проверки: {ruDate(a.dateModified)}.</p>
            <details>
              <summary>Показать протокол</summary>
              <ul>
                {fc.map((c, i) => (
                  <li key={i}><span className={`pill ${c.status === 'confirmed' ? 'ok' : c.status === 'changed' ? 'sun' : 'coral'}`}>{FC[c.status || ''] || c.status}</span><span>{c.claim}{c.source?.startsWith('http') ? <> — <a href={c.source} target="_blank" rel="noopener">источник</a></> : null}</span></li>
                ))}
              </ul>
            </details>
          </section>
          <Share url={`${SITE}/novosti/${a.slug}/`} title={a.title} />
          <p className="note byline">{a.author || 'Редакция Шахматки'}. Первая публикация — {ruDate(a.datePublished)}. {isUpdated(a.datePublished, a.dateModified) ? <>Факты проверены, материал обновлён {ruDate(a.dateModified)}.</> : <>Факты проверены {ruDate(a.dateModified)}.</>}</p>
        </div>

        <aside className="art-side" aria-label="Об объекте и статье">
          {main ? (
            <section className="side-card card">
              <p className="side-k">Объект</p>
              <Link className="side-title" href={`/obekty/${main.slug}/`}>{main.name}</Link>
              {devs[0] ? <p className="note">{devName(devs[0].name)}</p> : null}
              <div className="side-stage"><StageStrip stage={main.stage} /><b>{st}</b></div>
              <StageTrack stage={main.stage} />
              <dl>
                {main.zu ? <><dt>Участок</dt><dd>{main.zu}</dd></> : null}
                {main.aliases?.length ? <><dt>Другие названия</dt><dd>{main.aliases.map((x) => x.value).join(', ')}</dd></> : null}
              </dl>
              <Link className="btn ghost" href={`/obekty/${main.slug}/`}>Досье объекта</Link>
            </section>
          ) : null}
          {contents.length > 2 ? (
            <nav className="side-card card toc" aria-label="Содержание">
              <p className="side-k">Содержание</p>
              <ol>{contents.map((c) => <li key={c.id}><a href={`#${c.id}`}>{c.text}</a></li>)}</ol>
            </nav>
          ) : null}
          <section className="side-card card side-fc">
            <p className="side-k">Фактчекинг</p>
            <div className="fc-bar" role="img" aria-label={`Подтверждено ${count('confirmed')} из ${fc.length}`}>
              <i className="ok" style={{ flex: count('confirmed') }} /><i className="sun" style={{ flex: count('changed') }} /><i className="coral" style={{ flex: count('refuted') + count('unverified') }} />
            </div>
            <p className="note">{count('confirmed')} подтверждено · {count('changed')} изменилось · {count('refuted') + count('unverified')} снято. Проверено {ruDate(a.dateModified)}.</p>
            <a className="note link" href="#h-ck">Протокол проверки</a>
          </section>
        </aside>
      </div>

      {reads.length ? (
        <section className="sec reads" aria-labelledby="h-more">
          <div className="sec-h"><h2 id="h-more" className="tt">Читайте также<span>по теме</span></h2></div>
          <div className="a-grid">{reads.map((r) => <ArticleCard key={r.id} a={r} />)}</div>
        </section>
      ) : null}
    </article>
  )
}
