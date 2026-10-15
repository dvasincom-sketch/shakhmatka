import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE, ogFor } from '@/lib/ui'
import { JsonLd } from '@/lib/jsonld'
import { START_PRICES, START_PRICES_CHECKED } from '@/lib/start-prices'
import { StartPrices } from '@/lib/start-prices-ui'

// Шапка и подвал сайта читают базу, а в Docker-сборке её нет — собираем на запрос, как остальные страницы
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Цены новостроек Москвы на старте продаж и сейчас',
  description: 'Сколько стоила самая дешёвая квартира в новостройках Москвы на старте продаж и сколько стоит сейчас: рост цены по проектам, в процентах за всё время и в год.',
  alternates: { canonical: `${SITE}/ceny-na-starte/` },
    openGraph: ogFor(`${SITE}/ceny-na-starte/`),
}

const MONTHS_G = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const fmt = (x: number) => x.toLocaleString('ru-RU', { maximumFractionDigits: 0 })

export default function StartPricesPage() {
  const rows = START_PRICES
  const [y, m, d] = START_PRICES_CHECKED.split('-').map(Number)
  const asOf = `${d} ${MONTHS_G[m - 1]} ${y} года`
  const medChange = median(rows.map((r) => r.changePct))
  const medYear = median(rows.map((r) => r.perYearPct))
  const top = [...rows].sort((a, b) => b.changePct - a.changePct)[0]
  const down = rows.filter((r) => r.changePct < 0)
  const faq = [
    {
      q: 'Как считается рост цены?',
      a: 'Сравниваем минимальную цену квартиры — сколько стоил самый дешёвый лот в день старта продаж по публикации о старте и сколько он стоит сейчас по каталогу проекта на дату проверки. Это «бюджет входа» в проект, а не цена квадратного метра: площадь самого дешёвого лота на старте и сейчас может отличаться, поэтому под каждой ценой указано, о каком лоте речь.',
    },
    {
      q: 'Насколько подорожали новостройки Москвы с начала продаж?',
      a: `В подборке ${rows.length} проектов Москвы со стартом продаж с 2018 по 2025 год. Медианный рост минимальной цены квартиры — ${fmt(medChange)}%, или ${fmt(medYear)}% в год. Сильнее всего вырос бюджет входа в проект ${top.name}: ${fmt(top.changePct)}% с ${top.start.date.slice(0, 4)} года.${down.length ? ` Подешевел вход в ${down.length > 1 ? 'проекты' : 'проект'} ${down.map((r) => r.name).join(', ')}.` : ''}`,
    },
    {
      q: 'Почему в подборке не все новостройки?',
      a: 'Проект попадает в подборку, только если обе цены подтверждены источником: публикацией о старте продаж (не позже трёх месяцев после старта) и каталогом с текущими предложениями. Офисы и апартаменты-коммерцию, сданные дома с остатками крупных лотов и проекты без открытой цены мы не сравниваем. Подборка пополняется.',
    },
    {
      q: 'Значит ли рост цены, что покупка на старте выгодна?',
      a: 'Рост минимальной цены показывает, как менялся бюджет входа в конкретный проект, но не доходность инвестора: на неё влияют ипотека, отделка, налоги и цена продажи на вторичном рынке. Материал не является инвестиционной рекомендацией.',
    },
  ]
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'Dataset', name: 'Цены новостроек Москвы на старте продаж и сейчас', url: `${SITE}/ceny-na-starte/`, inLanguage: 'ru',
      description: metadata.description, dateModified: START_PRICES_CHECKED, creator: { '@type': 'Organization', name: 'Шахматка', url: SITE },
      variableMeasured: ['Минимальная цена квартиры на старте продаж, млн ₽', 'Минимальная цена квартиры на дату проверки, млн ₽', 'Изменение, %'],
    },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Лента', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Цены на старте и сейчас', item: `${SITE}/ceny-na-starte/` }] },
  ]

  return (
    <>
      {ld.map((x, i) => <JsonLd key={i} data={x} />)}
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><span>Цены на старте и сейчас</span></nav>
      <h1 className="page-h tt">Цена на старте<span>и сейчас</span></h1>
      <p className="hello-sub">
        Сколько стоила самая дешёвая квартира в новостройках Москвы в день старта продаж — и сколько стоит сейчас. Обе цены проверены по открытым публикациям и каталогам; можно сортировать по росту за всё время и в год.
        Данные на {asOf}.
      </p>

      <dl className="land-stats sp-stats">
        <div className="card"><dt>Проектов</dt><dd>{rows.length}</dd><small>со стартом в 2018–2025 годах</small></div>
        <div className="card"><dt>Медианный рост</dt><dd>+{fmt(medChange)}%</dd><small>минимальной цены квартиры</small></div>
        <div className="card"><dt>В год</dt><dd>+{fmt(medYear)}%</dd><small>медиана по проектам</small></div>
        <div className="card"><dt>Максимум</dt><dd>+{fmt(top.changePct)}%</dd><small>{top.name}</small></div>
      </dl>

      <StartPrices rows={rows} />

      <section className="sec" aria-labelledby="h-how">
        <div className="sec-h"><h2 id="h-how" className="tt">Как мы считали<span>и чего здесь нет</span></h2></div>
        <div className="land-intro sp-how">
          <p>Цена на старте — минимальная цена квартиры из публикации о старте продаж: ежемесячного обзора стартов продаж в отраслевом каталоге, новости делового издания или сообщения застройщика, вышедших не позже трёх месяцев после старта. Если проект выходил очередями, берём первую.</p>
          <p>Цена сейчас — минимальная цена в каталоге проекта на дату проверки. Самые дешёвые лоты раскупают первыми, поэтому рост отчасти отражает то, что студий и маленьких квартир в продаже стало меньше; площадь лота указана под каждой ценой. Рост в год — среднегодовой, сложным процентом.</p>
          <p>Хронология каждого проекта — в его досье: ссылка в названии. Ранние сигналы о стартах продаж — на странице <Link href="/signaly/">«Сигналы»</Link>.</p>
        </div>
      </section>

      <section className="sec faq-sec" aria-labelledby="h-faq">
        <div className="sec-h"><h2 id="h-faq" className="tt">Вопросы<span>и ответы</span></h2></div>
        <div className="faq">{faq.map((f) => <details key={f.q} className="card"><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
      </section>
      <p className="sp-disc">Материал не является инвестиционной рекомендацией.</p>
    </>
  )
}
