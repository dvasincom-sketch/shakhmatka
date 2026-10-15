'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Select } from './select'

/** Вход по звонку: номер → «позвоните на 8 800…» → автоопределение номера (sms.ru) → вход */
export function CallLogin() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<{ callPhone: string; callPretty: string; phone: string; dev?: boolean } | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!step) return
    let stop = false
    const t0 = Date.now()
    const tick = async () => {
      if (stop) return
      const j = await fetch('/akkaunt/zvonok/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ check: true }) }).then((r) => r.json()).catch(() => ({ state: 'error' }))
      if (j.state === 'ok') { setMsg({ ok: true, text: 'Номер подтверждён — входим…' }); router.refresh(); return }
      if (j.state === 'expired' || Date.now() - t0 > 5 * 60_000) { setStep(null); setMsg({ ok: false, text: 'Время вышло. Запросите номер ещё раз.' }); return }
      setTimeout(tick, 3000)
    }
    const id = setTimeout(tick, 3000)
    return () => { stop = true; clearTimeout(id) }
  }, [step, router])
  if (step) return (
    <div className="acc-login card acc-call">
      <p className="acc-call-h">Позвоните с номера {step.phone} на</p>
      <a className="acc-call-num" href={`tel:+${step.callPhone}`}>{step.callPretty}</a>
      <p className="follow-legal">Звонок бесплатный и сразу сбросится — номер определится автоматически, и вы войдёте. Ждём звонка 5 минут.{step.dev ? ' (Разработка: вход подтвердится сам через несколько секунд.)' : ''}</p>
      <p className="acc-call-wait" aria-live="polite">{msg ? msg.text : 'Ждём звонок…'}</p>
      <button className="btn ghost" onClick={() => { setStep(null); setMsg(null) }}>Другой номер</button>
    </div>
  )
  return (
    <form className="acc-login card" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setMsg(null)
      const r = await fetch('/akkaunt/zvonok/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone }) }).finally(() => setBusy(false))
      const j = await r.json().catch(() => ({}))
      if (r.ok && j.callPhone) setStep(j); else setMsg({ ok: false, text: j.error || 'Не получилось, попробуйте ещё раз' })
    }}>
      <label htmlFor="acc-phone">Телефон</label>
      <div className="acc-row">
        <input id="acc-phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="+7 999 123-45-67" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button className="btn" disabled={busy}>{busy ? 'Секунду…' : 'Войти по звонку'}</button>
      </div>
      {msg ? <p className={msg.ok ? 'follow-ok' : 'follow-err'}>{msg.text}</p> : null}
      <p className="follow-legal">Без пароля и СМС: покажем номер 8 800, позвоните на него — звонок бесплатный, номер определится автоматически. Продолжая, вы соглашаетесь с <a href="/konfidentsialnost/">политикой конфиденциальности</a>.</p>
    </form>
  )
}

export function EmailLogin() {
  const [email, setEmail] = useState('')
  const [st, setSt] = useState<{ ok: boolean; text: string; link?: string } | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <form className="acc-login card" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true)
      const r = await fetch('/akkaunt/vkhod/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) }).finally(() => setBusy(false))
      const j = await r.json().catch(() => ({}))
      setSt(r.ok ? { ok: true, text: `Ссылка для входа отправлена на ${email}.`, link: j.devLink } : { ok: false, text: 'Проверьте адрес почты' })
    }}>
      <label htmlFor="acc-email">Почта</label>
      <div className="acc-row">
        <input id="acc-email" type="email" required autoComplete="email" placeholder="you@example.ru" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn" disabled={busy}>{busy ? 'Отправляем…' : 'Прислать ссылку'}</button>
      </div>
      {st ? <p className={st.ok ? 'follow-ok' : 'follow-err'}>{st.text}{st.link ? <> <a href={st.link}>Ссылка (только в разработке)</a></> : null}</p> : null}
      <p className="follow-legal">Без пароля: пришлём ссылку для входа. Продолжая, вы соглашаетесь с <a href="/konfidentsialnost/">политикой конфиденциальности</a>.</p>
    </form>
  )
}

const FREQ = [{ v: 'weekly', label: 'Раз в неделю' }, { v: 'daily', label: 'Каждый день' }, { v: 'off', label: 'Не присылать' }] as const
export function FrequencySelect({ value }: { value: 'weekly' | 'daily' | 'off' }) {
  const [v, setV] = useState(value)
  return <Select label="Рассылка" prefix="Письма:" value={v} options={FREQ} onChange={async (x) => { setV(x); await fetch('/akkaunt/nastroyki/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ frequency: x }) }) }} />
}

export function Unfollow({ kind, id }: { kind: string; id: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  return <button type="button" className="acc-x" disabled={busy} aria-label="Отписаться" title="Отписаться" onClick={async () => { setBusy(true); await fetch(`/akkaunt/sledit/?kind=${kind}&key=${encodeURIComponent(id)}`, { method: 'DELETE' }); router.refresh() }}>×</button>
}
