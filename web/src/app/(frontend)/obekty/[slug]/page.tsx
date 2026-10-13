import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ArticleCard, SITE, STAGES, StageTrack, devName } from '@/lib/ui'
import type { Developer, Media, Object as Obj } from '@/payload-types'
import { pub } from '@/lib/public'
import { CLASS_LABELS, districtName, priceText, regionName } from '@/lib/geo'
import { typo } from '@/lib/markdown'
import { JsonLd } from '@/lib/jsonld'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'

const KIND: Record<string, string> = {
  land: 'Участок', krt: 'КРТ', tender: 'Торги', concept: 'Концепция', architecture: 'Архитектура', permit: 'Разрешение', sales: 'Продажи',
  price: 'Цены', deal: 'Сделка', construction: 'Стройка', court: 'Суд', other: 'Событие',
}
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const dayMonth = (iso: string) => { const d = new Date(iso); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}` }
const year = (iso: string) => new Date(iso).getUTCFullYear()
const MONTHS_N = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
const monthYear = (iso: string) => { const d = new Date(iso); return `${MONTHS_N[d.getUTCMonth()]} ${d.getUTCFullYear()}` }
/** Объект без своего названия называем по адресу участка */
const isPlot = (o: Obj) => !!o.zu && o.name === o.zu
const titleOf = (o: Obj) => (isPlot(o) ? `Участок «${o.name}»` : `ЖК «${o.name}»`)

async function load(slug: string) {
  const payload = await getPayload({ config })
  const o = (await payload.find({ collection: 'objects', where: { slug: { equals: decodeURIComponent(slug) } }, limit: 1, depth: 2 })).docs[0] as Obj | undefined
  if (!o) return null
  const arts = (await payload.find({ collection: 'articles', where: pub({ objects: { contains: o.id } }), sort: '-datePublished', limit: 50, depth: 1 })).docs
  const key = o.region === 'moscow' && o.district ? o.district : o.region || ''
  const place = (await payload.find({ collection: 'places', where: { key: { equals: key } }, limit: 1 })).docs[0]
  return { o, arts, place }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = await load((await params).slug)
  if (!d) return {}
  const { o } = d
  const hero = (o.gallery?.[0] as Media | undefined) || (d.arts.find((a) => a.heroImage)?.heroImage as Media | undefined)
  const description = o.summary || `Досье проекта «${o.name}»${o.zu ? ` (ЗУ «${o.zu}»)` : ''}: стадия, история, проверенные материалы Шахматки.`
  return {
    title: isPlot(o) ? `${titleOf(o)}: что строят, история проекта` : `${titleOf(o)}: история проекта, цены и сроки`,
    description: description.length > 165 ? description.slice(0, 162).replace(/\s+\S*$/, '') + '…' : description,
    alternates: { canonical: `${SITE}/obekty/${o.slug}/` },
    openGraph: { type: 'website', url: `${SITE}/obekty/${o.slug}/`, title: titleOf(o), description, locale: 'ru_RU', siteName: 'Шахматка', images: hero?.url ? [{ url: hero.url, alt: hero.alt }] : [{ url: '/og-default.png', width: 1200, height: 630 }] },
  }
}

export default async function ObjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const d = await load((await params).slug)
  if (!d) notFound()
  const { o, arts, place } = d
  const dev = o.developer as Developer | undefined
  const prev = (o.previousDevelopers || []) as Developer[]
  const i = STAGES.findIndex((s) => s.value === o.stage)
  const gallery = ((o.gallery || []) as Media[]).filter((m) => m?.url)
  const hero = gallery[0] || (arts.find((a) => a.heroImage)?.heroImage as Media | undefined)
  const price = priceText(o)
  const where = place?.name || (o.region === 'moscow' ? districtName(o.district) || 'Москва' : regionName(o.region))
  const timeline = [...(o.timeline || [])].sort((a, b) => +new Date(a.date) - +new Date(b.date))
  const years = [...new Set(timeline.map((t) => (t.dateLabel && /до/.test(t.dateLabel) ? t.dateLabel : String(year(t.date)))))]
  const firstSale = timeline.find((t) => t.kind === 'sales' && /старт/i.test(t.title))
  const neighbors = o.neighbors || []
  const signals = timeline.filter((t) => t.certainty === 'signal')
  const confirmed = signals.filter((t) => t.confirmedOn).length

  const url = `${SITE}/obekty/${o.slug}/`
  const ld = [
    {
      '@context': 'https://schema.org', '@type': isPlot(o) ? 'Place' : 'ApartmentComplex', name: titleOf(o), url, description: o.summary || undefined,
      address: { '@type': 'PostalAddress', streetAddress: o.zu || undefined, addressLocality: o.region === 'moscow' ? 'Москва' : regionName(o.region), addressCountry: 'RU' },
      image: gallery.slice(0, 3).map((m) => `${SITE}${m.url}`),
    },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Лента', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Объекты', item: `${SITE}/obekty/` },
      { '@type': 'ListItem', position: 3, name: o.name, item: url },
    ] },
  ]

  return (
    <>
      <JsonLd data={ld} />
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><Link href="/obekty/">Объекты</Link><span>/</span><span>{o.name}</span></nav>

      <div className="obj-head">
        <div>
          <h1 className="page-h tt">{o.name}{dev ? <span>{devName(dev.name)}</span> : null}</h1>
          {o.summary ? <p className="obj-sum">{typo(o.summary)}</p> : null}
          <div className="zus">
            {o.zu ? <span className="zu"><b>ЗУ</b>{o.zu}</span> : null}
            {(o.aliases || []).filter((a) => a.value !== o.zu && a.value !== o.name).map((a) => <span key={a.id} className="pill">{a.value}</span>)}
            {dev ? <Link className="pill" href={`/zastroyshchiki/${dev.slug}/`}>{devName(dev.name)}</Link> : null}
            {prev.map((p) => <Link key={p.id} className="pill" href={`/zastroyshchiki/${p.slug}/`}>ранее {devName(p.name)}</Link>)}
          </div>
          {i >= 0 ? (
            <section className="stage card"><div className="row"><span className="num">{i + 1}<span className="fr">/6</span></span><p className="lbl">Стадия<b>{STAGES[i].label}</b></p></div><StageTrack stage={o.stage} /></section>
          ) : null}
          <dl className="ofacts card">
            {price ? <div><dt>Цена</dt><dd>{price}</dd>{o.priceAsOf ? <small>{o.priceAsOf}</small> : null}</div> : null}
            {!price && firstSale ? <div><dt>В продаже</dt><dd>с {MONTHS[new Date(firstSale.date).getUTCMonth()]} {year(firstSale.date)}</dd><small>старт продаж</small></div> : null}
            {o.completion ? <div><dt>Ввод</dt><dd>{o.completion}</dd></div> : null}
            {o.class ? <div><dt>Класс</dt><dd>{CLASS_LABELS[o.class] || o.class}</dd></div> : null}
            <div><dt>Где</dt><dd>{place ? <Link href={`/novostroyki/${place.slug}/`}>{where}</Link> : where}</dd>{o.region === 'moscow' && o.district ? <small>{place?.okrug ? `${place.okrug}, ` : ''}Москва</small> : null}</div>
            {signals.length ? <div><dt>Сигналы</dt><dd>{signals.length}</dd><small>{confirmed ? `${confirmed} уже подтвердились` : 'до официальных новостей'}</small></div> : null}
            {o.legalEntity ? <div><dt>Застройщик по документам</dt><dd className="sm">{o.legalEntity}</dd></div> : null}
          </dl>
        </div>
        {hero?.url ? (
          <div className="obj-gal">
            <figure className="fig obj-fig"><img src={hero.url} alt={hero.alt} width={hero.width || undefined} height={hero.height || undefined} />{hero.caption ? <figcaption>{hero.caption}</figcaption> : null}</figure>
            {gallery.length > 1 ? (
              <div className="thumbs" aria-label="Фото проекта">
                {gallery.slice(1, 6).map((m) => <a key={m.id} href={m.url!} target="_blank" rel="noopener"><img src={m.url!} alt={m.alt} loading="lazy" /></a>)}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {timeline.length ? (
        <section className="sec" aria-labelledby="h-tl">
          <div className="sec-h"><h2 id="h-tl" className="tt">Хронология<span>от участка до продаж</span></h2></div>
          <p className="note tl-note">По данным редакции на дату события. <span className="tl-sig">Сигнал</span> — о событии говорили в кулуарах до официальных новостей. Отметка «сверено» — пункт подтверждён первоисточником.</p>
          <ol className="tl">
            {years.map((y) => (
              <li key={y} className="tl-year">
                <h3 className="tl-y">{y}</h3>
                <ol>
                  {timeline.filter((t) => (t.dateLabel && /до/.test(t.dateLabel) ? t.dateLabel : String(year(t.date))) === y).map((t) => {
                    const im = t.image as Media | undefined
                    return (
                      <li key={t.id} className={`tl-item k-${t.kind}${t.certainty === 'signal' ? ' is-sig' : ''}`}>
                        <div className="tl-meta">
                          <time dateTime={t.date.slice(0, 10)}>{t.dateLabel && !/до/.test(t.dateLabel) ? t.dateLabel : t.dateLabel ? '' : dayMonth(t.date)}</time>
                          <span className="tl-kind">{KIND[t.kind || 'other']}</span>
                          {t.certainty === 'signal' ? <span className="tl-sig">Сигнал</span> : null}
                          {t.confirmedOn ? <span className="tl-conf">подтвердилось: {monthYear(t.confirmedOn)}</span> : null}
                          {t.verified ? <span className="tl-ok">сверено</span> : null}
                        </div>
                        <div className="tl-body">
                          <p className="tl-t">{typo(t.title)}</p>
                          {t.text ? <p className="tl-x">{typo(t.text)}</p> : null}
                          {im?.url ? <figure className="tl-fig"><img src={im.url} alt={im.alt} loading="lazy" />{im.caption ? <figcaption>{im.caption}</figcaption> : null}</figure> : null}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {neighbors.length ? (
        <section className="sec" aria-labelledby="h-nb">
          <div className="sec-h"><h2 id="h-nb" className="tt">По соседству<span>что происходит рядом</span></h2></div>
          <div className="nb-grid">
            {neighbors.map((n) => {
              const im = n.image as Media | undefined
              const ref = n.object as Obj | undefined
              const inner = (
                <>
                  {im?.url ? <div className="ph"><img src={im.url} alt={im.alt} loading="lazy" /></div> : null}
                  <div className="tx">
                    {n.date ? <time dateTime={n.date.slice(0, 10)}>{dayMonth(n.date)} {year(n.date)}</time> : null}
                    <h3>{n.name}</h3>
                    {n.text ? <p>{typo(n.text)}</p> : null}
                  </div>
                </>
              )
              return ref?.slug ? <Link key={n.id} className="nb card" href={`/obekty/${ref.slug}/`}>{inner}</Link> : <div key={n.id} className="nb card">{inner}</div>
            })}
          </div>
        </section>
      ) : null}

      {arts.length ? (
        <section className="sec">
          <div className="sec-h"><h2 className="tt">Материалы<span>об объекте</span></h2></div>
          <div className="a-grid">{arts.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </section>
      ) : null}
      <section className="sec">
        <div className="sec-h"><h2 className="tt">Суды<span>и исполнительные производства</span></h2></div>
        <div className="courts"><b>Данные появятся после подключения источников</b><p className="note">Мосгорсуд и районные суды Москвы, арбитраж, ФССП, Федресурс.</p></div>
      </section>
    </>
  )
}
