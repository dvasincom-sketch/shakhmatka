'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { sendSearchEvent } from './search-track'

type Hit = { type: string; title: string; subtitle?: string; url: string; developer?: string; district?: string; zu?: string }
const LABEL: Record<string, string> = { object: 'Объекты', developer: 'Застройщики', place: 'Районы', article: 'Материалы', interior: 'Интерьер', term: 'Словарь' }
const ORDER = ['object', 'developer', 'place', 'article', 'interior', 'term']

/** Поле поиска в шапке с подсказками (Meilisearch). Enter без выбранной подсказки — страница /poisk/. */
export function SearchBox() {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [open, setOpen] = useState(false)
  const [act, setAct] = useState(-1)
  const router = useRouter()
  const box = useRef<HTMLFormElement>(null)
  // сессия подсказок для аналитики: последний запрос с ответом; пишется один раз — при выборе подсказки или когда поле закрыли без выбора
  const sess = useRef<{ q: string; hits: number } | null>(null)
  const endSession = (url?: string, position?: number) => {
    const s = sess.current
    if (!s) return
    sess.current = null
    sendSearchEvent({ kind: 'suggest', q: s.q, hits: s.hits, url, position })
  }
  const id = useId()

  useEffect(() => {
    const s = q.trim()
    if (s.length < 2) { setHits([]); return }
    const ctl = new AbortController()
    const t = setTimeout(() => {
      fetch(`/poisk/suggest/?q=${encodeURIComponent(s)}`, { signal: ctl.signal }).then((r) => r.json()).then((d) => { setHits(d.hits || []); setAct(-1); setOpen(true); sess.current = { q: s, hits: (d.hits || []).length } }).catch(() => {})
    }, 140)
    return () => { clearTimeout(t); ctl.abort() }
  }, [q])
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) { setOpen(false); endSession() } }
    const leave = () => { if (document.visibilityState === 'hidden') endSession() }
    document.addEventListener('mousedown', close)
    document.addEventListener('visibilitychange', leave)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('visibilitychange', leave) }
  }, [])

  const sorted = ORDER.flatMap((t) => hits.filter((h) => h.type === t))
  const go = (url: string, position?: number) => { endSession(url, position); setOpen(false); router.push(url) }
  const onKey = (e: React.KeyboardEvent) => {
    if (!open || !sorted.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setAct((i) => Math.min(sorted.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAct((i) => Math.max(-1, i - 1)) }
    else if (e.key === 'Escape') setOpen(false)
    else if (e.key === 'Enter' && act >= 0) { e.preventDefault(); go(sorted[act].url, act + 1) }
  }

  return (
    <form className="search-top" action="/poisk/" role="search" ref={box} onSubmit={() => { setOpen(false); endSession('/poisk/') }}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></svg>
      <label htmlFor="q-top" className="sr">Поиск</label>
      <input
        id="q-top" name="q" type="search" placeholder="ЖК, адрес участка, застройщик" autoComplete="off"
        value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => hits.length && setOpen(true)} onKeyDown={onKey}
        role="combobox" aria-expanded={open && sorted.length > 0} aria-controls={id} aria-activedescendant={act >= 0 ? `${id}-${act}` : undefined}
      />
      {open && sorted.length ? (
        <div className="sugg" id={id} role="listbox" aria-label="Подсказки">
          {ORDER.filter((t) => sorted.some((h) => h.type === t)).map((t) => (
            <div key={t} className="sugg-g">
              <p className="sugg-h">{LABEL[t]}</p>
              {sorted.map((h, i) => h.type !== t ? null : (
                <a key={h.url} id={`${id}-${i}`} role="option" aria-selected={i === act} className={i === act ? 'act' : ''} href={h.url} onMouseEnter={() => setAct(i)} onClick={(e) => { e.preventDefault(); go(h.url, i + 1) }}>
                  <b>{h.title}</b>
                  {h.type === 'object' ? <small>{[h.developer, h.zu && h.zu !== h.title ? h.zu : null, h.district].filter(Boolean).join(' · ')}</small> : h.subtitle ? <small>{h.subtitle}</small> : null}
                </a>
              ))}
            </div>
          ))}
          <a className="sugg-all" href={`/poisk/?q=${encodeURIComponent(q)}`} onClick={(e) => { e.preventDefault(); go(`/poisk/?q=${encodeURIComponent(q)}`, 0) }}>Все результаты по «{q}» →</a>
        </div>
      ) : null}
    </form>
  )
}
