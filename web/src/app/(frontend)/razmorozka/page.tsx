import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ObjectCard, SITE } from '@/lib/ui'
import { TROUBLE } from '@/lib/trouble'
import { CARD_SELECT } from '@/lib/landings'
import { JsonLd } from '@/lib/jsonld'
import type { Object as Obj } from '@/payload-types'
import { RazmorozkaForm } from './form'

export const dynamic = 'force-dynamic'
const URL_ = `${SITE}/razmorozka/`
export const metadata: Metadata = {
  title: 'Конкурс «Разморозка»: концепции для замороженных площадок Москвы',
  description: 'Открытый конкурс идей «Шахматки» для студентов, молодых бюро и фрилансеров: концепции для реальных замороженных и проблемных площадок Москвы с учётом ПЗЗ, ТЭП и ограничений.',
  alternates: { canonical: URL_ },
}

export default async function Razmorozka() {
  const payload = await getPayload({ config })
  // кандидаты: проблемные проекты и участки без движения больше двух лет (стадии «участок» и «концепция»)
  const cut = new Date(Date.now() - 2 * 365.25 * 864e5).toISOString()
  const troubled = Object.entries(TROUBLE).filter(([, t]) => t.status !== 'resolved').map(([s]) => s)
  const [tr, still] = await Promise.all([
    troubled.length ? payload.find({ collection: 'objects', where: { slug: { in: troubled } }, limit: 12, depth: 1, select: CARD_SELECT }) : { docs: [] as Obj[] },
    payload.find({ collection: 'objects', where: { and: [{ region: { equals: 'moscow' } }, { stage: { in: ['land', 'concept'] } }, { lastEventAt: { less_than: cut } }] }, sort: '-signalCount', limit: 9, depth: 1, select: CARD_SELECT }),
  ])
  const candidates = [...(tr.docs as Obj[]), ...(still.docs as Obj[])].slice(0, 12)
  const stillTotal = still.totalDocs ?? still.docs.length
  const faq = [
    { q: 'Это заказ на проектирование?', a: 'Нет. «Разморозка» — конкурс идей: концепции не становятся проектом и не обязывают ни собственника, ни город. Права на работы остаются у авторов, «Шахматка» получает право их публиковать.' },
    { q: 'Кто может участвовать?', a: 'Студенты и выпускники архитектурных и урбанистических программ, молодые бюро и фрилансеры. Команды до пяти человек. Гражданство и вуз значения не имеют.' },
    { q: 'Что нужно сдать?', a: '3–5 листов концепции и пояснительную записку с технико-экономическими показателями: площадь застройки, суммарная поэтажная площадь, этажность, квартиры, машино-места, социальная инфраструктура. Проект должен укладываться в ограничения участка: ПЗЗ, ГПЗУ или решение о КРТ, охранные зоны, инсоляцию.' },
    { q: 'Как выбирают победителей?', a: 'Шорт-лист составляет жюри из практикующих архитекторов и преподавателей архшкол, затем читатели голосуют за финалистов. Финалистов «Шахматка» публикует статьями в рубрике «Архитектура».' },
    { q: 'Что будет с участком на самом деле?', a: 'Мы работаем только с открытыми данными и ничего не утверждаем о будущем площадки. Если по участку идёт спор, это отмечено в брифе. Собственников площадок мы уведомляем о конкурсе.' },
  ]
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Event', name: 'Конкурс «Разморозка»', description: metadata.description, url: URL_, eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode', organizer: { '@type': 'Organization', name: 'Шахматка', url: SITE }, location: { '@type': 'VirtualLocation', url: URL_ } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ]
  return (
    <>
      {ld.map((x, i) => <JsonLd key={i} data={x} />)}
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><Link href="/arhitektory/">Архитектура</Link><span>/</span><span>«Разморозка»</span></nav>
      <section className="rz-hero">
        <p className="f-k">Конкурс идей «Шахматки» · приём заявок скоро</p>
        <h1 className="page-h tt">«Разморозка»<span>что построить на замороженных площадках Москвы</span></h1>
        <p className="hello-sub">В Москве десятки участков, где стройка встала годами: банкротства, споры, проекты без инвестора. Мы предлагаем студентам, молодым бюро и фрилансерам придумать для них концепции — не фантазии на чистом листе, а решения в реальных ограничениях: ПЗЗ, ТЭП, охранные зоны, инсоляция, нормы по школам и машино-местам. Лучшие работы опубликуем и покажем девелоперам и собственникам.</p>
        <a className="btn" href="#uchastvovat">Хочу участвовать</a>
      </section>

      <section className="sec" aria-labelledby="h-how">
        <div className="sec-h"><h2 id="h-how" className="tt">Как это устроено<span>четыре этапа</span></h2></div>
        <ol className="rz-steps">
          <li className="card"><b>1. Площадки и брифы</b><p>По каждой площадке — открытые данные: ГПЗУ или решение о КРТ, ТЭП, ограничения, фото, карта и история из досье «Шахматки».</p></li>
          <li className="card"><b>2. Приём работ</b><p>6–8 недель. Концепция на 3–5 листах и записка с ТЭП. Регистрация через аккаунт «Шахматки».</p></li>
          <li className="card"><b>3. Жюри и голосование</b><p>Жюри — практикующие архитекторы и преподаватели архшкол — выбирает шорт-лист, затем две недели голосуют читатели.</p></li>
          <li className="card"><b>4. Публикация</b><p>Финалисты — статьи в рубрике «Архитектура», презентация девелоперам и собственникам, стажировки в бюро-партнёрах.</p></li>
        </ol>
      </section>

      {candidates.length ? (
        <section className="sec" aria-labelledby="h-sites">
          <div className="sec-h"><h2 id="h-sites" className="tt">Площадки-кандидаты<span>проблемные проекты и участки без движения больше двух лет — в базе таких {stillTotal + troubled.length}</span></h2></div>
          <div className="obj-grid land-grid">{candidates.map((o) => <ObjectCard key={o.id} o={o} />)}</div>
          <p className="note">Это кандидаты из досье, а не утверждённый список: три пилотные площадки выберем вместе с партнёрами и опубликуем с брифами. Ничего не утверждаем о будущем участков.</p>
        </section>
      ) : null}

      <section className="sec" aria-labelledby="h-rules">
        <div className="sec-h"><h2 id="h-rules" className="tt">Правила в двух словах<span>полная версия — при запуске</span></h2></div>
        <ul className="rz-rules card">
          <li>Конкурс идей, а не заказ на проектирование.</li>
          <li>Права на концепции остаются у авторов; «Шахматка» публикует работы с указанием авторства.</li>
          <li>Только открытые данные; спорные участки помечены в брифе.</li>
          <li>Участие бесплатное. Призы — деньги или стажировки в бюро-партнёрах, публикация, встреча с девелоперами.</li>
        </ul>
      </section>

      <section className="sec" id="uchastvovat" aria-labelledby="h-join">
        <div className="sec-h"><h2 id="h-join" className="tt">Участвовать или стать партнёром<span>напишем, когда опубликуем правила и площадки</span></h2></div>
        <RazmorozkaForm />
      </section>

      <section className="sec faq-sec" aria-labelledby="h-faq">
        <div className="sec-h"><h2 id="h-faq" className="tt">Вопросы<span>и ответы</span></h2></div>
        <div className="faq">{faq.map((f) => <details key={f.q} className="card"><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
      </section>
    </>
  )
}
