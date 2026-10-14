'use client'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

/** Вход редакции: тот же аккаунт, что в админке; cookie ставит Payload */
export function LoginForm() {
  const router = useRouter()
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true); setErr('')
    const f = new FormData(e.currentTarget)
    const r = await fetch('/api/users/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: f.get('email'), password: f.get('password') }) })
    setBusy(false)
    if (r.ok) router.refresh()
    else setErr(r.status === 401 ? 'Неверная почта или пароль' : 'Не получилось войти, попробуйте ещё раз')
  }
  return (
    <form className="login card" onSubmit={submit}>
      <label>Почта<input name="email" type="email" autoComplete="username" required /></label>
      <label>Пароль<input name="password" type="password" autoComplete="current-password" required /></label>
      {err ? <p className="err" role="alert">{err}</p> : null}
      <button className="btn" disabled={busy}>{busy ? 'Входим…' : 'Войти'}</button>
    </form>
  )
}

export function LogoutButton() {
  const router = useRouter()
  return <button className="btn ghost" onClick={async () => { await fetch('/api/users/logout', { method: 'POST', credentials: 'include' }); router.refresh() }}>Выйти</button>
}

type Item = { id: number | string; url: string; alt: string; caption?: string | null }

/** Фото досье для редакции: загрузка, обложка (первое фото), снять из галереи */
export function GalleryEditor({ objectId, objectName, items }: { objectId: number | string; objectName: string; items: Item[] }) {
  const router = useRouter()
  const [list, setList] = useState(items)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const form = useRef<HTMLFormElement>(null)

  async function save(ids: (number | string)[]) {
    const r = await fetch(`/api/objects/${objectId}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gallery: ids }) })
    if (!r.ok) throw new Error(`не сохранилось (${r.status})`)
  }

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const files = f.getAll('file').filter((x): x is File => x instanceof File && x.size > 0)
    if (!files.length) return
    setBusy(true); setMsg('')
    try {
      const added: Item[] = []
      for (const [k, file] of files.entries()) {
        const body = new FormData()
        body.append('file', file)
        body.append('_payload', JSON.stringify({
          alt: (String(f.get('alt') || '') || `${objectName}: фото проекта`).slice(0, 120) + (files.length > 1 ? ` (${k + 1})` : ''),
          caption: f.get('caption') || undefined,
          credit: f.get('credit') || undefined,
        }))
        const r = await fetch('/api/media', { method: 'POST', credentials: 'include', body })
        if (!r.ok) throw new Error(`файл ${file.name} не загрузился (${r.status})`)
        const { doc } = await r.json()
        added.push({ id: doc.id, url: doc.url, alt: doc.alt, caption: doc.caption })
      }
      const next = [...list, ...added]
      await save(next.map((x) => x.id))
      setList(next); form.current?.reset(); setMsg(`Добавлено фото: ${added.length}`)
      router.refresh()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally { setBusy(false) }
  }

  async function reorder(next: Item[], note: string) {
    setBusy(true); setMsg('')
    try { await save(next.map((x) => x.id)); setList(next); setMsg(note); router.refresh() }
    catch (err) { setMsg(err instanceof Error ? err.message : 'Ошибка') } finally { setBusy(false) }
  }

  return (
    <section className="staff card" aria-label="Фото проекта: редакция">
      <p className="side-k">Редакция · фото проекта</p>
      {list.length ? (
        <ul className="staff-gal">
          {list.map((m, i) => (
            <li key={m.id}>
              <img src={m.url} alt={m.alt} loading="lazy" />
              <div>
                {i === 0 ? <b>Обложка</b> : <button type="button" disabled={busy} onClick={() => reorder([m, ...list.filter((x) => x.id !== m.id)], 'Обложка обновлена')}>Сделать обложкой</button>}
                <button type="button" disabled={busy} onClick={() => reorder(list.filter((x) => x.id !== m.id), 'Фото снято с досье')}>Убрать</button>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="note">У досье пока нет фото.</p>}
      <form ref={form} className="staff-up" onSubmit={upload}>
        <label>Фото<input name="file" type="file" accept="image/*" multiple required /></label>
        <label>Что на фото (alt)<input name="alt" maxLength={110} placeholder="Визуализация башен со стороны набережной" /></label>
        <label>Подпись<input name="caption" placeholder="Визуализация: застройщик" /></label>
        <label>Источник / права<input name="credit" placeholder="пресс-служба застройщика" /></label>
        <button className="btn" disabled={busy}>{busy ? 'Загружаем…' : 'Загрузить'}</button>
      </form>
      {msg ? <p className="note" role="status">{msg}</p> : null}
    </section>
  )
}
