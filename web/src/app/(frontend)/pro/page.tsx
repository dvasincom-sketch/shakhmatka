import { CrumbsLd } from '@/lib/jsonld'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SITE, ogFor, stageLabel } from '@/lib/ui'
import { districtName, regionName, plural } from '@/lib/geo'
import { TROUBLE } from '@/lib/trouble'
import { BUREAUS } from '@/lib/architects'
import { ProForm } from '@/lib/pro-form'
import { START_PRICES } from '@/lib/start-prices'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Шахматка Про: данные о московской земле и проектах',
  description: 'Площадки до старта продаж, владельцы и смены собственников, КРТ и торги, сигналы раньше новостей, проблемные проекты — для застройщиков, брокеров и инвесторов. По заявке.',
  alternates: { canonical: `${SITE}/pro/` },
  openGraph: ogFor(`${SITE}/pro/`),
}

type TL = { date: string; title: string; kind?: string | null; certainty?: string | null; confirmedOn?: string | null }
type O = { slug: string; name: string; stage?: string | null; region?: string | null; district?: string | null; developer?: number | null; owners?: unknown[] | null; timeline?: TL[] | null; signalCount?: number | null }

const EARLY = ['land', 'concept', 'architecture']
const SALE = /прода[её]т|выставлен\w* на (продажу|торги)|ищ\w+ (девелопер|инвестор|партн[её]р|покупател)|торги|аукцион|готов\w* продать|хочет продать|на продажу/i
const TEP = /(\d+(?:[,.]\d+)?)\s*тыс\.?\s*(?:кв\.?\s*м|м²)/i
// вид продажи — без текста события, чтобы не раскрывать площадку
const saleKind = (t: string) => /торги|аукцион/i.test(t) ? 'торги' : /ищ\w+ (девелопер|инвестор|партн)/i.test(t) ? 'ищет инвестора или партнёра' : 'продаётся'
const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
const my = (iso: string) => { const d = new Date(iso); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` }

const PLANS = [
  {
    key: 'invest', name: 'Инвестиционная подборка', who: 'Тем, кто покупает квартиру, чтобы сохранить и приумножить капитал',
    items: [
      'Проекты на старте продаж и первых очередях — пока цена ниже, чем будет к сдаче',
      'Как росла цена в похожих проектах района «на старте → сейчас» и сколько это в год',
      'Надёжность застройщика: сроки по декларациям, проблемные проекты, суды',
      'Что изменит район: КРТ, новые станции и дороги, соседние стройки — по сигналам раньше новостей',
      'Риски: долгострои рядом, изменения проекта, перенос сроков',
    ],
    note: 'Готовим к запуску — оставьте заявку, пришлём первую подборку.',
  },
  {
    key: 'pro', name: 'Шахматка Про', who: 'Брокерам, аналитикам, банкам, архитектурным бюро',
    items: [
      'Сигналы о проектах сразу, а не с задержкой: участки, ГЗК, смена собственника, старт продаж',
      'Оповещения по районам, застройщикам и адресам — в почту и мессенджер',
      'Досье всех объектов с историей собственников и цен «на старте → сейчас»',
      'Трекер КРТ и торгов: параметры, сроки, кто выиграл',
      'Проблемные проекты и риски застройщиков',
      'Выгрузки в Excel по любому фильтру каталога',
    ],
    note: '',
  },
  {
    key: 'land', name: 'Подборка площадок', who: 'Застройщикам и инвесторам, которые ищут землю в Москве',
    items: [
      'Ежемесячная подборка площадок под ваш запрос: районы, ТЭП, бюджет, класс, сроки',
      'Паспорт каждой площадки: правообладатель, ГПЗУ и ТЭП, ограничения, условия КРТ, статус продажи с источником',
      'Окружение: соседние проекты, цены на старте и сейчас, темпы продаж, проблемные объекты',
      'Разборы 3–5 площадок в месяц и аналитик по запросу',
      'Мониторинг выбранных площадок: торги, решения, смена владельца',
    ],
    note: '',
  },
]

const FAQ = [
  ['Откуда данные?', 'Архив редакции с 2019 года, сверенный с открытыми источниками: решения города (mos.ru, ГЗК, Мосгосстройнадзор), торги, ЕИСЖС, суды, деловые СМИ и каталоги. У каждого факта — источник; то, что пока известно только с рынка, помечено как сигнал.'],
  ['Как часто обновляется?', 'Новые события попадают в базу каждую неделю; подписчики Про получают их сразу.'],
  ['Можно попробовать?', 'Да: по заявке пришлём пример подборки площадок под ваш запрос и демо-доступ.'],
  ['Это инвестиционная рекомендация?', 'Нет. Мы показываем проверенные данные и то, из чего складывалась доходность похожих проектов: стадию входа, район, застройщика, инфраструктуру и риски. Решение о покупке — ваше.'],
  ['Сколько стоит?', 'Зависит от подписки и состава: число пользователей, районы, объём подборок. Назовём после короткого созвона или письма.'],
]

export default async function Pro({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const initial = ['invest', 'pro', 'land', 'data'].includes((await searchParams).p || '') ? (await searchParams).p! : 'invest'
  const payload = await getPayload({ config })
  const objs = (await payload.find({ collection: 'objects', limit: 20000, depth: 0, pagination: false, select: { slug: true, name: true, stage: true, region: true, district: true, developer: true, owners: true, timeline: true, signalCount: true } })).docs as unknown as O[]
  const early = objs.filter((o) => EARLY.includes(o.stage || ''))
  const owned = early.filter((o) => o.developer || (o.owners || []).length)
  const saleOf = (o: O) => [...(o.timeline || [])].filter((t) => SALE.test(t.title)).sort((a, b) => b.date.localeCompare(a.date))[0]
  const forSale = early.filter((o) => { const s = saleOf(o); return s && s.date >= '2025-01-01' })
  const krt = objs.filter((o) => (o.timeline || []).some((t) => t.kind === 'krt'))
  const ownerChanges = objs.filter((o) => (o.owners || []).length > 1).length
  const signals = objs.reduce((s, o) => s + (o.signalCount || 0), 0)
  const troubled = Object.keys(TROUBLE).length

  // пример подборки: без названий и адресов — район, стадия, параметры, что известно о продаже
  const sample = forSale
    .filter((o) => o.region === 'moscow' && o.district && o.developer)
    .map((o) => {
      const s = saleOf(o)!
      const tep = (o.timeline || []).map((t) => t.title.match(TEP)).find(Boolean)
      return { o, s, tep: tep ? `${tep[1].replace('.', ',')} тыс. м²` : null }
    })
    .sort((a, b) => (b.tep ? 1 : 0) - (a.tep ? 1 : 0) || b.s.date.localeCompare(a.s.date))
    .slice(0, 6)

  return (
    <>
      <CrumbsLd items={[['Лента', '/'], ['Шахматка Про', '/pro/']]} />
      <nav className="crumbs"><Link href="/">Лента</Link><span>/</span><span>Шахматка Про</span></nav>
      <section className="pro-hero">
        <span className="pill dark">Шахматка Про</span>
        <h1>Данные о новостройках Москвы<span>раньше, чем о них напишут</span></h1>
        <p>Сайт бесплатен. По подписке — подборки и данные для решений: какой проект купить сейчас, чтобы сохранить и приумножить деньги; какую площадку купить под новый проект; что происходит у конкурентов и в районе. Три подписки под разные задачи, стоимость — по заявке.</p>
        <a className="btn" href="#zayavka">Оставить заявку</a>
      </section>

      <dl className="land-stats pro-stats sec">
        <div className="card"><dt>Площадки до старта продаж</dt><dd>{early.length}</dd><small>участки, концепции и проекты без продаж</small></div>
        <div className="card"><dt>С известным владельцем</dt><dd>{owned.length}</dd><small>застройщик или собственник в досье</small></div>
        <div className="card"><dt>Продаются или на торгах</dt><dd>{forSale.length}</dd><small>признаки продажи с 2025 года</small></div>
        <div className="card"><dt>КРТ</dt><dd>{krt.length}</dd><small>территорий с параметрами и сроками</small></div>
        <div className="card"><dt>Сигналы</dt><dd>{signals.toLocaleString('ru-RU')}</dd><small>о проектах до официальных новостей</small></div>
        <div className="card"><dt>Смены владельца</dt><dd>{ownerChanges}</dd><small>проектов с историей собственников</small></div>
        <div className="card"><dt>Проблемные проекты</dt><dd>{troubled}</dd><small>долгострои, банкротства, достройка</small></div>
        <div className="card"><dt>Архитектурные бюро</dt><dd>{BUREAUS.length}</dd><small>кто проектирует новую Москву</small></div>
      </dl>

      <section className="sec" aria-labelledby="h-inv">
        <div className="sec-h"><h2 id="h-inv" className="tt">Сколько выросли цены<span>со старта продаж — проекты, где это проверено</span></h2><Link className="more" href="/ceny-na-starte/">Все {START_PRICES.length}</Link></div>
        <div className="tbl card">
          <table>
            <thead><tr><th>Проект</th><th>Район</th><th>Старт</th><th>Сейчас</th><th>Рост</th><th>В год</th></tr></thead>
            <tbody>
              {[...START_PRICES].sort((a, b) => b.perYearPct - a.perYearPct).slice(0, 5).map((r) => (
                <tr key={r.slug}>
                  <td>{r.dossier ? <Link href={`/obekty/${r.dossier}/`}>{r.name}</Link> : r.name}</td>
                  <td className="nw">{r.districtName || '—'}</td>
                  <td className="nw">от {String(r.start.lot_from).replace('.', ',')} млн · {r.start.date.slice(0, 4)}</td>
                  <td className="nw">от {String(r.now.lot_from).replace('.', ',')} млн</td>
                  <td className="nw">{r.changePct > 0 ? '+' : ''}{Math.round(r.changePct)}%</td>
                  <td className="nw">{r.perYearPct > 0 ? '+' : ''}{Math.round(r.perYearPct)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">Минимальная цена квартиры на старте продаж и сейчас, по проверенным источникам. Прошлый рост не гарантирует будущего: в подборке мы показываем, из чего он складывался — стадия входа, район, застройщик, инфраструктура — и где те же условия есть сейчас. Не является инвестиционной рекомендацией.</p>
      </section>

      {sample.length ? (
        <section className="sec" aria-labelledby="h-sample">
          <div className="sec-h"><h2 id="h-sample" className="tt">Пример подборки площадок<span>которые продаются, — без названий и адресов</span></h2></div>
          <div className="tbl card pro-sample">
            <table>
              <thead><tr><th>Где</th><th>Стадия</th><th>Параметры</th><th>Владелец</th><th>Что известно о продаже</th></tr></thead>
              <tbody>
                {sample.map(({ o, s, tep }) => (
                  <tr key={o.slug}>
                    <td className="nw">{o.region === 'moscow' ? districtName(o.district) : regionName(o.region)}</td>
                    <td className="nw">{stageLabel(o.stage)}</td>
                    <td className="nw">{tep || '—'}</td>
                    <td className="nw">известен</td>
                    <td><span className={s.certainty === 'signal' ? 'pro-sig' : 'pro-fact'}>{s.certainty === 'signal' ? 'сигнал' : 'факт'}</span> {my(s.date)} · {saleKind(s.title)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">В подборке для клиента — адрес и кадастровый номер, правообладатель по документам, ГПЗУ и ТЭП, ограничения, условия КРТ, источники и окружение. Сейчас в базе {forSale.length} {plural(forSale.length, 'такая площадка', 'такие площадки', 'таких площадок')}.</p>
        </section>
      ) : null}

      <section className="sec" aria-labelledby="h-plans">
        <div className="sec-h"><h2 id="h-plans" className="tt">Что входит<span>стоимость — по заявке</span></h2></div>
        <div className="pro-plans three">
          {PLANS.map((p) => (
            <div key={p.key} className={`card pro-plan${p.key === 'invest' ? ' accent' : ''}`}>
              <h3>{p.name}</h3>
              <p className="pro-who">{p.who}</p>
              <ul>{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
              {p.note ? <p className="pro-note">{p.note}</p> : null}
              <a className={`btn${p.key === 'invest' ? '' : ' ghost'}`} href={`?p=${p.key}#zayavka`}>Запросить</a>
            </div>
          ))}
        </div>
      </section>

      <section className="sec" id="zayavka" aria-labelledby="h-req">
        <div className="sec-h"><h2 id="h-req" className="tt">Заявка<span>пришлём пример под ваш запрос</span></h2></div>
        <ProForm key={initial} initial={initial} />
      </section>

      <section className="sec faq-sec" aria-labelledby="h-faq">
        <div className="sec-h"><h2 id="h-faq" className="tt">Вопросы<span>и ответы</span></h2></div>
        <div className="faq">{FAQ.map(([q, a]) => <details key={q} className="card"><summary>{q}</summary><p>{a}</p></details>)}</div>
      </section>
    </>
  )
}
