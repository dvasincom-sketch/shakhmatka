import { CrumbsLd } from '@/lib/jsonld'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ObjectCard, SITE, STAGES, ogFor, coverOf } from '@/lib/ui'
import { CLASS_LABELS, districtName, plural } from '@/lib/geo'
import { FilterToggle } from '@/lib/client'
import type { Media, Object as Obj } from '@/payload-types'
import { pub } from '@/lib/public'
import { getAllObjects } from '@/lib/landings'

// Страницы собираются на запрос: в Docker-сборке нет доступа к базе, а данные должны быть свежими
export const dynamic = 'force-dynamic'

type SP = { stage?: string; geo?: string; district?: string; price?: string; class?: string; sort?: string; page?: string }
const KEYS: (keyof SP)[] = ['stage', 'geo', 'district', 'price', 'class', 'sort', 'page']
const PER_PAGE = 48
const TOP_DISTRICTS = 16

const PRICES = [
  { v: 'lt15', label: 'до 15 млн', test: (p: number) => p < 15 },
  { v: '15-25', label: '15–25 млн', test: (p: number) => p >= 15 && p <= 25 },
  { v: 'gt25', label: 'от 25 млн', test: (p: number) => p > 25 },
]
const SORTS = [
  { v: '', label: 'Свежие события' },
  { v: 'name', label: 'По названию' },
  { v: 'price', label: 'Сначала дешевле' },
  { v: 'stage', label: 'Ближе к вводу' },
]

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams
  const filtered = KEYS.some((k) => k !== 'page' && sp[k])
  return {
    title: 'Объекты: новостройки Москвы и регионов',
    description: 'Каталог новостроек с фильтрами по стадии, району, цене и классу. Адрес участка, все названия проекта, застройщик и проверенные материалы.',
    alternates: { canonical: `${SITE}/obekty/${!filtered && Number(sp.page) > 1 ? `?page=${sp.page}` : ''}` },
    openGraph: ogFor(`${SITE}/obekty/${!filtered && Number(sp.page) > 1 ? `?page=${sp.page}` : ''}`),
    // комбинации фильтров не индексируем, чтобы не плодить дубли; посадочные страницы районов сделаем отдельно
    robots: filtered ? { index: false, follow: true } : undefined,
  }
}

export default async function Objects({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const payload = await getPayload({ config })
  const all = await getAllObjects()
  const arts = (await payload.find({ collection: 'articles', where: pub({ heroImage: { exists: true } }), limit: 2000, depth: 1, select: { objects: true, heroImage: true } })).docs
  const places = (await payload.find({ collection: 'places', limit: 1000, pagination: false })).docs
  const landing = sp.district ? places.find((p) => p.key === sp.district) : sp.geo === 'moscow' && !sp.district ? places.find((p) => p.key === 'moscow') : undefined
  const img = (id: number | string) => coverOf(arts.find((a) => (a.objects || []).some((o) => (typeof o === 'object' ? o.id : o) === id) && coverOf(a.heroImage))?.heroImage)

  const href = (patch: Partial<SP>) => {
    const q = new URLSearchParams()
    const next = { ...sp, ...patch }
    if (patch.geo !== undefined && patch.geo !== sp.geo) next.district = undefined
    if (!('page' in patch)) next.page = undefined
    KEYS.forEach((k) => { if (next[k]) q.set(k, next[k] as string) })
    const s = q.toString()
    return `/obekty/${s ? `?${s}` : ''}`
  }
  const toggle = (k: keyof SP, v: string) => href({ [k]: sp[k] === v ? undefined : v })

  // каждый фильтр, кроме указанного: для честных счётчиков на чипах
  const pass = (o: Obj, skip?: keyof SP) =>
    (skip === 'stage' || !sp.stage || o.stage === sp.stage) &&
    (skip === 'geo' || !sp.geo || (sp.geo === 'moscow' ? o.region === 'moscow' : o.region !== 'moscow')) &&
    (skip === 'district' || !sp.district || o.district === sp.district) &&
    (skip === 'price' || !sp.price || (o.priceFrom != null && !!PRICES.find((p) => p.v === sp.price)?.test(o.priceFrom))) &&
    (skip === 'class' || !sp.class || o.class === sp.class)
  const count = (k: keyof SP, test: (o: Obj) => boolean) => all.filter((o) => pass(o, k) && test(o)).length

  const objs = all.filter((o) => pass(o))
  const si = (o: Obj) => STAGES.findIndex((s) => s.value === o.stage)
  if (sp.sort === 'price') objs.sort((a, b) => (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity))
  if (sp.sort === 'stage') objs.sort((a, b) => si(b) - si(a))
  if (sp.sort === 'name') objs.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  const pages = Math.max(1, Math.ceil(objs.length / PER_PAGE))
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1))
  const shown = objs.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // районов десятки: показываем самые наполненные, остальные — в указателе /novostroyki/
  const dCount = new Map<string, number>()
  all.filter((o) => (sp.geo ? pass(o, 'district') : o.region === 'moscow') && o.district).forEach((o) => dCount.set(o.district!, (dCount.get(o.district!) || 0) + 1))
  const districts = [...dCount.entries()].sort((a, b) => b[1] - a[1]).map(([d]) => d).filter((d, i) => i < TOP_DISTRICTS || d === sp.district)
  const classes = [...new Set(all.map((o) => o.class).filter(Boolean) as string[])]
  const secondary = ['district', 'price', 'class', 'geo'].filter((k) => sp[k as keyof SP]).length
  const anyFilter = KEYS.some((k) => k !== 'sort' && sp[k])

  const Chip = ({ k, v, label, n }: { k: keyof SP; v: string; label: string; n?: number }) => {
    const on = sp[k] === v
    if (n === 0 && !on) return <span className="chip off" aria-disabled="true">{label}<i>0</i></span>
    return <Link className={`chip${on ? ' on' : ''}`} href={toggle(k, v)} aria-current={on ? 'true' : undefined} scroll={false}>{label}{n != null ? <i>{n}</i> : null}</Link>
  }

  return (
    <>
      <CrumbsLd items={[['Лента', '/'], ['Объекты', '/obekty/']]} />
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><span>Объекты</span></nav>
      <h1 className="page-h tt">Объекты<span>по адресу участка</span></h1>
      <p className="hello-sub">Объект в базе Шахматки записан по адресу земельного участка: так его можно проследить от покупки земли до ключей, даже если проект менял название и застройщика.</p>

      <div className="cat">
        <section className="filters card" aria-label="Фильтры">
          <div className="f-group">
            <p className="f-k">Стадия</p>
            <div className="chips">
              <Link className={`chip${!sp.stage ? ' on' : ''}`} href={href({ stage: undefined })} scroll={false}>Все<i>{count('stage', () => true)}</i></Link>
              {STAGES.map((s) => <Chip key={s.value} k="stage" v={s.value} label={s.label} n={count('stage', (o) => o.stage === s.value)} />)}
            </div>
          </div>
          <FilterToggle active={secondary}>
            <div className="f-group">
              <p className="f-k">Где</p>
              <div className="chips">
                <Chip k="geo" v="moscow" label="Москва" n={count('geo', (o) => o.region === 'moscow')} />
                <Chip k="geo" v="regions" label="Регионы" n={count('geo', (o) => o.region !== 'moscow')} />
              </div>
              {districts.length ? (
                <div className="chips sub">{districts.map((d) => <Chip key={d} k="district" v={d} label={districtName(d)} n={count('district', (o) => o.district === d)} />)}{dCount.size > districts.length ? <Link className="chip more" href="/novostroyki/">Все районы<i>{dCount.size}</i></Link> : null}</div>
              ) : null}
            </div>
            <div className="f-group">
              <p className="f-k">Цена квартиры</p>
              <div className="chips">{PRICES.map((p) => <Chip key={p.v} k="price" v={p.v} label={p.label} n={count('price', (o) => o.priceFrom != null && p.test(o.priceFrom))} />)}</div>
            </div>
            {classes.length ? (
              <div className="f-group">
                <p className="f-k">Класс</p>
                <div className="chips">{classes.map((c) => <Chip key={c} k="class" v={c} label={CLASS_LABELS[c] || c} n={count('class', (o) => o.class === c)} />)}</div>
              </div>
            ) : null}
          </FilterToggle>
        </section>

        <div className="cat-main">
          <div className="cat-bar">
            <p className="found" aria-live="polite">{objs.length ? `${objs.length} ${plural(objs.length, 'объект', 'объекта', 'объектов')}` : 'Ничего не нашлось'}{anyFilter ? <Link href={href({ stage: undefined, geo: undefined, district: undefined, price: undefined, class: undefined })} scroll={false}>Сбросить</Link> : null}</p>
            <nav className="sorts" aria-label="Сортировка">{SORTS.map((s) => <Link key={s.v} className={(sp.sort || '') === s.v ? 'on' : ''} href={href({ sort: s.v || undefined })} scroll={false}>{s.label}</Link>)}</nav>
          </div>

          {objs.length ? (
            <div className="obj-grid">
              {shown.map((o) => <ObjectCard key={o.id} o={o} im={img(o.id)} />)}
            </div>
          ) : (
            <div className="empty card">
              <p>Под такие условия объектов пока нет. База пополняется: каждый новый материал добавляет объекты.</p>
              <Link className="btn ghost" href="/obekty/">Показать все объекты</Link>
            </div>
          )}
          {pages > 1 ? (
            <nav className="pager" aria-label="Страницы">
              {page > 1 ? <Link href={href({ page: page === 2 ? undefined : String(page - 1) })} rel="prev">← Назад</Link> : <span />}
              <span className="pg">{page} из {pages}</span>
              {page < pages ? <Link href={href({ page: String(page + 1) })} rel="next">Дальше →</Link> : <span />}
            </nav>
          ) : null}
          {landing ? <Link className="land-cta card" href={`/novostroyki/${landing.slug}/`}><span>Новостройки {landing.nameIn}</span><small>цены, сроки сдачи и материалы — на одной странице</small></Link> : null}
          <p className="note cat-note"><Link href="/novostroyki/">Новостройки по районам, классам и стадиям</Link>. Цена — минимальная из открытых источников на дату, указанную в досье объекта, и может учитывать скидки застройщика. Это не оферта: актуальную цену уточняйте у застройщика.</p>
        </div>
      </div>
    </>
  )
}
