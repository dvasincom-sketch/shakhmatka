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
  return (
    <section className="cab">
      <h1 className="page-h tt">Кабинет<span>{user.name || user.email}</span></h1>
      <p className="hello-sub">{user.roleName}. На странице любого досье внизу — блок «Редакция · фото проекта»: загрузка, обложка, снять фото.</p>
      <div className="cab-actions"><Link className="btn" href="/admin/">Админка</Link><LogoutButton /></div>
      <h2 className="tt cab-h">Досье без фото<span>сначала — где больше сигналов</span></h2>
      <ol className="cab-list">
        {noPhoto.map((o) => (
          <li key={o.id}><Link href={`/obekty/${o.slug}/#foto`}>{o.name}</Link><span>{o.region === 'moscow' ? districtName(o.district) || 'Москва' : 'Подмосковье'}{o.signalCount ? ` · сигналов: ${o.signalCount}` : ''}</span></li>
        ))}
      </ol>
    </section>
  )
}
