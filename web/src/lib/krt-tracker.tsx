'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'

export type KrtEvent = { date: string; title: string; signal: boolean; unconfirmed: boolean; confirmed: boolean }
export type KrtRow = {
  slug: string
  name: string
  where: string // «Даниловский, ЮАО» или «Москва»
  okrug: string // ЦАО… или '' — район не указан
  developer?: { name: string; slug: string }
  stage: string // land | concept | architecture | permit | sales | completed | ''
  first: string // дата первого события о КРТ
  last: string // дата последнего события в досье
  events: KrtEvent[] // события о КРТ, свежие сверху
  signals: number
}

const GROUPS = [
  { v: 'early', label: 'Решение и торги', stages: ['land', 'concept', ''] },
  { v: 'project', label: 'Проект и разрешение', stages: ['architecture', 'permit'] },
  { v: 'sales', label: 'Продажи', stages: ['sales'] },
  { v: 'done', label: 'Сдано', stages: ['completed'] },
] as const
const STAGE_LABEL: Record<string, string> = { land: 'Участок', concept: 'Концепция', architecture: 'Проект', permit: 'Разрешение', sales: 'Продажи', completed: 'Сдано' }
const OKRUGS = ['ЦАО', 'САО', 'СВАО', 'ВАО', 'ЮВАО', 'ЮАО', 'ЮЗАО', 'ЗАО', 'СЗАО', 'ЗелАО', 'НАО', 'ТАО']
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const d = (iso: string) => { const x = new Date(iso); return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}` }
const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е')
const SORTS = [
  { v: 'last', label: 'Свежие события' },
  { v: 'first', label: 'Давние КРТ' },
  { v: 'name', label: 'По названию' },
] as const

export function KrtTracker({ rows }: { rows: KrtRow[] }) {
  const [okrug, setOkrug] = useState('')
  const [group, setGroup] = useState('')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<(typeof SORTS)[number]['v']>('last')
  const [open, setOpen] = useState<string | null>(null)

  const count = (o: string) => rows.filter((r) => r.okrug === o).length
  const groupOf = (r: KrtRow) => GROUPS.find((g) => (g.stages as readonly string[]).includes(r.stage))?.v
  const list = useMemo(() => {
    const s = norm(q.trim())
    const f = rows.filter((r) => (!okrug || (okrug === '-' ? !r.okrug : r.okrug === okrug)) && (!group || groupOf(r) === group) && (!s || norm(`${r.name} ${r.where} ${r.developer?.name || ''}`).includes(s)))
    return f.sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name, 'ru') : sort === 'first' ? a.first.localeCompare(b.first) : b.last.localeCompare(a.last)))
  }, [rows, okrug, group, q, sort]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="krt card" aria-label="Трекер КРТ">
      <div className="krt-f">
        <div className="chips wrap" role="group" aria-label="Округ">
          <button type="button" className={`chip${!okrug ? ' on' : ''}`} onClick={() => setOkrug('')}>Все округа<i>{rows.length}</i></button>
          {OKRUGS.filter(count).map((o) => (
            <button key={o} type="button" className={`chip${okrug === o ? ' on' : ''}`} onClick={() => setOkrug(okrug === o ? '' : o)}>{o}<i>{count(o)}</i></button>
          ))}
          {count('') ? <button type="button" className={`chip${okrug === '-' ? ' on' : ''}`} onClick={() => setOkrug(okrug === '-' ? '' : '-')}>Район не указан<i>{count('')}</i></button> : null}
        </div>
        <div className="chips wrap" role="group" aria-label="Стадия">
          <button type="button" className={`chip${!group ? ' on' : ''}`} onClick={() => setGroup('')}>Все стадии</button>
          {GROUPS.map((g) => {
            const n = rows.filter((r) => groupOf(r) === g.v).length
            return n ? <button key={g.v} type="button" className={`chip${group === g.v ? ' on' : ''}`} onClick={() => setGroup(group === g.v ? '' : g.v)}>{g.label}<i>{n}</i></button> : null
          })}
        </div>
        <div className="krt-row2">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Адрес, район или застройщик" aria-label="Поиск по трекеру" />
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Сортировка">
            {SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <p className="krt-n" aria-live="polite">{list.length === rows.length ? `Все территории: ${list.length}` : `Найдено: ${list.length} из ${rows.length}`}</p>

      <ol className="krt-list">
        {list.map((r) => {
          const shown = open === r.slug ? r.events : r.events.slice(0, 2)
          return (
            <li key={r.slug} className="krt-item">
              <div className="krt-h">
                <Link href={`/obekty/${r.slug}/`} className="krt-name">{r.name}</Link>
                <span className={`krt-st st-${r.stage || 'none'}`}>{STAGE_LABEL[r.stage] || 'Стадия уточняется'}</span>
              </div>
              <p className="krt-meta">
                <span>{r.where}</span>
                {r.developer ? <span>Застройщик: <Link href={`/zastroyshchiki/${r.developer.slug}/`}>{r.developer.name}</Link></span> : <span>Реализатор не определён</span>}
                <span>КРТ в досье с {d(r.first)}</span>
              </p>
              <ul className="krt-ev">
                {shown.map((e, i) => (
                  <li key={i}>
                    <time dateTime={e.date}>{d(e.date)}</time>
                    <span>
                      {e.signal ? <b className={`krt-b${e.unconfirmed ? ' no' : e.confirmed ? ' ok' : ''}`}>{e.unconfirmed ? 'Не подтвердилось' : e.confirmed ? 'Сигнал подтвердился' : 'Сигнал'}</b> : null}
                      {e.title}
                    </span>
                  </li>
                ))}
              </ul>
              {r.events.length > 2 ? (
                <button type="button" className="krt-more" onClick={() => setOpen(open === r.slug ? null : r.slug)} aria-expanded={open === r.slug}>
                  {open === r.slug ? 'Свернуть' : `Ещё ${r.events.length - 2} о КРТ`}
                </button>
              ) : null}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
