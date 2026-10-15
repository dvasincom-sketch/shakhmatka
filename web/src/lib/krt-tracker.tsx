'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Select } from './select'

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
const STAGE_ORDER = ['land', 'concept', 'architecture', 'permit', 'sales', 'completed']
const STAGE_LABEL: Record<string, string> = { land: 'Участок', concept: 'Концепция', architecture: 'Проект', permit: 'Разрешение', sales: 'Продажи', completed: 'Сдано' }
const OKRUGS = ['ЦАО', 'САО', 'СВАО', 'ВАО', 'ЮВАО', 'ЮАО', 'ЮЗАО', 'ЗАО', 'СЗАО', 'ЗелАО', 'НАО', 'ТАО']
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const d = (iso: string) => { const x = new Date(iso); return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}` }
const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е')
const SORTS = [
  { v: 'last', label: 'свежие события' },
  { v: 'first', label: 'давние КРТ' },
  { v: 'name', label: 'по алфавиту' },
] as const

export function KrtTracker({ rows }: { rows: KrtRow[] }) {
  const [okrug, setOkrug] = useState('')
  const [group, setGroup] = useState('')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<(typeof SORTS)[number]['v']>('last')
  const [open, setOpen] = useState<string | null>(null)

  const groupOf = (r: KrtRow) => GROUPS.find((g) => (g.stages as readonly string[]).includes(r.stage))?.v
  const okrugs = OKRUGS.map((o) => ({ o, n: rows.filter((r) => r.okrug === o).length })).filter((x) => x.n)
  const okrugOptions = [{ v: '', label: 'Все округа', hint: String(rows.length) }, ...okrugs.map(({ o, n }) => ({ v: o, label: o, hint: String(n) }))]
  const byOkrug = rows.filter((r) => !okrug || r.okrug === okrug)
  const list = useMemo(() => {
    const s = norm(q.trim())
    const f = byOkrug.filter((r) => (!group || groupOf(r) === group) && (!s || norm(`${r.name} ${r.where} ${r.developer?.name || ''}`).includes(s)))
    return f.sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name, 'ru') : sort === 'first' ? a.first.localeCompare(b.first) : b.last.localeCompare(a.last)))
  }, [rows, okrug, group, q, sort]) // eslint-disable-line react-hooks/exhaustive-deps
  const filtered = !!(okrug || group || q)
  const reset = () => { setOkrug(''); setGroup(''); setQ('') }

  return (
    <section className="krt" aria-label="Трекер КРТ">
      <div className="krt-f card">
        <div className="krt-row1">
          <label className="krt-q">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Адрес, район или застройщик" aria-label="Поиск по трекеру" />
          </label>
          <Select label="Округ" prefix="Округ:" value={okrug} options={okrugOptions} onChange={setOkrug} />
          <Select label="Сортировка" prefix="Сначала:" value={sort} options={SORTS} onChange={setSort} />
        </div>
        <div className="krt-stages" role="group" aria-label="Стадия">
          <button type="button" className={`kst${!group ? ' on' : ''}`} onClick={() => setGroup('')}>Все стадии<i>{byOkrug.length}</i></button>
          {GROUPS.map((g) => {
            const n = byOkrug.filter((r) => groupOf(r) === g.v).length
            return <button key={g.v} type="button" disabled={!n} className={`kst g-${g.v}${group === g.v ? ' on' : ''}`} onClick={() => setGroup(group === g.v ? '' : g.v)}><b aria-hidden="true" />{g.label}<i>{n}</i></button>
          })}
        </div>
      </div>

      <div className="krt-n" aria-live="polite">
        <span>{filtered ? `Найдено ${list.length} из ${rows.length}` : `Все территории: ${rows.length}`}</span>
        {filtered ? <button type="button" className="krt-reset" onClick={reset}>Сбросить фильтры</button> : null}
      </div>

      {list.length ? (
        <ol className="krt-list">
          {list.map((r) => {
            const isOpen = open === r.slug
            const shown = isOpen ? r.events : r.events.slice(0, 1)
            const si = STAGE_ORDER.indexOf(r.stage)
            return (
              <li key={r.slug} className="krt-item card">
                <div className="krt-top">
                  <span className={`krt-st st-${r.stage || 'none'}`}>{STAGE_LABEL[r.stage] || 'Стадия уточняется'}</span>
                  <span className="krt-where">{r.where}</span>
                </div>
                <Link href={`/obekty/${r.slug}/`} className="krt-name">{r.name}</Link>
                <span className="krt-steps" role="img" aria-label={`Стадия ${si + 1} из ${STAGE_ORDER.length}`}>
                  {STAGE_ORDER.map((s, i) => <i key={s} className={i < si ? 'done' : i === si ? 'now' : ''} />)}
                </span>
                <p className="krt-meta">
                  {r.developer ? <span>Реализатор: <Link href={`/zastroyshchiki/${r.developer.slug}/`}>{r.developer.name}</Link></span> : <span className="muted">Реализатор не определён</span>}
                  {r.signals ? <span className="krt-sigs">{r.signals} {r.signals === 1 ? 'сигнал' : r.signals < 5 ? 'сигнала' : 'сигналов'}</span> : null}
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
                <div className="krt-foot">
                  {r.events.length > 1 ? (
                    <button type="button" className="krt-more" onClick={() => setOpen(isOpen ? null : r.slug)} aria-expanded={isOpen}>
                      {isOpen ? 'Свернуть' : `История КРТ · ${r.events.length}`}
                    </button>
                  ) : <span className="muted">КРТ в досье с {d(r.first)}</span>}
                  <Link href={`/obekty/${r.slug}/`} className="krt-go">Досье →</Link>
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <div className="krt-empty card"><p>По этим условиям территорий нет.</p><button type="button" className="krt-reset" onClick={reset}>Сбросить фильтры</button></div>
      )}
    </section>
  )
}
