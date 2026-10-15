'use client'
import { useEffect, useId, useRef, useState } from 'react'

export type SelectOption<V extends string> = { v: V; label: string; hint?: string }

/**
 * Выпадающий список в стиле сайта вместо системного <select>: кнопка-«пилюля» и список-попап.
 * Доступность: role="listbox", стрелки ↑↓, Home/End, Enter/пробел — выбрать, Esc — закрыть, клик вне — закрыть.
 */
export function Select<V extends string>({ value, options, onChange, label, prefix, className = '' }: {
  value: V
  options: readonly SelectOption<V>[]
  onChange: (v: V) => void
  label: string // для скринридеров
  prefix?: string // видимая подпись внутри кнопки: «Сортировка:»
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(() => Math.max(0, options.findIndex((o) => o.v === value)))
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const id = useId()
  const cur = options.find((o) => o.v === value) || options[0]

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    list.current?.focus()
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const pick = (i: number) => { onChange(options[i].v); setOpen(false) }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(options.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(active) }
  }

  return (
    <div className={`sel${open ? ' open' : ''} ${className}`} ref={root}>
      <button
        type="button" className="sel-btn" aria-haspopup="listbox" aria-expanded={open} aria-label={`${label}: ${cur.label}`}
        onClick={() => { setActive(Math.max(0, options.findIndex((o) => o.v === value))); setOpen(!open) }}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true) } }}
      >
        {prefix ? <span className="sel-pre">{prefix}</span> : null}
        <span className="sel-cur">{cur.label}</span>
        <svg className="sel-chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open ? (
        <ul className="sel-list" role="listbox" id={id} aria-label={label} tabIndex={-1} ref={list} onKeyDown={onKey} aria-activedescendant={`${id}-${active}`}>
          {options.map((o, i) => (
            <li
              key={o.v} id={`${id}-${i}`} role="option" aria-selected={o.v === value}
              className={`${o.v === value ? 'on' : ''}${i === active ? ' act' : ''}`}
              onMouseEnter={() => setActive(i)} onClick={() => pick(i)}
            >
              <span>{o.label}</span>
              {o.hint ? <small>{o.hint}</small> : null}
              {o.v === value ? <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="m3 7.5 2.5 2.5L11 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
