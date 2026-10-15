import { CrumbsLd } from '@/lib/jsonld'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SITE, ogFor } from '@/lib/ui'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Словарь покупателя новостройки: ДДУ, эскроу, КРТ',
  description: 'Простые определения терминов рынка новостроек со ссылками на законы и официальные источники.',
  alternates: { canonical: `${SITE}/slovar/` },
    openGraph: ogFor(`${SITE}/slovar/`),
}

export default async function Glossary() {
  const payload = await getPayload({ config })
  const terms = (await payload.find({ collection: 'terms', where: { published: { equals: true } }, sort: 'term', limit: 1000, pagination: false })).docs
  const groups = new Map<string, typeof terms>()
  terms.forEach((t) => { const k = t.term.charAt(0).toUpperCase(); groups.set(k, [...(groups.get(k) || []), t]) })
  return (
    <>
      <CrumbsLd items={[['Лента', '/'], ['Словарь', '/slovar/']]} />
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><span>Словарь</span></nav>
      <h1 className="page-h tt">Словарь<span>покупателя новостройки</span></h1>
      {terms.length ? (
        <div className="gloss">
          {[...groups.entries()].map(([k, list]) => (
            <section key={k} className="gloss-g"><h2 className="gloss-l">{k}</h2>
              {list.map((t) => <Link key={t.id} className="gloss-i card" href={`/slovar/${t.slug}/`}><b>{t.term}</b>{t.full ? <span>{t.full}</span> : null}<p>{t.short}</p></Link>)}
            </section>
          ))}
        </div>
      ) : <p className="hello-sub">Словарь готовится: определения проходят редакционную проверку.</p>}
    </>
  )
}
