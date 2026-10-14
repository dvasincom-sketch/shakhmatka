'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'

export type DevRow = {
  slug: string; name: string; objects: number; selling: number; articles: number; signals: number
  last: string | null; projects: { name: string; slug: string }[]
}

const SORTS = [
  { v: 'size', label: 'Больше проектов' },
  { v: 'fresh', label: 'Свежие события' },
  { v: 'abc', label: 'А–Я' },
] as const
const FILTERS = [
  { v: 'selling', label: 'Продают сейчас', test: (r: DevRow) => r.selling > 0 },
  { v: 'articles', label: 'Есть материалы', test: (r: DevRow) => r.articles > 0 },
  { v: 'signals', label: 'Есть сигналы', test: (r: DevRow) => r.signals > 0 },
] as const
const MONTHS = ['янв.', 'февр.', 'март', 'апр.', 'май', 'июнь', 'июль', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.']
const when = (iso: string | null) => { if (!iso) return ''; const d = new Date(iso); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` }
const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').replace(/[«»"'.\s-]/g, '')
const plural = (n: number, a: string, b: string, c: string) => { const x = n % 10, y = n % 100; return x === 1 && y !== 11 ? a : x >= 2 && x <= 4 && (y < 12 || y > 14) ? b : c }

/** Справочник застройщиков: поиск по названию и проектам, сортировка, фильтры. Все строки уже в HTML — для поисковиков. */
export function DevDirectory({ rows }: { rows: DevRow[] }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<(typeof SORTS)[number]['v']>('size')
  const [on, setOn] = useState<string[]>([])

  const list = useMemo(() => {
    const nq = norm(q)
    let r = rows.filter((x) => !nq || norm(x.name).includes(nq) || x.projects.some((p) => norm(p.name).includes(nq)))
    for (const f of FILTERS) if (on.includes(f.v)) r = r.filter(f.test)
    if (sort === 'size') r = [...r].sort((a, b) => b.objects - a.objects || b.articles - a.articles)
    if (sort === 'fresh') r = [...r].sort((a, b) => (b.last || '').localeCompare(a.last || ''))
    if (sort === 'abc') r = [...r].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    return r
  }, [rows, q, sort, on])

  const letter = (n: string) => n.replace(/^[«"]/, '').charAt(0).toUpperCase()
  return (
    <section className="devdir" aria-label="Все застройщики">
      <div className="devdir-bar card">
        <label className="devdir-q">
          <span className="sr">Найти застройщика или проект</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Застройщик или ЖК: ПИК, Level, «Остров»…" autoComplete="off" />
        </label>
        <div className="devdir-ctrl">
          <nav className="sorts" aria-label="Сортировка">
            {SORTS.map((s) => <button key={s.v} type="button" className={sort === s.v ? 'on' : ''} aria-pressed={sort === s.v} onClick={() => setSort(s.v)}>{s.label}</button>)}
          </nav>
          <div className="chips wrap">
            {FILTERS.map((f) => {
              const act = on.includes(f.v)
              return <button key={f.v} type="button" className={`chip${act ? ' on' : ''}`} aria-pressed={act} onClick={() => setOn(act ? on.filter((x) => x !== f.v) : [...on, f.v])}>{f.label}<i>{rows.filter(f.test).length}</i></button>
            })}
          </div>
        </div>
      </div>

      <p className="found" aria-live="polite">{list.length ? `${list.length} ${plural(list.length, 'застройщик', 'застройщика', 'застройщиков')}` : 'Никого не нашли — попробуйте другое название'}</p>

      <ol className="devdir-list">
        {list.map((r, i) => {
          const head = sort === 'abc' && (i === 0 || letter(list[i - 1].name) !== letter(r.name))
          return (
            <li key={r.slug} className={head ? 'has-letter' : ''} data-letter={head ? letter(r.name) : undefined}>
              <Link className="devrow card" href={`/zastroyshchiki/${r.slug}/`}>
                <span className="devrow-name"><b>{r.name}</b>{r.projects.length ? <small>{r.projects.map((p) => p.name).join(' · ')}{r.objects > r.projects.length ? ` и ещё ${r.objects - r.projects.length}` : ''}</small> : null}</span>
                <span className="devrow-nums">
                  <span><b>{r.objects}</b>{plural(r.objects, 'проект', 'проекта', 'проектов')}</span>
                  {r.selling ? <span className="sell"><b>{r.selling}</b>в продаже</span> : null}
                  {r.articles ? <span><b>{r.articles}</b>{plural(r.articles, 'материал', 'материала', 'материалов')}</span> : null}
                  {r.signals ? <span className="sig"><b>{r.signals}</b>{plural(r.signals, 'сигнал', 'сигнала', 'сигналов')}</span> : null}
                </span>
                {r.last ? <span className="devrow-when">{when(r.last)}</span> : null}
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
