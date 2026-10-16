'use client'
import Link from 'next/link'
import type { ReactNode } from 'react'

/** Отправка события поиска без ожидания ответа (переживает переход на другую страницу) */
export function sendSearchEvent(e: { kind: 'click' | 'suggest'; q: string; tab?: string; hits?: number; url?: string; position?: number }) {
  try {
    const body = JSON.stringify(e)
    if (navigator.sendBeacon) navigator.sendBeacon('/poisk/log/', new Blob([body], { type: 'application/json' }))
    else void fetch('/poisk/log/', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true })
  } catch { /* аналитика не должна ломать переход */ }
}

/** Ссылка из результатов поиска: при переходе записывает запрос, позицию и адрес */
export function TrackLink({ href, q, tab, position, children }: { href: string; q: string; tab?: string; position: number; children: ReactNode }) {
  return <Link href={href} onClick={() => sendSearchEvent({ kind: 'click', q, tab, url: href, position })}>{children}</Link>
}
