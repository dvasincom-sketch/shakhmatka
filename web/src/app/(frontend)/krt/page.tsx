import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SITE, devName, ogFor } from '@/lib/ui'
import { districtName, plural } from '@/lib/geo'
import { MOSCOW_DISTRICTS } from '@/lib/districts'
import { JsonLd } from '@/lib/jsonld'
import { KrtTracker, type KrtRow } from '@/lib/krt-tracker'
import type { Object as Obj } from '@/payload-types'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'КРТ в Москве: трекер территорий и застройщиков',
  description: 'Все территории комплексного развития (КРТ) Москвы из досье Шахматки: где решение уже принято, кто застройщик, что с проектом сейчас и какие сигналы подтвердились.',
  alternates: { canonical: `${SITE}/krt/` },
    openGraph: ogFor(`${SITE}/krt/`),
}

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

export default async function Krt() {
  const payload = await getPayload({ config })
  const [objs, devs] = await Promise.all([
    payload.find({
      collection: 'objects', where: { 'timeline.kind': { equals: 'krt' } }, limit: 10000, pagination: false, depth: 0,
      select: { name: true, slug: true, region: true, district: true, stage: true, developer: true, timeline: true, lastEventAt: true },
    }),
    payload.find({ collection: 'developers', limit: 10000, pagination: false, depth: 0, select: { name: true, slug: true } }),
  ])
  const krtTerm = (await payload.find({ collection: 'terms', where: { slug: { equals: 'krt' } }, limit: 1, depth: 0 })).docs[0]
  const devById = new Map(devs.docs.map((x) => [x.id, x]))
  const rows: KrtRow[] = (objs.docs as Obj[])
    .filter((o) => o.region === 'moscow')
    .map((o) => {
      const tl = o.timeline || []
      const krt = tl.filter((t) => t.kind === 'krt').sort((a, b) => b.date.localeCompare(a.date))
      const dist = o.district ? MOSCOW_DISTRICTS[o.district] : undefined
      const dev = o.developer != null ? devById.get(o.developer as number) : undefined
      return {
        slug: o.slug,
        name: o.name,
        where: dist ? `${dist.name}, ${dist.okrug}` : o.district ? districtName(o.district) : 'Москва',
        okrug: dist?.okrug || '',
        developer: dev ? { name: devName(dev.name), slug: dev.slug } : undefined,
        stage: o.stage || '',
        first: krt[krt.length - 1]?.date || '',
        last: (o.lastEventAt as string) || krt[0]?.date || '',
        events: krt.map((t) => ({ date: t.date, title: t.title, signal: t.certainty === 'signal', unconfirmed: !!t.outcome, confirmed: !!t.confirmedOn })),
        signals: krt.filter((t) => t.certainty === 'signal').length,
      }
    })
    .filter((r) => r.events.length)

  const withDev = rows.filter((r) => r.developer).length
  const selling = rows.filter((r) => r.stage === 'sales' || r.stage === 'completed').length
  const events = rows.reduce((s, r) => s + r.events.length, 0)
  const signals = rows.reduce((s, r) => s + r.signals, 0)
  const years = rows.map((r) => r.first.slice(0, 4)).filter(Boolean).sort()
  const now = new Date()
  const asOf = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()} года`

  const faq = [
    {
      q: 'Что такое КРТ?',
      a: 'КРТ — комплексное развитие территорий, механизм главы 10 Градостроительного кодекса РФ. Город принимает решение о развитии конкретной территории: границы, что сносится или реконструируется, что и в какой срок нужно построить, включая школы, сады и дороги. Договор с застройщиком заключают, как правило, по итогам торгов или с правообладателями участков.',
    },
    {
      q: 'Сколько территорий КРТ в трекере Шахматки?',
      a: `На ${asOf} в трекере ${rows.length} ${plural(rows.length, 'территория', 'территории', 'территорий')} Москвы с ${events} ${plural(events, 'событием', 'событиями', 'событиями')} о КРТ. Застройщик известен у ${withDev}, до продаж или ввода дошли ${selling}. Это территории из наших досье, а не официальный реестр: список пополняется по мере проверки архива.`,
    },
    {
      q: 'Чем «сигнал» отличается от факта?',
      a: 'Факт — событие, которое уже произошло: опубликован проект решения, прошли торги, выдано разрешение. Сигнал — то, о чём на рынке говорили до официальных новостей. Мы проверяем сигналы и показываем итог: «подтвердился» или «не подтвердилось».',
    },
    {
      q: 'Как узнать, кто застройщик территории КРТ?',
      a: 'Застройщик, или реализатор КРТ, определяется по итогам торгов либо договором с правообладателями. В трекере он указан, если подтверждён в досье объекта; «Реализатор не определён» значит, что в наших данных его пока нет.',
    },
  ]

  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'КРТ в Москве: трекер', url: `${SITE}/krt/`, inLanguage: 'ru',
      mainEntity: { '@type': 'ItemList', numberOfItems: rows.length, itemListElement: rows.slice(0, 30).map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.name, url: `${SITE}/obekty/${r.slug}/` })) },
    },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Лента', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'КРТ', item: `${SITE}/krt/` }] },
  ]

  return (
    <>
      {ld.map((x, i) => <JsonLd key={i} data={x} />)}
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><span>КРТ</span></nav>
      <h1 className="page-h tt">КРТ в Москве<span>трекер территорий</span></h1>
      <p className="hello-sub">
        Территории {krtTerm ? <Link href="/slovar/krt/">комплексного развития</Link> : 'комплексного развития'} из досье Шахматки: где город уже принял решение, кто застройщик и что с проектом сейчас.
        Данные на {asOf}{years.length ? `, первые события — ${years[0]} год` : ''}.
      </p>

      <dl className="land-stats krt-stats">
        <div className="card"><dt>Территорий</dt><dd>{rows.length}</dd><small>с событиями о КРТ в досье</small></div>
        <div className="card"><dt>Застройщик известен</dt><dd>{withDev}</dd><small>из {rows.length}</small></div>
        <div className="card"><dt>Продажи или ввод</dt><dd>{selling}</dd><small>проект дошёл до покупателей</small></div>
        <div className="card"><dt>Сигналов</dt><dd>{signals}</dd><small>о КРТ до официальных новостей</small></div>
      </dl>

      <KrtTracker rows={rows} />

      <p className="krt-links">Материалы о КРТ — в теме <Link href="/temy/krt/">«КРТ»</Link>, ранние сигналы по всем объектам — на странице <Link href="/signaly/">«Сигналы»</Link>.</p>

      <section className="sec faq-sec" aria-labelledby="h-faq">
        <div className="sec-h"><h2 id="h-faq" className="tt">Вопросы<span>и ответы</span></h2></div>
        <div className="faq">{faq.map((f) => <details key={f.q} className="card"><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
      </section>
    </>
  )
}
