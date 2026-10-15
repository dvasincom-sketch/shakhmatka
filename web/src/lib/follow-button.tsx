'use client'
import { useEffect, useRef, useState } from 'react'

type Kind = 'object' | 'developer' | 'place' | 'bureau' | 'signals'
type State = { loggedIn: boolean; following: boolean; email?: string } | null

/**
 * «Следить»: подписка на объект, застройщика, район, бюро или все сигналы.
 * Вошедший читатель подписывается в один клик; гость оставляет email и подтверждает подписку по ссылке из письма.
 */
export function FollowButton({ kind, id, label, hint }: { kind: Kind; id: string; label: string; hint?: string }) {
  const [st, setSt] = useState<State>(null)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string; link?: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const q = `kind=${kind}&key=${encodeURIComponent(id)}`

  useEffect(() => { fetch(`/akkaunt/sledit/?${q}`, { cache: 'no-store' }).then((r) => r.json()).then(setSt).catch(() => setSt({ loggedIn: false, following: false })) }, [q])
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  async function follow(withEmail?: string) {
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/akkaunt/sledit/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind, key: id, label, page: location.pathname, email: withEmail }) })
      const j = await r.json()
      if (!r.ok) setMsg({ ok: false, text: j.error === 'email' ? 'Проверьте адрес почты' : j.error === 'rate' ? 'Слишком много писем — попробуйте через час' : 'Не получилось, попробуйте ещё раз' })
      else if (j.pending) setMsg({ ok: true, text: `Письмо отправлено на ${withEmail}. Подтвердите адрес — и подписка заработает.`, link: j.devLink })
      else { setSt((s) => ({ ...(s || { loggedIn: true }), following: true })); setOpen(false) }
    } finally { setBusy(false) }
  }
  async function unfollow() {
    setBusy(true)
    await fetch(`/akkaunt/sledit/?${q}`, { method: 'DELETE' }).finally(() => setBusy(false))
    setSt((s) => ({ ...(s || { loggedIn: true }), following: false }))
  }

  const following = !!st?.following
  return (
    <div className={`follow${open ? ' open' : ''}`} ref={root}>
      <button
        type="button" className={`follow-btn${following ? ' on' : ''}`} disabled={busy || st === null} aria-pressed={following}
        onClick={() => (following ? unfollow() : st?.loggedIn ? follow() : setOpen(!open))}
        title={following ? 'Вы следите — нажмите, чтобы отписаться' : hint || 'Присылать новости по почте'}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">{following
          ? <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M8 2.5a3.5 3.5 0 0 0-3.5 3.5v2.3L3 10.5h10l-1.5-2.2V6A3.5 3.5 0 0 0 8 2.5Zm-1.6 9.5a1.7 1.7 0 0 0 3.2 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />}</svg>
        <span>{following ? 'Вы следите' : 'Следить'}</span>
      </button>
      {open && !following ? (
        <form className="follow-pop card" onSubmit={(e) => { e.preventDefault(); void follow(email) }}>
          <p className="follow-h">Следить: {label}</p>
          <p className="follow-sub">{hint || 'Пришлём письмо, когда появятся новые события, сигналы или материалы.'} Раз в неделю, без рекламы.</p>
          {msg?.ok ? (
            <p className="follow-ok">{msg.text}{msg.link ? <> <a href={msg.link}>Ссылка (только в разработке)</a></> : null}</p>
          ) : (
            <>
              <input type="email" required autoComplete="email" placeholder="Ваша почта" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Почта" />
              <button type="submit" className="btn" disabled={busy}>{busy ? 'Отправляем…' : 'Следить'}</button>
              {msg ? <p className="follow-err">{msg.text}</p> : null}
              <p className="follow-legal">Нажимая «Следить», вы соглашаетесь получать письма «Шахматки» и с <a href="/konfidentsialnost/">политикой конфиденциальности</a>. Отписаться — в один клик из любого письма.</p>
            </>
          )}
        </form>
      ) : null}
    </div>
  )
}
