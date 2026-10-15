import { monthGen } from '@/lib/months'
import type { Metadata } from 'next'
import Link from 'next/link'
import { FollowButton } from '@/lib/follow-button'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ArticleCard, SITE, STAGES, StageTrack, devName, coverOf } from '@/lib/ui'
import type { Developer, Media, Object as Obj } from '@/payload-types'
import { pub } from '@/lib/public'
import { CLASS_LABELS, districtName, priceText, regionName } from '@/lib/geo'
import { CLASS_SOURCES } from '@/lib/classes'
import { bureausOf } from '@/lib/architects'
import { TROUBLE_BADGE, troubleOf } from '@/lib/trouble'
import { START_PRICES } from '@/lib/start-prices'
import { typo } from '@/lib/markdown'
import { JsonLd } from '@/lib/jsonld'
import { getUser } from '@/lib/auth'
import { GalleryEditor } from '@/lib/staff'
import { ObjGallery } from '@/lib/obj-gallery'
import { relFor } from '@/lib/markdown'
import { signalHref, signalSlugs, isSnapshot, outcomeLabel } from '@/lib/signals'

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
  const clsSrc = o.class ? CLASS_SOURCES[o.slug] : undefined
  const classTerm = o.class ? (await payload.find({ collection: 'terms', where: { and: [{ slug: { equals: 'klass-zhilya' } }, { published: { equals: true } }] }, limit: 1, depth: 0 })).docs[0] : undefined
  const troubleTerm = (await payload.find({ collection: 'terms', where: { and: [{ slug: { equals: 'problemnyy-proekt' } }, { published: { equals: true } }] }, limit: 1, depth: 0 })).docs[0]
  return { o, arts, place, clsSrc, classTerm, troubleTerm }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = await load((await params).slug)
  if (!d) return {}
  const { o } = d
  const hero = (o.gallery?.[0] as Media | undefined) || coverOf(d.arts.find((a) => coverOf(a.heroImage))?.heroImage)
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
  const { o, arts, place, clsSrc, classTerm, troubleTerm } = d
  const user = await getUser()
  const dev = o.developer as Developer | undefined
  const prev = (o.previousDevelopers || []) as Developer[]
  const i = STAGES.findIndex((s) => s.value === o.stage)
  const gallery = ((o.gallery || []) as Media[]).filter((m) => m?.url)
  const heroPick = gallery.length ? gallery : [coverOf(arts.find((a) => coverOf(a.heroImage))?.heroImage)].filter((m): m is Media => !!m?.url)
  const pics = heroPick.map((m) => ({ id: m.id, url: m.url!, thumb: m.sizes?.card?.url || m.url!, alt: m.alt, caption: m.caption, width: m.width, height: m.height }))
  const hero = gallery[0] || coverOf(arts.find((a) => coverOf(a.heroImage))?.heroImage)
  const price = priceText(o)
  const sp = START_PRICES.find((r) => r.slug === o.slug)
  const where = place?.name || (o.region === 'moscow' ? districtName(o.district) || 'Москва' : regionName(o.region))
  const timeline = [...(o.timeline || [])].sort((a, b) => +new Date(a.date) - +new Date(b.date))
  const years = [...new Set(timeline.map((t) => (t.dateLabel && /до/.test(t.dateLabel) ? t.dateLabel : String(year(t.date)))))]
  const firstSale = timeline.find((t) => t.kind === 'sales' && /старт/i.test(t.title))
  const neighbors = o.neighbors || []
  const owners = o.owners || []
  const signals = timeline.filter((t) => t.certainty === 'signal')
  const sigSlugs = signalSlugs(o.slug, o.timeline)
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
          <FollowButton kind="object" id={o.slug} label={o.name} hint="Пришлём письмо, когда в досье появятся новые события, сигналы или материалы." />
          {o.summary ? <p className="obj-sum">{typo(o.summary)}</p> : null}
          <div className="zus">
            {o.zu ? <Link className="zu" href={`/poisk/?q=${encodeURIComponent(o.zu)}`} title="Найти всё по адресу участка"><b>ЗУ</b>{o.zu}</Link> : null}
            {(o.aliases || []).filter((a) => a.value && a.value !== o.zu && a.value !== o.name).map((a) => <Link key={a.id} className="pill pill-q" href={`/poisk/?q=${encodeURIComponent(a.value!)}`} title="Другое название — найти упоминания">{a.value}</Link>)}
            {dev ? <Link className="pill" href={`/zastroyshchiki/${dev.slug}/`}>{devName(dev.name)}</Link> : null}
            {prev.map((p) => <Link key={p.id} className="pill" href={`/zastroyshchiki/${p.slug}/`}>ранее {devName(p.name)}</Link>)}
          </div>
          {(() => {
            const tr = troubleOf(o.slug)
            if (!tr) return null
            const ym = (x: string | null, M = MONTHS) => (x ? (x.length > 4 ? `${M[+x.slice(5, 7) - 1]} ${x.slice(0, 4)}` : `${x} год`) : '')
            return (
              <section className={`trouble card tr-${tr.status}`} aria-label="Проблемы проекта">
                <p className="tr-h"><b>{TROUBLE_BADGE[tr.status]}</b><span>{tr.label}{tr.since ? ` · с ${ym(tr.since).replace(' год', ' года')}` : ''}{tr.status === 'resolved' && tr.resolvedOn ? ` · решено: ${ym(tr.resolvedOn, MONTHS_N)}` : ''}</span></p>
                <p className="tr-sum">{typo(tr.summary)}</p>
                {tr.facts.length ? (
                  <ol className="tr-facts">
                    {tr.facts.map((f, k) => <li key={k}><time>{f.date.length > 4 ? f.date.slice(0, 7).split('-').reverse().join('.') : f.date}</time><span>{typo(f.text)} <a className="muted-link" href={f.source} target="_blank" rel={relFor(f.source)}>источник</a></span></li>)}
                  </ol>
                ) : null}
                <small>Проверено по открытым источникам {tr.checked.split('-').reverse().join('.')}{troubleTerm ? <> · <Link className="muted-link" href="/slovar/problemnyy-proekt/">как мы отмечаем</Link></> : null}</small>
              </section>
            )
          })()}
          {bureausOf(o.slug).length ? (
            <p className="obj-arch"><span>Архитекторы</span>{bureausOf(o.slug).map((b) => <Link key={b.key} className="pill" href={`/arhitektory/${b.key}/`}>{b.name}</Link>)}</p>
          ) : null}
          {i >= 0 ? (
            <section className="stage card"><div className="row"><span className="num">{i + 1}<span className="fr">/6</span></span><p className="lbl">Стадия<b>{STAGES[i].label}</b></p></div><StageTrack stage={o.stage} /></section>
          ) : null}
          <dl className="ofacts card">
            {price ? <div><dt>Цена</dt><dd>{price}</dd>{o.priceAsOf ? <small>{o.priceAsOf}</small> : null}</div> : null}
            {!price && firstSale ? <div><dt>В продаже</dt><dd>с {MONTHS[new Date(firstSale.date).getUTCMonth()]} {year(firstSale.date)}</dd><small>старт продаж</small></div> : null}
            {sp ? <div><dt>На старте → сейчас</dt><dd><Link href="/ceny-na-starte/">{sp.changePct > 0 ? '+' : ''}{Math.round(sp.changePct)}%</Link></dd><small>от {sp.start.lot_from.toLocaleString('ru-RU')} → от {sp.now.lot_from.toLocaleString('ru-RU')} млн ₽ с {sp.start.date.slice(0, 4)} года</small></div> : null}
            {o.completion ? <div><dt>Ввод</dt><dd>{o.completion}</dd></div> : null}
            {o.class ? (
              <div>
                <dt>Класс</dt>
                <dd><Link href={`/obekty/?class=${o.class}`}>{CLASS_LABELS[o.class] || o.class}</Link></dd>
                <small>
                  {clsSrc ? (clsSrc.s ? <>заявлен · <a className="muted-link" href={clsSrc.s} target="_blank" rel={relFor(clsSrc.s)}>{clsSrc.n}</a></> : <>заявлен · {clsSrc.n}</>) : 'заявленный'}
                  {classTerm ? <> · <Link className="muted-link" href="/slovar/klass-zhilya/">как определяем</Link></> : null}
                </small>
              </div>
            ) : null}
            <div><dt>Где</dt><dd>{place ? <Link href={`/novostroyki/${place.slug}/`}>{where}</Link> : where}</dd>{o.region === 'moscow' && o.district ? <small>{place?.okrug ? `${place.okrug}, ` : ''}Москва</small> : null}</div>
            {signals.length ? <div><dt>Сигналы</dt><dd><a href="#sig">{signals.length}</a></dd><small><a className="muted-link" href="#sig">{confirmed ? `${confirmed} уже подтвердились` : 'до официальных новостей'} →</a></small></div> : null}
            {o.legalEntity ? <div><dt>Застройщик по документам</dt><dd className="sm">{o.legalEntity}</dd></div> : null}
          </dl>
        </div>
        {pics.length ? <ObjGallery pics={pics} /> : null}
      </div>

      {owners.length ? (
        <section className="sec" aria-labelledby="h-own">
          <div className="sec-h"><h2 id="h-own" className="tt">Собственники<span>как менялся застройщик</span></h2></div>
          <ol className="owners">
            {owners.map((w, k) => {
              const d = w.developer as Developer | undefined
              const now = k === owners.length - 1 && !w.until
              return (
                <li key={w.id} className={`card${now ? ' now' : ''}`}>
                  <p className="ow-when">{[w.since && `с ${monthGen(w.since)}`, w.until && `по ${w.until}`].filter(Boolean).join(' ') || (now ? 'сейчас' : '')}{now ? <span className="pill sun">сейчас</span> : null}</p>
                  <p className="ow-who">{d?.slug ? <Link href={`/zastroyshchiki/${d.slug}/`}>{devName(d.name)}</Link> : devName(d?.name)}</p>
                  {w.how ? <p className="ow-how">{typo(w.how)}</p> : null}
                  {w.source?.startsWith('http') ? <a className="ow-src" href={w.source} target="_blank" rel={relFor(w.source)}>источник</a> : null}
                </li>
              )
            })}
          </ol>
        </section>
      ) : null}

      {signals.length ? (
        <section className="sec" id="sig" aria-labelledby="h-sig">
          <div className="sec-h"><h2 id="h-sig" className="tt">Сигналы<span>{confirmed ? `${confirmed} из ${signals.length} подтвердились` : 'что говорили до официальных новостей'}</span></h2><Link className="more" href="/signaly/">Все сигналы</Link></div>
          <ol className="sig-mini">
            {[...signals].reverse().map((t) => (
              <li key={t.id}><Link href={signalHref(sigSlugs.get(t.id!) || '')}><time dateTime={t.date.slice(0, 10)}>{dayMonth(t.date)} {year(t.date)}</time><span>{t.outcome && !isSnapshot(t) ? 'Участники рынка говорили: ' : ''}{typo(t.title)}</span>{t.confirmedOn ? <em className="tl-conf">подтвердилось</em> : t.outcome ? <em className={isSnapshot(t) ? 'tl-snap' : 'tl-unc'}>{outcomeLabel(t)}</em> : null}</Link></li>
            ))}
          </ol>
        </section>
      ) : null}

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
                          {t.outcome ? (isSnapshot(t) ? <span className="tl-snap" title="Цена или темп продаж на дату сигнала">срез на дату</span> : <span className="tl-unc">{outcomeLabel(t)}{t.checkedOn ? ` на ${monthYear(t.checkedOn)}` : ''}</span>) : null}
                          {t.verified ? <span className="tl-ok">сверено</span> : null}
                        </div>
                        <div className="tl-body">
                          <p className="tl-t">{t.outcome ? <span className="tl-said">Участники рынка говорили: </span> : null}{t.certainty === 'signal' && t.id && sigSlugs.get(t.id) ? <Link href={signalHref(sigSlugs.get(t.id)!)}>{typo(t.title)}</Link> : typo(t.title)}</p>
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
                  <div className={`ph${im?.url ? '' : ' ph-empty'}`}>{im?.url ? <img src={im.url} alt={im.alt} loading="lazy" /> : null}</div>
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
      {user ? (
        <div className="sec" id="foto">
          <GalleryEditor objectId={o.id} objectName={o.name} items={gallery.map((m) => ({ id: m.id, url: m.url!, alt: m.alt, caption: m.caption }))} />
        </div>
      ) : null}
      {/* Раздел «Суды» скрыт до подключения источников (Мосгорсуд, районные суды, арбитраж, ФССП, Федресурс) */}
    </>
  )
}
