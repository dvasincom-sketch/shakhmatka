import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { currentReader } from '@/lib/reader'
import { CallLogin, EmailLogin, FrequencySelect, Unfollow } from '@/lib/account-ui'
import { prettyPhone } from '@/lib/callcheck'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Личный кабинет', robots: { index: false, follow: false } }

const KIND: Record<string, [string, (k: string) => string]> = {
  object: ['Объекты', (k) => `/obekty/${k}/`],
  developer: ['Застройщики', (k) => `/zastroyshchiki/${k}/`],
  place: ['Районы', (k) => `/novostroyki/${k}/`],
  bureau: ['Архитектурные бюро', (k) => `/arhitektory/${k}/`],
  signals: ['Сигналы', () => '/signaly/'],
}

export default async function Account({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const r = await currentReader()
  const note = sp.podpiska ? 'Почта подтверждена — подписки работают.' : sp.otpiska ? 'Рассылка выключена. Подписки сохранены — включить письма можно здесь.' : sp.oshibka === 'ssylka' ? 'Ссылка устарела или уже использована. Пришлём новую.' : null
  if (!r) {
    return (
      <section className="acc">
        <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><span>Личный кабинет</span></nav>
        <h1 className="page-h tt">Личный кабинет<span>за чем вы следите</span></h1>
        {note ? <p className="acc-note">{note}</p> : null}
        <p className="hello-sub">Нажмите «Следить» на странице объекта, застройщика, района или архитектурного бюро — и мы пришлём письмо, когда там появятся новые события, сигналы или материалы. Здесь — все ваши подписки и настройки рассылки.</p>
        <CallLogin />
        <details className="acc-alt"><summary>Войти по почте</summary><EmailLogin /></details>
      </section>
    )
  }
  const payload = await getPayload({ config })
  const follows = (await payload.find({ collection: 'follows', where: { reader: { equals: r.id } }, limit: 500, depth: 0, sort: '-createdAt', overrideAccess: true })).docs
  const placeKeys = follows.filter((f) => f.kind === 'place').map((f) => f.key)
  const placeSlug = new Map(placeKeys.length ? (await payload.find({ collection: 'places', where: { key: { in: placeKeys } }, limit: 500, depth: 0 })).docs.map((p) => [p.key, p.slug] as const) : [])
  const groups = Object.keys(KIND).map((k) => ({ k, list: follows.filter((f) => f.kind === k) })).filter((g) => g.list.length)
  return (
    <section className="acc">
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><span>Личный кабинет</span></nav>
      <h1 className="page-h tt">Личный кабинет<span>{r.email || (r.phone ? prettyPhone(r.phone) : '')}</span></h1>
      {!r.email ? <p className="acc-note">Вы вошли по номеру телефона. Чтобы получать письма о новостях по подпискам, добавьте почту ниже — пришлём ссылку для подтверждения.</p> : null}
      {!r.email ? <EmailLogin /> : null}
      {note ? <p className="acc-note">{note}</p> : null}
      <div className="acc-bar">
        <FrequencySelect value={(r.frequency as 'weekly' | 'daily' | 'off') || 'weekly'} />
        <a className="btn ghost" href="/akkaunt/vyhod/">Выйти</a>
      </div>
      {groups.length ? groups.map((g) => (
        <section key={g.k} className="sec acc-sec">
          <div className="sec-h"><h2 className="tt">{KIND[g.k][0]}<span>{g.list.length}</span></h2></div>
          <ul className="acc-list">
            {g.list.map((f) => (
              <li key={f.id} className="card">
                <Link href={KIND[g.k][1](f.kind === 'place' ? placeSlug.get(f.key) || f.key : f.key)}>{f.label || f.key}</Link>
                {f.status === 'pending' ? <small>ждёт подтверждения почты</small> : null}
                <Unfollow kind={f.kind} id={f.key} />
              </li>
            ))}
          </ul>
        </section>
      )) : (
        <div className="empty card"><p>Пока вы ни за чем не следите. Откройте <Link href="/obekty/">объект</Link>, <Link href="/zastroyshchiki/">застройщика</Link> или <Link href="/novostroyki/">район</Link> и нажмите «Следить».</p></div>
      )}
      <p className="note">Письмо приходит, только когда есть новости по вашим подпискам. Отписаться от рассылки можно в любом письме — подписки при этом сохранятся.</p>
    </section>
  )
}
