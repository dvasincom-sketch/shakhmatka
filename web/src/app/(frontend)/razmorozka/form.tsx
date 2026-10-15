'use client'
import { useState } from 'react'

const WHO = [
  { v: 'student', label: 'Студент или выпускник архшколы', role: 'other' },
  { v: 'bureau', label: 'Молодое бюро или фрилансер', role: 'architect' },
  { v: 'school', label: 'Архшкола — хотим стать партнёром', role: 'other' },
  { v: 'jury', label: 'Практикующий архитектор — готов в жюри', role: 'architect' },
  { v: 'owner', label: 'Девелопер или собственник участка', role: 'owner' },
] as const

/** Лист ожидания конкурса: заявка уходит в «Заявки» (как с /pro/) с пометкой «Разморозка» */
export function RazmorozkaForm() {
  const [who, setWho] = useState<(typeof WHO)[number]['v']>('student')
  const [st, setSt] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle')
  return (
    <form className="rz-form card" onSubmit={async (e) => {
      e.preventDefault(); setSt('busy')
      const f = new FormData(e.currentTarget)
      const w = WHO.find((x) => x.v === who)!
      const body = { name: f.get('name'), email: f.get('email'), company: f.get('company'), role: w.role, product: [], page: '/razmorozka/', request: `Разморозка: ${w.label}. ${String(f.get('request') || '')}`, website: f.get('website') }
      const r = await fetch('/pro/zayavka/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null)
      setSt(r?.ok ? 'ok' : 'err')
    }}>
      {st === 'ok' ? <p className="follow-ok">Спасибо! Напишем, когда опубликуем правила и площадки.</p> : (
        <>
          <fieldset className="rz-who"><legend className="f-k">Кто вы</legend>
            {WHO.map((x) => <label key={x.v}><input type="radio" name="who" checked={who === x.v} onChange={() => setWho(x.v)} />{x.label}</label>)}
          </fieldset>
          <div className="rz-row">
            <label>Имя<input name="name" required maxLength={120} /></label>
            <label>Почта<input name="email" type="email" required maxLength={200} /></label>
          </div>
          <label>Школа, бюро или компания<input name="company" maxLength={200} /></label>
          <label>Комментарий<textarea name="request" rows={3} maxLength={2000} placeholder="Например: какая площадка интересна, опыт, вопросы" /></label>
          <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
          <button className="btn" disabled={st === 'busy'}>{st === 'busy' ? 'Отправляем…' : 'Хочу участвовать'}</button>
          {st === 'err' ? <p className="follow-err">Не получилось отправить. Попробуйте ещё раз.</p> : null}
          <p className="follow-legal">Отправляя форму, вы соглашаетесь с <a href="/konfidentsialnost/">политикой конфиденциальности</a>.</p>
        </>
      )}
    </form>
  )
}
