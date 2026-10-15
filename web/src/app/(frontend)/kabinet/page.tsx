import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getUser } from '@/lib/auth'
import { LoginForm, LogoutButton } from '@/lib/staff'
import { districtName } from '@/lib/geo'
import type { Object as Obj } from '@/payload-types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Кабинет редакции', robots: { index: false, follow: false } }

export default async function Cabinet() {
  const user = await getUser()
  if (!user) {
    return (
      <section className="cab">
        <h1 className="page-h tt">Кабинет<span>для редакции</span></h1>
        <p className="hello-sub">Вход для сотрудников «Шахматки»: тот же логин, что в админке. После входа на страницах досье появится загрузка фото.</p>
        <LoginForm />
      </section>
    )
  }
  const payload = await getPayload({ config })
  // досье без фото: с чего начать — самые насыщенные событиями
  const noPhoto = (await payload.find({
    collection: 'objects', where: { or: [{ gallery: { exists: false } }, { gallery: { equals: [] } }] }, sort: '-signalCount', limit: 40, depth: 0,
    select: { name: true, slug: true, district: true, region: true, signalCount: true, lastEventAt: true },
  })).docs as Obj[]
  // за чем следят читатели (кнопка «Следить»): pending — email оставили, но ещё не подтвердили
  const [readersAll, readersOk, fl] = await Promise.all([
    payload.count({ collection: 'readers', overrideAccess: true }),
    payload.count({ collection: 'readers', where: { confirmed: { equals: true } }, overrideAccess: true }),
    payload.find({ collection: 'follows', limit: 20000, depth: 0, pagination: false, overrideAccess: true, select: { kind: true, key: true, label: true, status: true } }),
  ])
  const top = new Map<string, { label: string; kind: string; key: string; n: number; ok: number }>()
  for (const f of fl.docs) { const k = `${f.kind}:${f.key}`; const t = top.get(k) || { label: f.label || f.key, kind: f.kind, key: f.key, n: 0, ok: 0 }; t.n++; if (f.status === 'active') t.ok++; top.set(k, t) }
  const topList = [...top.values()].sort((a, b) => b.n - a.n).slice(0, 25)
  const KIND_RU: Record<string, string> = { object: 'объект', developer: 'застройщик', place: 'район', bureau: 'бюро', signals: 'сигналы' }
  const HREF: Record<string, (k: string) => string> = { object: (k) => `/obekty/${k}/`, developer: (k) => `/zastroyshchiki/${k}/`, place: (k) => `/novostroyki/${k}/`, bureau: (k) => `/arhitektory/${k}/`, signals: () => '/signaly/' }
  return (
    <section className="cab">
      <h1 className="page-h tt">Кабинет<span>{user.name || user.email}</span></h1>
      <p className="hello-sub">{user.roleName}. На странице любого досье внизу — блок «Редакция · фото проекта»: загрузка, обложка, снять фото.</p>
      <div className="cab-actions"><Link className="btn" href="/admin/">Админка</Link><LogoutButton /></div>
      <h2 className="tt cab-h">За чем следят<span>{readersAll.totalDocs} читателей, подтвердили почту {readersOk.totalDocs}; подписок {fl.docs.length}</span></h2>
      {topList.length ? (
        <ol className="cab-list">
          {topList.map((t) => <li key={`${t.kind}:${t.key}`}><Link href={HREF[t.kind]?.(t.key) || '/'}>{t.label}</Link><span>{KIND_RU[t.kind] || t.kind} · {t.n} {t.ok < t.n ? `(подтвердили ${t.ok})` : ''}</span></li>)}
        </ol>
      ) : <p className="hello-sub">Пока никто не подписался. Кнопка «Следить» — на страницах объектов, застройщиков, районов, бюро и сигналов. Все подписки — в админке, раздел «Читатели».</p>}
      <h2 className="tt cab-h">Досье без фото<span>сначала — где больше сигналов</span></h2>
      <ol className="cab-list">
        {noPhoto.map((o) => (
          <li key={o.id}><Link href={`/obekty/${o.slug}/#foto`}>{o.name}</Link><span>{o.region === 'moscow' ? districtName(o.district) || 'Москва' : 'Подмосковье'}{o.signalCount ? ` · сигналов: ${o.signalCount}` : ''}</span></li>
        ))}
      </ol>
    </section>
  )
}
