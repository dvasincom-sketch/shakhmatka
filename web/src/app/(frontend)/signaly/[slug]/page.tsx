import type { Metadata } from 'next'
import { redirectIfCyrillic } from '@/lib/cyr-redirect'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ArticleCard, SITE, StageStrip, devName, stageLabel, ogFor } from '@/lib/ui'
import { districtName, plural, regionName } from '@/lib/geo'
import { typo } from '@/lib/markdown'
import { JsonLd } from '@/lib/jsonld'
import { pub } from '@/lib/public'
import { isSnapshot, parseSignalSlug, signalHref, signalSlugs } from '@/lib/signals'
import type { Developer, Object as Obj } from '@/payload-types'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const MONTHS_N = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
const dm = (iso: string) => { const d = new Date(iso); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} года` }
const my = (iso: string) => { const d = new Date(iso); return `${MONTHS_N[d.getUTCMonth()]} ${d.getUTCFullYear()}` }
const months = (a: string, b: string) => Math.max(0, Math.round((+new Date(b) - +new Date(a)) / (30.44 * 864e5)))
const KIND: Record<string, string> = {
  land: 'Участок', krt: 'КРТ', tender: 'Торги', concept: 'Концепция', architecture: 'Архитектура', permit: 'Разрешение', sales: 'Продажи',
  price: 'Цены', deal: 'Сделка', construction: 'Стройка', court: 'Суд', other: 'Событие',
}
type TL = NonNullable<Obj['timeline']>[number]

async function load(slug: string) {
  const p = parseSignalSlug(slug)
  if (!p) return null
  const payload = await getPayload({ config })
  const o = (await payload.find({ collection: 'objects', where: { slug: { equals: p.obj } }, limit: 1, depth: 1 })).docs[0] as Obj | undefined
  if (!o) return null
  const slugs = signalSlugs(o.slug, o.timeline)
  const full = decodeURIComponent(slug)
  const s = (o.timeline || []).find((t) => t.id && slugs.get(t.id) === full)
  if (!s) return null
  const arts = (await payload.find({ collection: 'articles', where: pub({ objects: { contains: o.id } }), sort: '-datePublished', limit: 6, depth: 1 })).docs
  // статья, которая подтвердила или разобрала этот сигнал (по номеру заметки архива)
  const proof = s.sourceNote ? (await payload.find({ collection: 'articles', where: pub({ sourceNoteId: { equals: s.sourceNote } }), limit: 1, depth: 0 })).docs[0] : undefined
  return { o, s, slugs, arts, proof }
}

const statusOf = (s: TL) =>
  s.confirmedOn ? 'confirmed' : isSnapshot(s) ? 'snapshot' : s.outcome ? 'unconfirmed' : 'pending'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  await redirectIfCyrillic('signaly', (await params).slug)
  const d = await load((await params).slug)
  if (!d) return {}
  const { o, s, slugs } = d
  const st = statusOf(s)
  const url = `${SITE}${signalHref(slugs.get(s.id!)!)}`
  const head = st === 'confirmed' ? 'Сигнал подтвердился' : st === 'unconfirmed' ? 'Сигнал не подтвердился' : st === 'snapshot' ? `Рынок на ${dm(s.date)}` : 'Сигнал'
  const description = `${head}: ${s.title}`.replace(/\s+/g, ' ')
  return {
    title: `${o.name}: ${st === 'confirmed' ? 'подтвердившийся сигнал' : 'сигнал'} от ${dm(s.date).replace(' года', '')}`.slice(0, 60),
    description: description.length > 165 ? description.slice(0, 162).replace(/\s+\S*$/, '') + '…' : description,
    alternates: { canonical: url },
    // неподтвердившиеся сигналы не отдаём в поиск: страница нужна читателям досье, а не для тиражирования слуха
    robots: st === 'unconfirmed' || st === 'snapshot' ? { index: false, follow: true } : undefined,
    openGraph: { ...ogFor(url, `${o.name}: ${head.toLowerCase()}`, description), type: 'article' },
  }
}

export default async function SignalPage({ params }: { params: Promise<{ slug: string }> }) {
  await redirectIfCyrillic('signaly', (await params).slug)
  const d = await load((await params).slug)
  if (!d) notFound()
  const { o, s, slugs, arts, proof } = d
  const st = statusOf(s)
  const dev = o.developer as Developer | undefined
  const where = o.region === 'moscow' ? (o.district ? districtName(o.district) : 'Москва') : regionName(o.region)
  const tl = [...(o.timeline || [])].sort((a, b) => +new Date(a.date) - +new Date(b.date))
  const at = tl.findIndex((t) => t.id === s.id)
  const before = tl.slice(Math.max(0, at - 3), at)
  const after = tl.slice(at + 1, at + 6)
  const others = tl.filter((t) => t.certainty === 'signal' && t.id !== s.id).reverse().slice(0, 6)
  const lead = s.confirmedOn ? months(s.date, s.confirmedOn) : 0
  const url = `${SITE}${signalHref(slugs.get(s.id!)!)}`
  const now = st === 'snapshot' ? [o.priceFrom ? `от ${String(o.priceFrom).replace('.', ',')} млн ₽` : null, o.priceM2From ? `от ${o.priceM2From.toLocaleString('ru-RU')} тыс. ₽ за м²` : null].filter(Boolean).join(' · ') : ''

  const ld = {
    '@type': 'WebPage', name: s.title, url, inLanguage: 'ru', datePublished: s.date.slice(0, 10),
    about: { '@type': 'Place', name: o.name, url: `${SITE}/obekty/${o.slug}/` },
    breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Лента', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Сигналы', item: `${SITE}/signaly/` },
      { '@type': 'ListItem', position: 3, name: o.name, item: url },
    ] },
  }

  const Item = ({ t }: { t: TL }) => (
    <li className={`tl-item k-${t.kind}${t.certainty === 'signal' ? ' is-sig' : ''}`}>
      <div className="tl-meta">
        <time dateTime={t.date.slice(0, 10)}>{t.dateLabel || dm(t.date).replace(' года', '')}</time>
        <span className="tl-kind">{KIND[t.kind || 'other']}</span>
        {t.certainty === 'signal' ? <span className="tl-sig">Сигнал</span> : null}
        {t.confirmedOn ? <span className="tl-conf">подтвердилось</span> : null}
        {t.outcome ? (isSnapshot(t) ? <span className="tl-snap">срез на дату</span> : <span className="tl-unc">{t.outcome === 'refuted' ? 'опровергнуто' : 'не подтвердилось'}</span>) : null}
      </div>
      <div className="tl-body">
        <p className="tl-t">{t.certainty === 'signal' && t.id && slugs.get(t.id) ? <Link href={signalHref(slugs.get(t.id)!)}>{typo(t.title)}</Link> : typo(t.title)}</p>
      </div>
    </li>
  )

  return (
    <>
      <JsonLd data={ld} />
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><Link href="/signaly/">Сигналы</Link><span>/</span><span>{o.name}</span></nav>

      <article className="sig-page">
        <div className="sig-meta">
          <span className="tl-sig">Сигнал</span>
          <time dateTime={s.date.slice(0, 10)}>{dm(s.date)}</time>
          <span className="tl-kind">{KIND[s.kind || 'other']}</span>
        </div>
        <h1 className="sig-h">{st === 'unconfirmed' ? <span className="tl-said">Участники рынка говорили: </span> : st === 'snapshot' ? <span className="tl-said">Рынок на {dm(s.date).replace(' года', '')}: </span> : null}{typo(s.title)}</h1>
        {s.text ? <p className="sig-lead">{typo(s.text)}</p> : null}

        <div className={`sig-status card st-${st}`}>
          {st === 'confirmed' ? (
            <>
              <b>Подтвердилось — {my(s.confirmedOn!)}</b>
              <p>{lead ? `Сигнал опередил официальные новости на ${lead} ${plural(lead, 'месяц', 'месяца', 'месяцев')}.` : 'Подтверждение пришло в том же месяце.'} {proof ? 'Как это было — в материале ниже.' : 'Что именно произошло — в хронологии ниже и в досье проекта.'}</p>
              {proof ? <p className="sig-proof"><Link href={`/novosti/${proof.slug}/`}>{typo(proof.title)}</Link>{proof.datePublished ? <small> · {dm(proof.datePublished)}</small> : null}</p> : null}
            </>
          ) : st === 'snapshot' ? (
            <>
              <b>Срез рынка на {dm(s.date)}</b>
              <p>Цены и темпы продаж в новостройках меняются каждый месяц, а прайс-листы и отчёты о продажах застройщики задним числом не публикуют. Поэтому такую цифру редко можно сверить с открытым источником спустя время — но она сохраняет картину рынка на дату, когда её назвали. Сравните с тем, что в проекте сейчас.</p>
              {now ? <p className="sig-now"><span>Сейчас</span><b>{now}</b>{o.priceAsOf ? <small>{o.priceAsOf}{o.priceSource ? ` · ${o.priceSource}` : ''}</small> : null}</p> : <p className="sig-now"><Link href={`/obekty/${o.slug}/`}>Текущая цена — в досье проекта →</Link></p>}
            </>
          ) : st === 'unconfirmed' ? (
            <>
              <b>{s.outcome === 'refuted' ? 'Опровергнуто' : 'Не подтвердилось'}{s.checkedOn ? ` на ${my(s.checkedOn)}` : ''}</b>
              <p>Редакция проверила сигнал по открытым источникам — документов, официальных сообщений или публикаций, которые бы его подтверждали, не нашлось.</p>
            </>
          ) : (
            <>
              <b>Пока не подтверждён</b>
              <p>Это информация с рынка на {dm(s.date).replace(' года', '')}, а не официальное сообщение. Когда появится решение, документ или заявление застройщика, отметим здесь и в досье.</p>
            </>
          )}
        </div>

        <Link className="sig-obj card" href={`/obekty/${o.slug}/`}>
          <span className="st">{o.stage ? <><StageStrip stage={o.stage} /> {stageLabel(o.stage)}</> : 'Стадия не определена'}</span>
          <b>{o.name}</b>
          <small>{[dev?.name ? devName(dev.name) : null, o.zu && o.zu !== o.name ? `ЗУ «${o.zu}»` : null, where].filter(Boolean).join(' · ')}</small>
          <span className="more-l">Досье проекта →</span>
        </Link>
      </article>

      {before.length || after.length ? (
        <section className="sec" aria-labelledby="h-ctx">
          <div className="sec-h"><h2 id="h-ctx" className="tt">Контекст<span>что было до и после</span></h2><Link className="more" href={`/obekty/${o.slug}/#h-tl`}>Вся хронология</Link></div>
          <ol className="tl sig-ctx">
            {before.map((t) => <Item key={t.id} t={t} />)}
            <li className="tl-item is-sig is-here"><div className="tl-meta"><time dateTime={s.date.slice(0, 10)}>{dm(s.date).replace(' года', '')}</time><span className="tl-sig">Этот сигнал</span></div><div className="tl-body"><p className="tl-t">{typo(s.title)}</p></div></li>
            {after.map((t) => <Item key={t.id} t={t} />)}
          </ol>
        </section>
      ) : null}

      {others.length ? (
        <section className="sec" aria-labelledby="h-oth">
          <div className="sec-h"><h2 id="h-oth" className="tt">Другие сигналы<span>по этому проекту</span></h2></div>
          <ol className="tl sig-ctx">{others.map((t) => <Item key={t.id} t={t} />)}</ol>
        </section>
      ) : null}

      {arts.length ? (
        <section className="sec" aria-labelledby="h-arts">
          <div className="sec-h"><h2 id="h-arts" className="tt">Материалы<span>о проекте</span></h2></div>
          <div className="a-grid">{arts.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </section>
      ) : null}

      <p className="note">Сигнал — информация с рынка на дату публикации, до официальных новостей. Это не обещание застройщика и не оферта. Подробнее о том, как мы работаем с сигналами, — на странице <Link href="/signaly/">«Сигналы»</Link>.</p>
    </>
  )
}
