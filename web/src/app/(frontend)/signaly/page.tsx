import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SITE } from '@/lib/ui'
import { districtName, plural, regionName } from '@/lib/geo'
import { typo } from '@/lib/markdown'
import { JsonLd } from '@/lib/jsonld'
import type { Object as Obj } from '@/payload-types'
import { signalHref, signalSlugs } from '@/lib/signals'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Сигналы: что готовят на рынке новостроек Москвы до официальных новостей',
  description: 'Кулуарная информация о московских участках и проектах: кто присматривает землю, что готовят к продажам, где меняется девелопер. И какие сигналы потом подтвердились.',
  alternates: { canonical: `${SITE}/signaly/` },
}

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const MONTHS_N = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
const dm = (iso: string) => { const d = new Date(iso); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` }
const my = (iso: string) => { const d = new Date(iso); return `${MONTHS_N[d.getUTCMonth()]} ${d.getUTCFullYear()}` }
const months = (a: string, b: string) => Math.max(0, Math.round((+new Date(b) - +new Date(a)) / (30.44 * 864e5)))

type Sig = { id: string; href: string; date: string; title: string; confirmedOn?: string | null; outcome?: string | null; o: Pick<Obj, 'name' | 'slug' | 'region' | 'district'> }

export default async function Signals() {
  const payload = await getPayload({ config })
  const objs = (await payload.find({
    collection: 'objects', where: { signalCount: { greater_than: 0 } }, limit: 10000, pagination: false, depth: 0,
    select: { name: true, slug: true, region: true, district: true, timeline: true },
  })).docs as Obj[]
  const all: Sig[] = objs.flatMap((o) => {
    const slugs = signalSlugs(o.slug, o.timeline)
    return (o.timeline || []).filter((t) => t.certainty === 'signal').map((t) => ({ id: t.id!, href: signalHref(slugs.get(t.id!) || ''), date: t.date, title: t.title, confirmedOn: t.confirmedOn, outcome: t.outcome, o }))
  })
  const confirmed = all.filter((s) => s.confirmedOn).sort((a, b) => +new Date(b.confirmedOn!) - +new Date(a.confirmedOn!))
  const fresh = [...all].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 40)
  const leads = confirmed.map((s) => months(s.date, s.confirmedOn!)).sort((a, b) => a - b)
  const median = leads.length ? leads[Math.floor(leads.length / 2)] : 0
  const where = (o: Sig['o']) => (o.region === 'moscow' ? (o.district ? districtName(o.district) : 'Москва') : regionName(o.region))

  // свежие — по месяцам
  const byMonth = new Map<string, Sig[]>()
  fresh.forEach((s) => { const k = my(s.date); byMonth.set(k, [...(byMonth.get(k) || []), s]) })

  const ld = {
    '@type': 'CollectionPage', name: 'Сигналы', url: `${SITE}/signaly/`, inLanguage: 'ru',
    mainEntity: { '@type': 'ItemList', itemListElement: confirmed.slice(0, 20).map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: s.title, url: `${SITE}${s.href}` })) },
  }

  return (
    <>
      <JsonLd data={ld} />
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><span>Сигналы</span></nav>
      <h1 className="page-h tt">Сигналы<span>раньше официальных новостей</span></h1>
      <p className="hello-sub">Сигнал — то, о чём на рынке говорят до пресс-релизов: участок присматривают, проект готовят к продажам, меняется девелопер. Мы отмечаем такие пункты в досье объектов, проверяем и честно показываем, что сбылось, а что нет.</p>

      <dl className="land-stats sig-stats">
        <div className="card"><dt>Сигналов в досье</dt><dd>{all.length}</dd><small>по {objs.length} {plural(objs.length, 'объекту', 'объектам', 'объектам')}</small></div>
        <div className="card"><dt>Уже подтвердились</dt><dd>{confirmed.length}</dd><small>официально или по документам</small></div>
        <div className="card"><dt>Не подтвердились</dt><dd>{all.filter((x) => x.outcome).length}</dd><small>проверили — подтверждения нет</small></div>
        {leads.length ? <div className="card"><dt>Опережение</dt><dd>{median} {plural(median, 'месяц', 'месяца', 'месяцев')}</dd><small>медиана: от сигнала до подтверждения</small></div> : null}
      </dl>

      {confirmed.length ? (
        <section className="sec" aria-labelledby="h-conf">
          <div className="sec-h"><h2 id="h-conf" className="tt">Сбылось<span>писали заранее — подтвердилось</span></h2></div>
          <ol className="sig-list">
            {confirmed.map((s) => {
              const m = months(s.date, s.confirmedOn!)
              return (
                <li key={s.id} className="card sig-item">
                  <div className="sig-meta"><span className="tl-sig">Сигнал</span><time dateTime={s.date.slice(0, 10)}>{dm(s.date)}</time></div>
                  <p className="sig-t"><Link href={s.href}>{typo(s.title)}</Link></p>
                  <p className="sig-foot">
                    <Link href={`/obekty/${s.o.slug}/`}>{s.o.name}</Link><span>{where(s.o)}</span>
                    <span className="tl-conf">подтвердилось: {my(s.confirmedOn!)}{m ? `, через ${m} ${plural(m, 'месяц', 'месяца', 'месяцев')}` : ''}</span>
                  </p>
                </li>
              )
            })}
          </ol>
        </section>
      ) : null}

      <section className="sec" aria-labelledby="h-fresh">
        <div className="sec-h"><h2 id="h-fresh" className="tt">Свежие сигналы<span>ещё не подтверждены</span></h2></div>
        <ol className="tl sig-tl">
          {[...byMonth.entries()].map(([k, list]) => (
            <li key={k} className="tl-year">
              <h3 className="tl-y sig-month">{k}</h3>
              <ol>
                {list.map((s) => (
                  <li key={s.id} className="tl-item is-sig">
                    <div className="tl-meta"><time dateTime={s.date.slice(0, 10)}>{dm(s.date).replace(/ \d{4}$/, '')}</time>{s.confirmedOn ? <span className="tl-conf">подтвердилось</span> : null}{s.outcome ? <span className="tl-unc">не подтвердилось</span> : null}</div>
                    <div className="tl-body">
                      <p className="tl-t"><Link href={s.href}>{typo(s.title)}</Link></p>
                      <p className="tl-x"><Link href={`/obekty/${s.o.slug}/`}>{s.o.name}</Link> · {where(s.o)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      </section>
      <p className="note">Сигналы — информация редакции из кулуарных источников на дату публикации. Это не обещание застройщика и не оферта; подтверждённые пункты в досье объектов помечены отдельно.</p>
    </>
  )
}
