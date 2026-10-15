'use client'
import { useState } from 'react'
import { Select } from './select'

const ROLES = [
  { v: 'private', label: 'Частный инвестор' }, { v: 'developer', label: 'Застройщик / девелопер' }, { v: 'broker', label: 'Брокер / консультант' }, { v: 'investor', label: 'Банк / фонд / инвестор' },
  { v: 'architect', label: 'Архитектурное бюро' }, { v: 'owner', label: 'Собственник земли' }, { v: 'other', label: 'Другое' },
] as const
const PRODUCTS = [['invest', 'Инвестиционная подборка'], ['pro', 'Шахматка Про'], ['land', 'Подборка площадок'], ['data', 'Выгрузка данных / API']] as const

export function ProForm({ initial = 'land' }: { initial?: string }) {
  const [role, setRole] = useState<(typeof ROLES)[number]['v']>(initial === 'invest' ? 'private' : 'developer')
  const [prod, setProd] = useState<string[]>([initial])
  const [st, setSt] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle')
  return st === 'ok' ? (
    <div className="pro-form card"><p className="pro-ok">Заявка отправлена. Мы свяжемся с вами в течение рабочего дня и пришлём пример подборки под ваш запрос.</p></div>
  ) : (
    <form className="pro-form card" onSubmit={async (e) => {
      e.preventDefault(); setSt('busy')
      const f = new FormData(e.currentTarget)
      const body = { ...Object.fromEntries(f.entries()), role, product: prod, page: location.pathname }
      const r = await fetch('/pro/zayavka/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null)
      setSt(r?.ok ? 'ok' : 'err')
    }}>
      <div className="pro-grid2">
        <label>Имя<input name="name" required autoComplete="name" /></label>
        <label>Компания<input name="company" autoComplete="organization" /></label>
        <label>Почта<input name="email" type="email" required autoComplete="email" /></label>
        <label>Телефон или Telegram<input name="phone" autoComplete="tel" /></label>
      </div>
      <div className="pro-row"><span className="f-k">Кто вы</span><Select label="Кто вы" value={role} options={ROLES} onChange={setRole} /></div>
      <div className="pro-row"><span className="f-k">Что интересует</span>
        <div className="chips">{PRODUCTS.map(([v, l]) => <button type="button" key={v} className={`chip${prod.includes(v) ? ' on' : ''}`} aria-pressed={prod.includes(v)} onClick={() => setProd((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v])}>{l}</button>)}</div>
      </div>
      <label>Запрос<textarea name="request" rows={4} placeholder="Например: участки под жильё до 30 тыс. м² в ЮВАО и ВАО, бюджет до 1,5 млрд ₽, старт в 2027 году" /></label>
      <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
      <button className="btn" disabled={st === 'busy'}>{st === 'busy' ? 'Отправляем…' : 'Оставить заявку'}</button>
      {st === 'err' ? <p className="follow-err">Не получилось отправить — попробуйте ещё раз.</p> : null}
      <p className="follow-legal">Отправляя заявку, вы соглашаетесь с <a href="/konfidentsialnost/">политикой конфиденциальности</a>. Мы используем контакты только чтобы ответить на запрос.</p>
    </form>
  )
}
