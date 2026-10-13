'use client'
import type React from 'react'
import { useEffect, useState } from 'react'

/** Скрипт в <head>: ставит тему до отрисовки, чтобы не было вспышки. По умолчанию — светлая. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}`

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    // страховка: если скрипт в <head> не отработал (например, на 404), применяем сохранённую тему здесь
    let saved: string | null = null
    try { saved = localStorage.getItem('theme') } catch {}
    if (saved === 'dark' || saved === 'light') document.documentElement.setAttribute('data-theme', saved)
    setDark(document.documentElement.getAttribute('data-theme') === 'dark')
  }, [])
  const toggle = () => {
    const next = dark ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#111111' : '#FBFAF6')
    try { localStorage.setItem('theme', next) } catch {}
    setDark(!dark)
  }
  return (
    <button type="button" className="theme-btn" onClick={toggle} aria-label={dark ? 'Светлая тема' : 'Тёмная тема'} title={dark ? 'Светлая тема' : 'Тёмная тема'}>
      <svg className="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></svg>
      <svg className="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    </button>
  )
}

/** Полоса прогресса чтения + подсветка текущего раздела в оглавлении */
export function ReadingProgress() {
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>('.progress')
    const body = document.querySelector<HTMLElement>('.art-main')
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.toc a'))
    const heads = links.map((l) => document.getElementById(decodeURIComponent(l.hash.slice(1)))).filter(Boolean) as HTMLElement[]
    let raf = 0
    const tick = () => {
      raf = 0
      if (bar && body) {
        const r = body.getBoundingClientRect()
        const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)))
        bar.style.transform = `scaleX(${p})`
      }
      let cur = -1
      heads.forEach((h, i) => { if (h.getBoundingClientRect().top < 140) cur = i })
      links.forEach((l, i) => l.classList.toggle('on', i === cur))
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(tick) }
    tick()
    addEventListener('scroll', on, { passive: true }); addEventListener('resize', on)
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf) }
  }, [])
  return <div className="progress" aria-hidden="true" />
}

export function Share({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState<'' | 'ok' | 'err'>('')
  const u = encodeURIComponent(url), t = encodeURIComponent(title)
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied('ok') } catch { setCopied('err') }
    setTimeout(() => setCopied(''), 2000)
  }
  return (
    <div className="share">
      <span className="lbl">Поделиться</span>
      <button type="button" onClick={copy}>{copied === 'ok' ? 'Ссылка скопирована' : copied === 'err' ? 'Не удалось скопировать' : 'Копировать ссылку'}</button>
      <a href={`https://t.me/share/url?url=${u}&text=${t}`} target="_blank" rel="noopener">Telegram</a>
      <a href={`https://vk.com/share.php?url=${u}&title=${t}`} target="_blank" rel="noopener">ВКонтакте</a>
      <a href={`https://wa.me/?text=${t}%20${u}`} target="_blank" rel="noopener">WhatsApp</a>
    </div>
  )
}

export function ToTop() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const f = () => setOn(scrollY > innerHeight * 1.5)
    f(); addEventListener('scroll', f, { passive: true })
    return () => removeEventListener('scroll', f)
  }, [])
  return (
    <button type="button" className={`to-top${on ? ' on' : ''}`} aria-label="Наверх" tabIndex={on ? 0 : -1} onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
    </button>
  )
}

/** На телефоне прячет второстепенные фильтры под кнопку, на десктопе они всегда открыты (через CSS) */
export function FilterToggle({ active, children }: { active: number; children: React.ReactNode }) {
  // если что-то уже выбрано — показываем панель сразу, чтобы было видно, что именно
  const [open, setOpen] = useState(active > 0)
  return (
    <>
      <button type="button" className="f-toggle" aria-expanded={open} aria-controls="f-more" onClick={() => setOpen(!open)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
        Район, цена, класс{active ? <b>{active}</b> : null}
      </button>
      <div id="f-more" className={`f-more${open ? ' open' : ''}`}>{children}</div>
    </>
  )
}
