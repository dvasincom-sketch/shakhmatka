'use client'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MAP_DISTRICTS, MAP_OKRUGS, MAP_VIEWS, type MapDistrict } from './moscow-map'

/** Что знает карта о районе: подборка, число проектов и несколько свежих проектов */
export type MapArea = {
  slug?: string
  n: number
  top: { name: string; slug: string; note?: string }[]
  /** у НАО и ТАО — поселения со своими подборками */
  parts?: { label: string; slug: string; n: number }[]
}
type Box = [number, number, number, number]

const OKRUG_ORDER = ['ЦАО', 'САО', 'СВАО', 'ВАО', 'ЮВАО', 'ЮАО', 'ЮЗАО', 'ЗАО', 'СЗАО', 'ЗелАО', 'НАО', 'ТАО']
const OKRUG_NAMES: Record<string, string> = {
  ЦАО: 'Центральный округ', САО: 'Северный округ', СВАО: 'Северо-Восточный округ', ВАО: 'Восточный округ', ЮВАО: 'Юго-Восточный округ',
  ЮАО: 'Южный округ', ЮЗАО: 'Юго-Западный округ', ЗАО: 'Западный округ', СЗАО: 'Северо-Западный округ', ЗелАО: 'Зеленоград',
  НАО: 'Новомосковский округ', ТАО: 'Троицкий округ',
}
const plural = (n: number, a: string, b: string, c: string) => {
  const x = n % 10, y = n % 100
  return x === 1 && y !== 11 ? a : x >= 2 && x <= 4 && (y < 12 || y > 14) ? b : c
}
const projects = (n: number) => `${n} ${plural(n, 'проект', 'проекта', 'проектов')}`
const bucket = (n: number) => (n <= 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 7 ? 3 : 4)
const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').replace(/-/g, ' ')

/** Ограничиваем рамку пропорциями блока, чтобы приближение не обрезало округ */
function fit(b: Box, aspect: number): Box {
  const [x, y, w, h] = b
  if (w / h > aspect) { const nh = w / aspect; return [x, y - (nh - h) / 2, w, nh] }
  const nw = h * aspect
  return [x - (nw - w) / 2, y, nw, h]
}

export function MoscowMap({ areas, unplaced }: { areas: Record<string, MapArea>; unplaced: number }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [aspect, setAspect] = useState(1.1)
  const [px, setPx] = useState(700) // ширина карты в пикселях — для кегля подписей
  const [okrug, setOkrug] = useState<string | null>(null) // null — Москва в МКАД, 'all' — вся Москва
  const [sel, setSel] = useState<string | null>(null)
  const [hover, setHover] = useState<{ k: string; x: number; y: number } | null>(null)
  const [q, setQ] = useState('')
  const target: Box = useMemo(() => {
    const b = okrug === 'all' ? MAP_VIEWS.all : okrug ? MAP_OKRUGS.find((o) => o.o === okrug)!.b : MAP_VIEWS.old
    return fit(b, aspect)
  }, [okrug, aspect])
  const [vb, setVb] = useState<Box>(target)
  const cur = useRef<Box>(target)

  // плавный переход между рамками
  useEffect(() => {
    const from = cur.current, t0 = performance.now(), dur = 420
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const step = (t: number) => {
      const p = reduce ? 1 : Math.min(1, (t - t0) / dur)
      const e = 1 - Math.pow(1 - p, 3)
      const next = from.map((v, i) => v + (target[i] - v) * e) as Box
      cur.current = next
      setVb(next)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target])

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      if (width && height) { setAspect(width / height); setPx(width) }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const byKey = useMemo(() => new Map(MAP_DISTRICTS.map((d) => [d.k, d])), [])
  const area = (k: string) => areas[k] || { n: 0, top: [] }
  const okrugCount = useMemo(() => {
    const m: Record<string, number> = {}
    for (const d of MAP_DISTRICTS) m[d.o] = (m[d.o] || 0) + area(d.k).n
    return m
  }, [areas]) // eslint-disable-line react-hooks/exhaustive-deps
  const total = Object.values(okrugCount).reduce((a, b) => a + b, 0)

  const pick = (k: string) => {
    const d = byKey.get(k)
    if (!d) return
    setSel(k)
    if (okrug !== d.o) setOkrug(d.o)
  }
  const results = useMemo(() => {
    const s = norm(q.trim())
    if (s.length < 2) return []
    const list: { k: string; label: string; n: number; slug?: string }[] = []
    for (const d of MAP_DISTRICTS) if (norm(d.n).includes(s)) list.push({ k: d.k, label: d.n, n: area(d.k).n })
    for (const k of ['nao', 'tao'])
      for (const p of area(k).parts || []) if (norm(p.label).includes(s)) list.push({ k, label: `${p.label} (${k === 'nao' ? 'НАО' : 'ТАО'})`, n: p.n, slug: p.slug })
    return list.sort((a, b) => b.n - a.n).slice(0, 6)
  }, [q, areas]) // eslint-disable-line react-hooks/exhaustive-deps

  const fpx = px < 500 ? 11 : 12
  const fs = (vb[2] / px) * fpx // подпись ~12 px при любом масштабе
  // подпись района — только если она помещается в его ширину (иначе на телефоне они налезают друг на друга)
  const fits = (d: MapDistrict) => ((d.b[2] / 1.3) * px) / vb[2] >= d.n.length * fpx * 0.5
  const scope = okrug && okrug !== 'all' ? MAP_DISTRICTS.filter((d) => d.o === okrug) : MAP_DISTRICTS
  const leaders = [...scope].filter((d) => area(d.k).n > 0).sort((a, b) => area(b.k).n - area(a.k).n).slice(0, 6)
  const s = sel ? byKey.get(sel) : null
  const sa = sel ? area(sel) : null
  const hv = hover ? byKey.get(hover.k) : null

  const label = (d: MapDistrict) => (d.k === 'nao' || d.k === 'tao' ? OKRUG_NAMES[d.o] : d.n)

  return (
    <section className="mmap card" aria-label="Карта районов Москвы">
      <div className="mmap-bar">
        <div className="chips mmap-ok" role="group" aria-label="Округа">
          <button type="button" className={`chip${okrug === null ? ' on' : ''}`} onClick={() => { setOkrug(null); setSel(null) }}>Москва</button>
          {OKRUG_ORDER.map((o) => (
            <button key={o} type="button" className={`chip${okrug === o ? ' on' : ''}`} onClick={() => { setOkrug(o); setSel(null) }} title={OKRUG_NAMES[o]}>
              {o}<i>{okrugCount[o] || 0}</i>
            </button>
          ))}
          <button type="button" className={`chip${okrug === 'all' ? ' on' : ''}`} onClick={() => { setOkrug('all'); setSel(null) }}>Вся Москва</button>
        </div>
        <div className="mmap-search">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти район или поселение" aria-label="Найти район или поселение" />
          {results.length > 0 && (
            <ul className="mmap-res">
              {results.map((r) => (
                <li key={r.label}>
                  <button type="button" onClick={() => { pick(r.k); setQ('') }}>{r.label}<i>{r.n ? projects(r.n) : 'нет проектов'}</i></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mmap-body">
        <div className="mmap-stage" ref={wrap} onPointerLeave={() => setHover(null)}>
          <svg viewBox={vb.join(' ')} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Районы Москвы: цвет показывает, сколько проектов в базе">
            <g className="mmap-d">
              {MAP_DISTRICTS.map((d) => {
                const n = area(d.k).n
                const dim = okrug && okrug !== 'all' && d.o !== okrug
                return (
                  <path
                    key={d.k}
                    d={d.d}
                    className={`m${bucket(n)}${sel === d.k ? ' sel' : ''}${hover?.k === d.k ? ' hov' : ''}${dim ? ' dim' : ''}`}
                    onClick={() => pick(d.k)}
                    onPointerMove={(e) => {
                      if (e.pointerType !== 'mouse') return
                      const r = wrap.current!.getBoundingClientRect()
                      setHover({ k: d.k, x: e.clientX - r.left, y: e.clientY - r.top })
                    }}
                  />
                )
              })}
            </g>
            <g className="mmap-o">{MAP_OKRUGS.map((o) => <path key={o.o} d={o.d} />)}</g>
            {s && <path className="mmap-sel" d={s.d} />}
            <g className="mmap-l" style={{ fontSize: fs }}>
              {okrug && okrug !== 'all'
                ? scope.filter((d) => d.k !== 'nao' && d.k !== 'tao' && (fits(d) || d.k === sel)).map((d) => (
                    <text key={d.k} x={d.c[0]} y={d.c[1]} className={area(d.k).n ? 'has' : ''} style={{ strokeWidth: fs * 0.28 }}>{d.n}</text>
                  ))
                : MAP_OKRUGS.filter((o) => okrug === 'all' || !['НАО', 'ТАО', 'ЗелАО'].includes(o.o) || o.o === 'НАО').map((o) => (
                    <text key={o.o} x={o.c[0]} y={o.c[1]} className="ok" style={{ strokeWidth: fs * 0.28 }}>{o.o}</text>
                  ))}
            </g>
          </svg>
          {hv && hover && (
            <div className="mmap-tip" style={{ left: hover.x, top: hover.y }}>
              <b>{label(hv)}</b>
              <span>{hv.k === 'nao' || hv.k === 'tao' ? 'Москва' : hv.o} · {area(hv.k).n ? projects(area(hv.k).n) : 'пока нет проектов'}</span>
            </div>
          )}
          <div className="mmap-legend" aria-hidden="true">
            <span><i className="m0" />0</span><span><i className="m1" />1</span><span><i className="m2" />2–3</span><span><i className="m3" />4–7</span><span><i className="m4" />8+</span>
          </div>
        </div>

        <aside className="mmap-panel" aria-live="polite">
          {s && sa ? (
            <>
              <p className="f-k">{s.k === 'nao' || s.k === 'tao' ? 'Москва' : `${OKRUG_NAMES[s.o]} · ${s.o}`}</p>
              <h2 className="mmap-h">{label(s)}</h2>
              <p className="mmap-n">{sa.n ? projects(sa.n) : 'Пока нет проектов в базе'}</p>
              {sa.parts && sa.parts.length > 0 && (
                <div className="chips wrap">{sa.parts.map((p) => <Link key={p.slug} className="chip" href={`/novostroyki/${p.slug}/`}>{p.label}<i>{p.n}</i></Link>)}</div>
              )}
              {sa.top.length > 0 && (
                <ul className="mmap-top">
                  {sa.top.map((o) => <li key={o.slug}><Link href={`/obekty/${o.slug}/`}>{o.name}</Link>{o.note && <span>{o.note}</span>}</li>)}
                </ul>
              )}
              {sa.slug && sa.n > 0 && !sa.parts && <Link className="btn mmap-go" href={`/novostroyki/${sa.slug}/`}>Все новостройки района</Link>}
              <button type="button" className="mmap-x" onClick={() => setSel(null)}>Сбросить выбор</button>
            </>
          ) : (
            <>
              <p className="f-k">{okrug && okrug !== 'all' ? OKRUG_NAMES[okrug] : 'Москва'}</p>
              <h2 className="mmap-h">{projects(okrug && okrug !== 'all' ? okrugCount[okrug] || 0 : total)} на карте</h2>
              <p className="mmap-hint">Нажмите на район, чтобы увидеть его проекты. Чем темнее цвет, тем больше проектов в базе.</p>
              {leaders.length > 0 && (
                <>
                  <p className="f-k mmap-sub">Больше всего проектов</p>
                  <ul className="mmap-lead">
                    {leaders.map((d) => (
                      <li key={d.k}><button type="button" onClick={() => pick(d.k)}>{label(d)}<i>{area(d.k).n}</i></button></li>
                    ))}
                  </ul>
                </>
              )}
              {!okrug && unplaced > 0 && (
                <p className="mmap-hint">Ещё у {unplaced} {unplaced % 10 === 1 && unplaced % 100 !== 11 ? 'проекта' : 'проектов'} район пока не указан — они есть в <Link href="/obekty/?geo=moscow">каталоге</Link>.</p>
              )}
            </>
          )}
        </aside>
      </div>
      <p className="mmap-c">Границы районов © участники OpenStreetMap</p>
    </section>
  )
}
