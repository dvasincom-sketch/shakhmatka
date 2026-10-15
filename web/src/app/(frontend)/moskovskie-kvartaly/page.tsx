import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE, ogFor } from '@/lib/ui'
import { JsonLd } from '@/lib/jsonld'
import { MK_HOUSES, MK_CHECKED, MK_INDEX } from '@/lib/mk-houses'
import { MOSCOW_DISTRICTS } from '@/lib/districts'
import { MkHouses, type MkRow } from '@/lib/mk-ui'
import { FollowButton } from '@/lib/follow-button'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '«Московские кварталы»: все дома Фонда реновации в продаже и цены за м²',
  description: 'Где Фонд реновации продаёт квартиры дешевле всего: дома «Московских кварталов» с минимальной ценой за м², ценой лота, аукционами и датой выхода в продажу.',
  alternates: { canonical: `${SITE}/moskovskie-kvartaly/` },
  openGraph: ogFor(`${SITE}/moskovskie-kvartaly/`),
}

const MONTHS_G = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const MONTHS_N = ['янв.', 'февр.', 'март', 'апр.', 'май', 'июнь', 'июль', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.']
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const th = (x: number) => Math.round(x / 1000).toLocaleString('ru-RU')

export default function MkPage() {
  const rows: MkRow[] = MK_HOUSES.map((h) => ({ ...h, districtName: h.district ? MOSCOW_DISTRICTS[h.district]?.name : undefined, okrug: h.district ? MOSCOW_DISTRICTS[h.district]?.okrug : undefined }))
  // сравниваем дома по сопоставимой цене: одна и та же «стандартная» квартира в ценах одного месяца (гедонический индекс)
  const priced = rows.filter((h) => h.ppmStd)
  const med = median(priced.map((h) => h.ppmStd!))
  const cheapest = [...priced].sort((a, b) => a.ppmStd! - b.ppmStd!)[0]
  const IDX = MK_INDEX.index as Record<string, number>
  const idxMonths = Object.keys(IDX).sort()
  const growth = (IDX[MK_INDEX.to] - 1) * 100
  const auc = rows.filter((h) => h.auction).length
  const [y, m, d] = MK_CHECKED.split('-').map(Number)
  const since = new Date(Date.UTC(y, m - 1, d) - 60 * 864e5).toISOString().slice(0, 10)
  const fresh = rows.filter((h) => h.first >= since).length
  const okrugs = [...new Set(priced.map((h) => h.okrug).filter(Boolean) as string[])].sort()
  const byOk = okrugs.map((o) => { const xs = priced.filter((h) => h.okrug === o).map((h) => h.ppmStd!); return { o, n: xs.length, med: median(xs) } }).filter((x) => x.n >= 3).sort((a, b) => a.med - b.med)
  const maxOk = Math.max(...byOk.map((x) => x.med))
  const ch = priced.filter((h) => h.ppmNow && h.ppmFirst && h.nowMonth && h.nowMonth > h.first.slice(0, 7)).map((h) => (h.ppmNow! / h.ppmFirst! - 1) * 100)
  const asOf = `${d} ${MONTHS_G[m - 1]} ${y} года`
  const faq = [
    { q: 'Что такое «Московские кварталы»?', a: 'Бренд, под которым Московский фонд реновации продаёт часть квартир на открытом рынке — через портал москварталы.рф. Проект запущен в конце мая 2025 года. Фонд — застройщик домов для переселения по программе реновации; на продажу выставляются квартиры, которые не нужны для переселения.' },
    { q: 'Где Фонд реновации продаёт квартиры дешевле всего?', a: `Если сравнивать одинаковую квартиру в ценах одного месяца, дешевле всего — дом ${cheapest.name}${cheapest.districtName ? ` (${cheapest.districtName})` : ''}: около ${th(cheapest.ppmStd!)} тыс. ₽ за м² для двухкомнатной квартиры 55 м² на среднем этаже в ценах сентября–октября 2026 года. Медиана по ${priced.length} домам — ${th(med)} тыс. ₽ за м².` },
    { q: 'Как продаются квартиры — напрямую или через аукцион?', a: `Есть оба способа: часть квартир продаётся по фиксированной цене с бронированием на портале, часть — через электронный аукцион, где фиксированная цена стартовая. В подборке аукционы были хотя бы у части квартир в ${auc} домах из ${rows.length}.` },
    { q: 'Почему нельзя просто сравнить цены разных домов?', a: `Квартиры выставляются в разные месяцы, а за это время цены Фонда выросли примерно на ${growth.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}% (декабрь 2025 → сентябрь–октябрь 2026). Кроме того, минимальная цена зависит от того, какие квартиры попали в продажу: студия на первом этаже и трёхкомнатная на 20-м по-разному стоят за метр. Поэтому сравниваем сопоставимую цену — оценку модели для одной и той же квартиры в ценах одного месяца.` },
    { q: 'Как считается сопоставимая цена?', a: `Гедоническая регрессия с фиксированными эффектами домов по ${MK_INDEX.n} квартирам из ${MK_INDEX.houses_n} домов: логарифм цены за м² раскладывается на эффект дома, эффект месяца, площадь, этаж, число комнат и признак аукциона. Месячный индекс выделяется по домам, квартиры которых выставлялись в разные месяцы. Сопоставимая цена — прогноз для двухкомнатной квартиры 55 м² на среднем этаже без аукциона в ценах сентября–октября 2026 года. Модель объясняет ${Math.round(MK_INDEX.r2 * 100)}% разброса цен; у домов, где выставлялись 1–2 квартиры, оценка грубая.` },
  ]
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Dataset', name: 'Дома «Московских кварталов» и цены за м²', url: `${SITE}/moskovskie-kvartaly/`, inLanguage: 'ru', description: metadata.description, dateModified: MK_CHECKED, creator: { '@type': 'Organization', name: 'Шахматка', url: SITE } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Лента', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Фонд реновации', item: `${SITE}/zastroyshchiki/fond-renovatsii/` }, { '@type': 'ListItem', position: 3, name: 'Московские кварталы', item: `${SITE}/moskovskie-kvartaly/` }] },
  ]
  return (
    <>
      {ld.map((x, i) => <JsonLd key={i} data={x} />)}
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><Link href="/zastroyshchiki/fond-renovatsii/">Фонд реновации</Link><span>/</span><span>Московские кварталы</span></nav>
      <h1 className="page-h tt">«Московские кварталы»<span>все дома Фонда реновации и цены за м²</span></h1>
      <p className="hello-sub">
        Фонд реновации продаёт квартиры в {rows.length} домах — от старых стартовых домов реновации до строящихся. Мы собрали их в одну таблицу и привели цены к одной квартире и одному месяцу, чтобы дома можно было сравнивать: сопоставимая цена за метр, фактический минимум и лот, когда дом вышел в продажу, есть ли аукцион и семейная ипотека. Данные на {asOf}.
      </p>
      <FollowButton kind="developer" id="fond-renovatsii" label="Фонд реновации" hint="Новые дома и квартиры «Московских кварталов», изменения цен." />

      <dl className="land-stats sp-stats">
        <div className="card"><dt>Домов в продаже</dt><dd>{rows.length}</dd><small>цена известна у {priced.length}, аукцион — в {auc}</small></div>
        <div className="card"><dt>Медиана</dt><dd>{th(med)} тыс.</dd><small>₽ за м², сопоставимая цена, сен–окт 2026</small></div>
        <div className="card"><dt>Дешевле всего</dt><dd>{th(cheapest.ppmStd!)} тыс.</dd><small><Link href={`/obekty/${cheapest.slug}/`}>{cheapest.name}</Link></small></div>
        <div className="card"><dt>Цены Фонда</dt><dd>{growth > 0 ? '+' : ''}{growth.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}%</dd><small>с декабря 2025 по сен–окт 2026 при той же квартире</small></div>
        <div className="card"><dt>Новых за 60 дней</dt><dd>{fresh}</dd><small>домов вышли в продажу за два месяца</small></div>
      </dl>

      <MkHouses rows={rows} okrugs={okrugs} />

      {byOk.length ? (
        <section className="sec" aria-labelledby="h-ok">
          <div className="sec-h"><h2 id="h-ok" className="tt">По округам<span>медиана сопоставимой цены за м²</span></h2></div>
          <ol className="mk-ok card">
            {byOk.map((x) => (
              <li key={x.o}><span>{x.o}</span><i style={{ width: `${(x.med / maxOk) * 100}%` }} /><b>{th(x.med)} тыс. ₽</b><small>{x.n} {x.n % 10 === 1 && x.n % 100 !== 11 ? 'дом' : [2, 3, 4].includes(x.n % 10) && ![12, 13, 14].includes(x.n % 100) ? 'дома' : 'домов'}</small></li>
            ))}
          </ol>
          {ch.length ? <p className="note">Почему нельзя сравнивать минимальные цены напрямую: по {ch.length} домам, где квартиры выставлялись больше одного месяца, минимальная цена за метр с первого размещения в медиане изменилась на {median(ch) > 0 ? '+' : ''}{median(ch).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%, а цена той же квартиры по индексу Фонда за то же время выросла заметно сильнее. Позже в продажу чаще выходят лоты, которые дешевле за метр (большие площади, нижние этажи), и рост цен прячется за сменой ассортимента.</p> : null}
        </section>
      ) : null}

      <section className="sec" aria-labelledby="h-idx">
        <div className="sec-h"><h2 id="h-idx" className="tt">Индекс цен Фонда<span>та же квартира в том же доме, декабрь 2025 = 100</span></h2></div>
        <ol className="mk-ok card mk-idx">
          {idxMonths.map((mo) => {
            const v = IDX[mo] * 100, mx = Math.max(...idxMonths.map((x) => IDX[x] * 100)), mn = Math.min(...idxMonths.map((x) => IDX[x] * 100)) - 3
            const [yy, mm] = mo.split('-').map(Number)
            return <li key={mo}><span>{MONTHS_N[mm - 1]} {yy}{mo === MK_INDEX.to && Object.keys(MK_INDEX.merged || {}).length ? '–окт.' : ''}</span><i style={{ width: `${Math.max(4, ((v - mn) / (mx - mn)) * 100)}%` }} /><b>{v.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}</b><small>{mo === MK_INDEX.base ? 'база' : `±${(1.96 * (MK_INDEX.index_se as Record<string, number>)[mo] * 100).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}`}</small></li>
          })}
        </ol>
        <p className="note">Индекс показывает, как менялась цена одной и той же квартиры: модель учитывает дом, площадь, этаж, комнаты и аукцион. ± — 95-процентный доверительный интервал. Октябрь 2026 объединён с сентябрём: в октябре пока выставлялись только новые дома, по ним изменение цен не измерить.</p>
      </section>

      <section className="sec" aria-labelledby="h-how">
        <div className="sec-h"><h2 id="h-how" className="tt">Как читать таблицу<span>и откуда данные</span></h2></div>
        <div className="land-intro sp-how">
          <p>Источник — карточки домов и квартир на портале «Московских кварталов» (москварталы.рф). «В продаже с» — месяц, когда квартиры дома впервые появились в продаже. Крупная цифра — сопоставимая цена (≈): одна и та же двухкомнатная квартира 55 м² в ценах сентября–октября 2026 года, по ней дома можно сравнивать между собой. Ниже — факт: минимальная цена за метр и лот среди квартир, выставленных в указанный месяц; самые дешёвые лоты быстро бронируют, поэтому на портале сейчас может не быть квартиры по этой цене.</p>
          <p>У каждого дома есть досье с хронологией: ввод, выход в продажу, аукционы, изменения цен. Профиль застройщика и все его проекты — на странице <Link href="/zastroyshchiki/fond-renovatsii/">Фонда реновации</Link>. Подборку под бюджет и район можно заказать в <Link href="/pro/?p=invest">инвестиционной подписке</Link>.</p>
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
