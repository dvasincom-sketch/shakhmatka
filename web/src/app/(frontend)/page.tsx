import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ruDate, typo } from '@/lib/markdown'
import { ArticleCard, Mark, StageStrip, TYPES, devName, stageLabel } from '@/lib/ui'
import type { Developer, Media } from '@/payload-types'
import { pub } from '@/lib/public'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'

export default async function Home() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'articles', where: pub(), sort: '-datePublished', limit: 40, depth: 1 })
  const objects = (await payload.find({ collection: 'objects', limit: 8, depth: 1, sort: '-lastEventAt' })).docs
  const devs = (await payload.find({ collection: 'developers', limit: 100 })).docs
  const counts = new Map<string | number, number>()
  docs.forEach((a) => (a.developers || []).forEach((d) => { const id = typeof d === 'object' ? d.id : d; counts.set(id, (counts.get(id) || 0) + 1) }))
  const topDevs = devs.filter((d) => counts.get(d.id)).sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0)).slice(0, 8)
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
              const img = objImg(o.id), dev = o.developer as Developer | undefined
              return (
                <Link key={o.id} className="ocard card" href={`/obekty/${o.slug}/`}>
                  <div className="ph">{img?.url ? <img src={img.url} alt={img.alt} loading="lazy" /> : <Mark className="ph-mark" />}</div>
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
        <div className="sec-h"><h2 id="h-mat" className="tt">Материалы<span>с проверкой фактов</span></h2></div>
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
          <div className="sec-h"><h2 id="h-dev" className="tt">Застройщики<span>в материалах</span></h2><Link className="more" href="/zastroyshchiki/">Все застройщики</Link></div>
          <div className="dev-grid">
            {topDevs.map((d) => (
              <Link key={d.id} className="dcard card" href={`/zastroyshchiki/${d.slug}/`}>
                <span className="mono">{devName(d.name).replace(/^(ГК|ПАО|АО|ООО)\s*/, '').replace(/[«»"]/g, '').slice(0, 2).toUpperCase()}</span>
                <span><b>{devName(d.name)}</b><small>{counts.get(d.id)} мат.</small></span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}
