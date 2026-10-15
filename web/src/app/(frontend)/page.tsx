import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ruDate, typo } from '@/lib/markdown'
import { ArticleCard, StageStrip, TYPES, devName, stageLabel, cardImg } from '@/lib/ui'
import type { Developer, Media } from '@/payload-types'
import { pub } from '@/lib/public'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'

export default async function Home() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'articles', where: pub(), sort: '-datePublished', limit: 40, depth: 1 })
  const objects = (await payload.find({ collection: 'objects', limit: 8, depth: 1, sort: '-lastEventAt' })).docs
  const topDevs = await developerBoard(payload)
  const objImg = (id: number | string) => docs.find((a) => (a.objects || []).some((o) => (typeof o === 'object' ? o.id : o) === id) && a.heroImage)?.heroImage as Media | undefined

  const [lead, ...rest] = docs
  const side = rest.slice(0, 5)
  const grid = rest.slice(5)
  const leadImg = lead?.heroImage as Media | undefined
  if (!lead) return <p className="empty">Статей пока нет. Запустите импорт: npm run seed</p>

  return (
    <>
      <section className="home-top">
        <h1 className="hello tt">Новостройки<span>без рекламы и слухов</span></h1>
        <p className="hello-sub">Проверяем цены, сроки и застройщиков по госреестрам, судам и документам. Москва в фокусе, вся Россия в охвате.</p>
      </section>

      <section className="hero-grid">
        <Link className="lead card" href={`/novosti/${lead.slug}/`}>
          {leadImg?.url ? <div className="ph"><img src={leadImg.url} alt={leadImg.alt} /><div className="tags"><span>{TYPES[lead.type]}</span></div></div> : null}
          <div className="tx">
            <time dateTime={lead.datePublished || undefined}>{ruDate(lead.datePublished)}</time>
            <h2>{typo(lead.title)}</h2>
            {lead.lead ? <p>{typo(lead.lead)}</p> : null}
          </div>
        </Link>
        <aside className="feed card" aria-labelledby="h-feed">
          <h2 id="h-feed" className="feed-h">Последнее</h2>
          <ol>
            {side.map((a) => (
              <li key={a.id}><Link href={`/novosti/${a.slug}/`}><span className="ft">{TYPES[a.type]} · {ruDate(a.datePublished)}</span><span className="fh">{typo(a.title)}</span></Link></li>
            ))}
          </ol>
          <div className="fact">
            <p className="side-k">Ключевая ставка</p>
            <p className="num">14<span className="fr">%</span></p>
            <p className="note">Банк России, решение 24 июля 2026 года. Следующее заседание — 23 октября.</p>
            <a className="note link" href="https://www.cbr.ru/hd_base/KeyRate/" target="_blank" rel="noopener">cbr.ru</a>
          </div>
        </aside>
      </section>

      {objects.length ? (
        <section className="sec" aria-labelledby="h-obj">
          <div className="sec-h"><h2 id="h-obj" className="tt">Объекты<span>под наблюдением</span></h2><Link className="more" href="/obekty/">Все объекты</Link></div>
          <div className="obj-grid">
            {objects.map((o) => {
              const img = cardImg(o.gallery?.[0]) || objImg(o.id), dev = o.developer as Developer | undefined
              return (
                <Link key={o.id} className="ocard card" href={`/obekty/${o.slug}/`}>
                  <div className={`ph${img?.url ? '' : ' ph-empty'}`}>{img?.url ? <img src={img.url} alt={img.alt} loading="lazy" /> : null}</div>
                  <div className="tx">
                    <div className="row"><StageStrip stage={o.stage} /><span className="st">{stageLabel(o.stage)}</span></div>
                    <h3>{o.name}</h3>
                    <p>{devName(dev?.name)}{o.zu ? ` · ЗУ «${o.zu}»` : ''}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className="sec" id="materialy" aria-labelledby="h-mat">
        <div className="sec-h"><h2 id="h-mat" className="tt">Материалы<span>с проверкой фактов</span></h2><Link className="more" href="/novosti/">Все материалы</Link></div>
        <div className="a-grid">{(grid.length ? grid : rest).map((a) => <ArticleCard key={a.id} a={a} />)}</div>
      </section>

      <section className="pro-band" aria-labelledby="h-pro">
        <div>
          <span className="pill dark">Шахматка Про</span>
          <h2 id="h-pro">Узнавайте о проектах<span>раньше рекламы</span></h2>
        </div>
        <ul>
          <li>Оценка перспективы объекта и сравнение с соседями</li>
          <li>История цен по очередям и форматам квартир</li>
          <li>Ранние сигналы: новые участки, ГЗК, смена собственника</li>
          <li>Судебные риски застройщиков</li>
        </ul>
        <Link className="btn" href="/pro/">Подробнее о подписке</Link>
      </section>

      {topDevs.length ? (
        <section className="sec" aria-labelledby="h-dev">
          <div className="sec-h"><h2 id="h-dev" className="tt">Застройщики<span>в досье и материалах</span></h2><Link className="more" href="/zastroyshchiki/">Все застройщики</Link></div>
          <div className="dev-grid">
            {topDevs.map((d) => (
              <Link key={d.id} className="dcard card" href={`/zastroyshchiki/${d.slug}/`}>
                <div className="dc-top">
                  <span className="mono" aria-hidden="true">{initials(d.name)}</span>
                  <span className="dc-name"><b>{devName(d.name)}</b><small>{plural(d.projects, 'проект', 'проекта', 'проектов')} · {plural(d.articles, 'материал', 'материала', 'материалов')}</small></span>
                </div>
                {d.projects ? (
                  <>
                    <span className="dbar" role="img" aria-label={`Проекты по стадиям: в подготовке ${d.prep}, в продаже ${d.sales}, сдано ${d.done}`}>
                      {d.prep ? <i className="s-prep" style={{ flexGrow: d.prep }} /> : null}
                      {d.sales ? <i className="s-sales" style={{ flexGrow: d.sales }} /> : null}
                      {d.done ? <i className="s-done" style={{ flexGrow: d.done }} /> : null}
                    </span>
                    <span className="dleg">
                      {d.prep ? <span><i className="s-prep" />готовятся {d.prep}</span> : null}
                      {d.sales ? <span><i className="s-sales" />в продаже {d.sales}</span> : null}
                      {d.done ? <span><i className="s-done" />сдано {d.done}</span> : null}
                    </span>
                  </>
                ) : null}
                {d.last ? <span className="dlast"><time dateTime={d.last.date || undefined}>{ruDate(d.last.date)}</time>{typo(d.last.title)}</span> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100
  return `${n} ${m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many}`
}
const initials = (name?: string | null) => {
  const w = devName(name).replace(/^(ГК|ПАО|АО|ООО|СЗ)\s+/i, '').replace(/[«»"]/g, '').split(/[\s-]+/).filter(Boolean)
  if (w[0] && /^[A-ZА-ЯЁ0-9]{2,3}$/.test(w[0])) return w[0]
  return (w.length > 1 && w[1][0] && /[A-ZА-ЯЁ]/.test(w[1][0]) ? w[0][0] + w[1][0] : w[0]?.slice(0, 2) || '').toUpperCase()
}

type DevRow = { id: number | string; slug: string; name: string; projects: number; prep: number; sales: number; done: number; articles: number; last?: { title: string; date?: string | null } }

/** Застройщики для главной: сколько проектов в досье и по каким стадиям, сколько материалов и последний из них */
async function developerBoard(payload: Awaited<ReturnType<typeof getPayload>>): Promise<DevRow[]> {
  const [devs, objs, arts] = await Promise.all([
    payload.find({ collection: 'developers', limit: 5000, pagination: false, depth: 0, select: { name: true, slug: true } }),
    payload.find({ collection: 'objects', limit: 10000, pagination: false, depth: 0, select: { developer: true, stage: true } }),
    payload.find({ collection: 'articles', where: pub(), limit: 5000, pagination: false, depth: 0, sort: '-datePublished', select: { title: true, datePublished: true, developers: true } }),
  ])
  const rows = new Map<string | number, DevRow>()
  for (const d of devs.docs) rows.set(d.id, { id: d.id, slug: d.slug as string, name: d.name as string, projects: 0, prep: 0, sales: 0, done: 0, articles: 0 })
  for (const o of objs.docs) {
    const r = rows.get((o.developer && typeof o.developer === 'object' ? o.developer.id : o.developer) as number)
    if (!r) continue
    r.projects++
    if (o.stage === 'sales') r.sales++
    else if (o.stage === 'completed') r.done++
    else r.prep++
  }
  for (const a of arts.docs) for (const d of a.developers || []) {
    const r = rows.get(typeof d === 'object' ? d.id : d)
    if (!r) continue
    r.articles++
    if (!r.last) r.last = { title: a.title as string, date: a.datePublished }
  }
  return [...rows.values()]
    .filter((r) => r.articles && r.projects >= 2)
    .sort((a, b) => b.articles * 2 + b.projects - (a.articles * 2 + a.projects))
    .slice(0, 8)
}
