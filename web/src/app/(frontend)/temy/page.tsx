import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SITE, ogFor, cardImg, coverOf } from '@/lib/ui'
import { CrumbsLd } from '@/lib/jsonld'
import { TOPICS, topicLabel, topicSubject } from '@/lib/topics'
import { pub } from '@/lib/public'
import { typo } from '@/lib/markdown'
import type { Media } from '@/payload-types'
import { MOSCOW_DISTRICTS } from '@/lib/districts'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Темы: цены, ипотека, регулирование, архитектура, интерьер',
  description: 'Материалы Шахматки по темам: цены на новостройки, ипотека, законы, КРТ, архитектура Москвы, интерьер небольших квартир и сигналы рынка.',
  alternates: { canonical: `${SITE}/temy/` },
  openGraph: ogFor(`${SITE}/temy/`),
}

type Art = { title: string; slug: string; datePublished?: string | null; heroImage?: Media | number | null; topics?: { value?: string | null }[] | null }
type Topic = { key: string; arts: Art[]; img?: Media }

// служебные метки статей → человеческие названия: rayon-hamovniki → «Район Хамовники»
const EXTRA: Record<string, string> = { 'start-prodazh': 'Старт продаж', zhurnal: 'Журнал' }
const restLabel = (k: string) => {
  if (k.startsWith('rayon-')) { const d = MOSCOW_DISTRICTS[k.slice(6)]?.name; return d ? `Район ${d}` : `Район ${k.slice(6)}` }
  return EXTRA[k] || (k.charAt(0).toUpperCase() + k.slice(1)).replace(/-/g, ' ')
}
const plural = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'материал' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'материала' : 'материалов')

export default async function Topics() {
  const payload = await getPayload({ config })
  const arts = (await payload.find({
    collection: 'articles', where: pub(), limit: 100000, pagination: false, depth: 1, sort: '-datePublished',
    select: { title: true, slug: true, datePublished: true, heroImage: true, topics: true },
  })).docs as unknown as Art[]

  const byKey = new Map<string, Topic>()
  for (const a of arts) for (const t of a.topics || []) {
    if (!t.value) continue
    const tp = byKey.get(t.value) || (byKey.set(t.value, { key: t.value, arts: [] }), byKey.get(t.value)!)
    tp.arts.push(a)
    if (!tp.img) tp.img = cardImg(coverOf(a.heroImage))
  }
  // главные темы — из справочника тем; служебные (серии о районах и т. п.) — отдельным списком чипов
  const main = [...byKey.values()].filter((t) => TOPICS[t.key]).sort((a, b) => b.arts.length - a.arts.length)
  const rest = [...byKey.values()].filter((t) => !TOPICS[t.key]).sort((a, b) => b.arts.length - a.arts.length)

  return (
    <>
      <CrumbsLd items={[['Лента', '/'], ['Темы', '/temy/']]} />
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><span>Темы</span></nav>
      <h1 className="page-h tt">Темы<span>{main.length} разделов, {arts.length} {plural(arts.length)}</span></h1>
      <p className="hello-sub">От цен и ипотеки до архитектуры Москвы и интерьера небольших квартир: выберите тему — внутри все материалы по ней, от свежих к старым.</p>

      <nav className="chips topic-jump" aria-label="Быстрый переход">
        {main.map((t) => <Link key={t.key} className="chip" href={`/temy/${t.key}/`}>{topicLabel(t.key)}<i>{t.arts.length}</i></Link>)}
      </nav>

      <div className="topic-grid sec">
        {main.map((t, i) => (
          <Link key={t.key} href={`/temy/${t.key}/`} className={`tcard card${i < 2 ? ' tcard-l' : ''}`}>
            <div className="tcard-ph">
              {t.img?.url ? <img src={t.img.url} alt="" loading={i < 4 ? 'eager' : 'lazy'} /> : <span className="tcard-mono" aria-hidden="true">{topicLabel(t.key).slice(0, 1)}</span>}
              <span className="tag">{t.arts.length} {plural(t.arts.length)}</span>
            </div>
            <div className="tcard-tx">
              <h2>{topicLabel(t.key)}</h2>
              <p className="tcard-sub">{typo(topicSubject(t.key))}</p>
              <ul className="tcard-list">
                {t.arts.slice(0, 3).map((a) => <li key={a.slug}>{typo(a.title)}</li>)}
              </ul>
              <span className="tcard-more">Все материалы →</span>
            </div>
          </Link>
        ))}
      </div>

      {rest.length ? (
        <section className="sec">
          <div className="sec-h"><h2 className="tt">Ещё подборки<span>серии и метки</span></h2></div>
          <div className="hub card"><div className="chips wrap">
            {rest.map((t) => <Link key={t.key} className="chip" href={`/temy/${t.key}/`}>{restLabel(t.key)}<i>{t.arts.length}</i></Link>)}
          </div></div>
        </section>
      ) : null}
    </>
  )
}
