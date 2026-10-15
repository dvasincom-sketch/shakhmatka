'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { MK_INDEX, type MkHouse } from './mk-houses'
import { Select } from './select'

const MONTHS_P = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре']
const MONTHS_G = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const ymG = (s: string) => { const [y, m] = s.split('-').map(Number); return `${MONTHS_G[m - 1]} ${y}` }
const th = (x: number) => `${Math.round(x / 1000).toLocaleString('ru-RU')} тыс. ₽/м²`
const mln = (x: number) => `${x.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн ₽`
export type MkRow = MkHouse & { districtName?: string; okrug?: string }

const SORTS = [
  { v: 'ppm', label: 'дешевле за м² (сопоставимо)' },
  { v: 'lot', label: 'дешевле лот' },
  { v: 'new', label: 'новые в продаже' },
  { v: 'chg', label: 'сильнее рынка подорожали' },
] as const
const STATUS = [
  { v: 'all', label: 'все дома' },
  { v: 'done', label: 'введённые' },
  { v: 'building', label: 'строящиеся' },
] as const
const IDX = MK_INDEX.index as Record<string, number>
const idxAt = (m: string) => IDX[m] ?? IDX[(MK_INDEX.merged as Record<string, string>)[m] || ''] ?? null
/** Рост минимальной цены с первого размещения сверх общего роста цен Фонда за тот же период (по индексу), п. п. */
const chg = (h: MkRow) => {
  if (!(h.ppmNow && h.ppmFirst && h.nowMonth && h.nowMonth > h.first.slice(0, 7))) return null
  const a = idxAt(h.first.slice(0, 7)), b = idxAt(h.nowMonth)
  return { raw: (h.ppmNow / h.ppmFirst - 1) * 100, market: a && b ? (b / a - 1) * 100 : null }
}
const excess = (h: MkRow) => { const c = chg(h); return c && c.market !== null ? c.raw - c.market : null }

export function MkHouses({ rows, okrugs }: { rows: MkRow[]; okrugs: string[] }) {
  const [sort, setSort] = useState<(typeof SORTS)[number]['v']>('ppm')
  const [status, setStatus] = useState<(typeof STATUS)[number]['v']>('all')
  const [okrug, setOkrug] = useState('all')
  const [more, setMore] = useState(false)
  const OK = useMemo(() => [{ v: 'all', label: 'вся Москва' }, ...okrugs.map((o) => ({ v: o, label: o }))], [okrugs])
  const list = useMemo(() => rows
    .filter((h) => (h.ppmStd || h.ppmNow) && (status === 'all' || (status === 'done' ? h.done : h.building)) && (okrug === 'all' || h.okrug === okrug))
    .sort((a, b) => sort === 'ppm' ? (a.ppmStd ?? a.ppmNow!) - (b.ppmStd ?? b.ppmNow!)
      : sort === 'lot' ? (a.priceNow ?? 1e9) - (b.priceNow ?? 1e9)
        : sort === 'new' ? b.first.localeCompare(a.first)
          : (excess(b) ?? -1e9) - (excess(a) ?? -1e9)), [rows, sort, status, okrug])
  const shown = more ? list : list.slice(0, 40)
  return (
    <section className="mk card" aria-label="Дома «Московских кварталов» с ценами">
      <div className="mk-bar">
        <Select className="sp-sort" label="Сортировка" prefix="Сначала:" value={sort} options={SORTS} onChange={setSort} />
        <Select className="sp-sort" label="Округ" prefix="Где:" value={okrug} options={OK} onChange={setOkrug} />
        <Select className="sp-sort" label="Стадия" prefix="Дома:" value={status} options={STATUS} onChange={setStatus} />
        <span className="mk-n">{list.length} {list.length % 10 === 1 && list.length % 100 !== 11 ? 'дом' : [2, 3, 4].includes(list.length % 10) && ![12, 13, 14].includes(list.length % 100) ? 'дома' : 'домов'}</span>
      </div>
      <ol className="mk-list">
        {shown.map((h) => {
          const c = chg(h)
          return (
            <li key={h.slug} className="mk-row">
              <div className="mk-main">
                <Link className="sp-name" href={`/obekty/${h.slug}/`}>{h.name}</Link>
                <p className="sp-meta">{[h.districtName && `${h.districtName}${h.okrug ? `, ${h.okrug}` : ''}`, h.done ? `введён${h.year ? ` в ${h.year}` : ''}` : h.building ? `строится${h.completion ? `, ввод ${h.completion}` : ''}` : null, h.flats && `${h.flats} кв.`].filter(Boolean).join(' · ')}</p>
                <p className="mk-tags">
                  {h.auction ? <i className="mk-tag">аукцион</i> : null}
                  {h.family ? <i className="mk-tag">семейная ипотека</i> : null}
                  {h.finish && /отделк/i.test(h.finish) && !/без/i.test(h.finish) ? <i className="mk-tag">с отделкой</i> : null}
                  <span className="mk-since">в продаже с {ymG(h.first)}</span>
                </p>
              </div>
              <div className="mk-price">
                {h.ppmStd ? <b title="Сопоставимая цена: стандартная квартира (2 комнаты, 55 м², средний этаж) в ценах сентября–октября 2026">≈ {th(h.ppmStd)}</b> : <b>от {th(h.ppmNow!)}</b>}
                {h.ppmStd ? <small>сопоставимо, сен–окт 2026{h.stdN && h.stdN < 3 ? ' · мало квартир, оценка грубая' : ''}</small> : null}
                {h.ppmNow ? <small>факт: от {th(h.ppmNow)}{h.priceNow ? `, лоты от ${mln(h.priceNow)}` : ''} в {MONTHS_P[Number(h.nowMonth!.slice(5)) - 1]} {h.nowMonth!.slice(0, 4)}</small> : null}
                {c && c.market !== null ? <small className={c.raw - c.market > 1 ? 'up' : c.raw - c.market < -1 ? 'down' : ''}>мин. цена {c.raw > 0 ? '+' : c.raw < 0 ? '−' : ''}{Math.abs(c.raw).toLocaleString('ru-RU', { maximumFractionDigits: 0 })}% с первого размещения, рынок Фонда {c.market > 0 ? '+' : '−'}{Math.abs(c.market).toLocaleString('ru-RU', { maximumFractionDigits: 0 })}%</small> : null}
              </div>
            </li>
          )
        })}
      </ol>
      {list.length > 40 && !more ? <button className="btn ghost mk-more" onClick={() => setMore(true)}>Показать все {list.length}</button> : null}
    </section>
  )
}
