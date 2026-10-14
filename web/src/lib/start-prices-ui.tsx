'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { StartPriceRow } from './start-prices'

const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
const MONTHS_G = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const ym = (s: string) => { const [y, m] = s.split('-').map(Number); return `${MONTHS[m - 1]} ${y}` }
const dmy = (s: string) => { const [y, m, d] = s.split('-').map(Number); return d ? `${d} ${MONTHS_G[m - 1]} ${y}` : ym(s) }
const mln = (x: number) => `${x.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн ₽`
const pct = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x).toLocaleString('ru-RU', { maximumFractionDigits: 0 })}%`
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return 'источник' } }
const SORTS = [
  { v: 'change', label: 'По росту цены' },
  { v: 'year', label: 'По росту в год' },
  { v: 'start', label: 'По дате старта' },
  { v: 'now', label: 'По цене сейчас' },
] as const

export function StartPrices({ rows }: { rows: StartPriceRow[] }) {
  const [sort, setSort] = useState<(typeof SORTS)[number]['v']>('change')
  const [tip, setTip] = useState<string | null>(null)
  const list = useMemo(() => [...rows].sort((a, b) =>
    sort === 'change' ? b.changePct - a.changePct
      : sort === 'year' ? b.perYearPct - a.perYearPct
        : sort === 'start' ? a.start.date.localeCompare(b.start.date)
          : b.now.lot_from - a.now.lot_from), [rows, sort])
  const max = Math.max(...rows.map((r) => Math.max(r.start.lot_from, r.now.lot_from)))
  const x = (v: number) => `${(v / max) * 100}%`

  return (
    <section className="sp card" aria-label="Цена на старте и сейчас">
      <div className="sp-bar">
        <div className="sp-legend" aria-hidden="true">
          <span><i className="sp-dot s" />на старте продаж</span>
          <span><i className="sp-dot n" />сейчас</span>
        </div>
        <label className="sp-sort">
          <span className="vh">Сортировка</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            {SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <ol className="sp-list">
        {list.map((r) => {
          const up = r.now.lot_from >= r.start.lot_from
          const lo = Math.min(r.start.lot_from, r.now.lot_from), hi = Math.max(r.start.lot_from, r.now.lot_from)
          return (
            <li key={r.slug} className={`sp-row${tip === r.slug ? ' on' : ''}`} onMouseEnter={() => setTip(r.slug)} onMouseLeave={() => setTip(null)}>
              <div className="sp-h">
                <div>
                  <Link className="sp-name" href={`/obekty/${r.slug}/`}>{r.name}</Link>
                  <p className="sp-meta">{[r.developer, r.districtName && `${r.districtName}${r.okrug ? `, ${r.okrug}` : ''}`].filter(Boolean).join(' · ')}</p>
                </div>
                <div className="sp-chg">
                  <b className={up ? 'up' : 'down'}>{pct(r.changePct)}</b>
                  <small>{pct(r.perYearPct)} в год · за {r.years.toLocaleString('ru-RU')} года</small>
                </div>
              </div>
              <div className="sp-track" role="img" aria-label={`Минимальная цена: на старте ${mln(r.start.lot_from)}, сейчас ${mln(r.now.lot_from)}`}>
                <span className={`sp-seg ${up ? 'up' : 'down'}`} style={{ left: x(lo), width: `calc(${x(hi)} - ${x(lo)})` }} />
                <span className="sp-dot s" style={{ left: x(r.start.lot_from) }} />
                <span className="sp-dot n" style={{ left: x(r.now.lot_from) }} />
              </div>
              <dl className="sp-vals">
                <div>
                  <dt>Старт · {ym(r.start.date)}</dt>
                  <dd>от {mln(r.start.lot_from)}</dd>
                  {r.start.lot_desc ? <small>{r.start.lot_desc}</small> : null}
                  <a href={r.start.source.url} target="_blank" rel="noopener nofollow" title={r.start.source.title || undefined}>Источник: {host(r.start.source.url)}</a>
                </div>
                <div>
                  <dt>Сейчас · {dmy(r.now.as_of)}</dt>
                  <dd>от {mln(r.now.lot_from)}</dd>
                  {r.now.lot_desc ? <small>{r.now.lot_desc}</small> : null}
                  <a href={r.now.source.url} target="_blank" rel="noopener nofollow" title={r.now.source.title || undefined}>Источник: {host(r.now.source.url)}</a>
                </div>
              </dl>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
