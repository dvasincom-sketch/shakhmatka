'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Select } from './select'

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
