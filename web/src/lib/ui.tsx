import Link from 'next/link'
import { SearchBox } from './search-box'
import { NavLinks } from './nav'
import { ruDate, typo } from './markdown'
import type { Article, Developer, Media, Object as Obj } from '@/payload-types'
import { districtName, plural, priceText, regionName } from './geo'
import { ThemeToggle } from './client'
import * as LOGO from './logo-paths'

export const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://шахматка.москва'
/** Open Graph для страницы: openGraph страницы целиком заменяет layout-овый, поэтому повторяем общие поля и добавляем og:url */
export const ogFor = (url: string, title?: string, description?: string) => ({
  type: 'website' as const, url, title, description, siteName: 'Шахматка', locale: 'ru_RU',
  images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Шахматка — новостройки без рекламы и слухов' }],
})

export const STAGES: { value: string; label: string }[] = [
  { value: 'land', label: 'Участок' }, { value: 'concept', label: 'Концепция' }, { value: 'architecture', label: 'Архитектура' },
  { value: 'permit', label: 'Разрешение' }, { value: 'sales', label: 'Старт продаж' }, { value: 'completed', label: 'Ввод' },
]
export const TYPES: Record<string, string> = { object: 'Объект', developer: 'Застройщик', market: 'Рынок', regulation: 'Регулирование', architecture: 'Архитектура' }
export const devName = (n?: string | null) => (n || '').replace(/\s*\(.*\)$/, '')
export const stageLabel = (v?: string | null) => STAGES.find((s) => s.value === v)?.label

/**
 * Логотип «Огонёк»: «шахматка» Unbounded 500 в кривых, над правой стойкой «ш» — оранжевая точка.
 * Контуры генерирует scripts/brand-assets.mjs (npm run brand) в lib/logo-paths.ts.
 * Цвета из темы: буквы — --ink, точка — --orange.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg className={`mk${className ? ` ${className}` : ''}`} viewBox={LOGO.MARK_VIEWBOX} aria-hidden="true">
      <path className="mk-i" d={LOGO.MARK_D} /><circle className="mk-w" cx={LOGO.DOT.cx} cy={LOGO.DOT.cy} r={LOGO.DOT.r} />
    </svg>
  )
}

export function Wordmark() {
  return (
    <Link className="wm" href="/" aria-label="Шахматка, на главную">
      <svg viewBox={LOGO.WORD_VIEWBOX} aria-hidden="true">
        <path className="mk-i" d={LOGO.WORD_D} /><circle className="mk-w" cx={LOGO.DOT.cx} cy={LOGO.DOT.cy} r={LOGO.DOT.r} />
      </svg>
    </Link>
  )
}

export function StageStrip({ stage }: { stage?: string | null }) {
  const i = STAGES.findIndex((s) => s.value === stage)
  if (i < 0) return null
  return (
    <span className="strip" role="img" aria-label={`Стадия: ${STAGES[i].label}, ${i + 1} из 6`}>
      {STAGES.map((s, j) => <i key={s.value} className={j < i ? 'done' : j === i ? 'now' : ''} />)}
    </span>
  )
}

export function StageTrack({ stage }: { stage?: string | null }) {
  const i = STAGES.findIndex((s) => s.value === stage)
  if (i < 0) return null
  const pct = ((i + 0.5) / 6) * 100
  return (
    <div className="track" role="img" aria-label={`Стадия ${i + 1} из 6: ${STAGES[i].label}`}>
      <div className="bar"><i style={{ width: `${pct}%` }} /></div>
      <span className="mk" style={{ left: `${pct}%` }} />
      <div className="ends" aria-hidden="true"><span>Участок</span><span>Ввод</span></div>
    </div>
  )
}

const SearchIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></svg>

export function Header() {
  return (
    <header className="top">
      <div className="top-in wrap">
        <Wordmark />
        <NavLinks />
        <SearchBox />
        <div className="top-tools">
          <Link className="round only-m" href="/poisk/" aria-label="Поиск"><SearchIcon /></Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <div className="foot-brand">
          <Wordmark />
          <p>Независимое медиа о новостройках. В фокусе Москва, в охвате вся Россия.</p>
        </div>
        <div>
          <b>Разделы</b>
          <Link href="/">Лента</Link><Link href="/obekty/">Объекты</Link><Link href="/signaly/">Сигналы</Link><Link href="/novostroyki/">Новостройки по районам</Link><Link href="/krt/">Трекер КРТ</Link><Link href="/ceny-na-starte/">Цены на старте и сейчас</Link><Link href="/zastroyshchiki/">Застройщики</Link><Link href="/pro/">Шахматка Про</Link><Link href="/o-proekte/">О проекте</Link><Link href="/kabinet/">Вход для редакции</Link>
        </div>
        <div>
          <b>Принципы</b>
          <p>Не публикуем партнёрские материалы.</p><p>Каждая цифра проверена по источнику.</p><p>Не даём инвестиционных рекомендаций.</p><Link className="foot-more" href="/o-proekte/#principy">Редакционные принципы →</Link>
        </div>
      </div>
      <div className="wrap foot-legal">© 2026 Шахматка · шахматка.москва</div>
    </footer>
  )
}

/** Карточка материала для сеток */
export function ArticleCard({ a, size = 'm' }: { a: Article; size?: 'l' | 'm' | 's' }) {
  const img = a.heroImage as Media | undefined
  return (
    <Link className={`acard card acard-${size}`} href={`/novosti/${a.slug}/`}>
      {size !== 's' ? (img?.url
        ? <div className="ph"><img src={img.url} alt={img.alt} loading="lazy" /><span className="tag">{TYPES[a.type]}</span></div>
        : <div className="ph cover" aria-hidden="true"><span className="cover-t">{TYPES[a.type]}</span></div>) : null}
      <div className="tx">
        <div className="meta"><time dateTime={a.datePublished || undefined}>{ruDate(a.datePublished)}</time>{a.reviewStatus !== 'ready' ? <span className="dot-hold">на сверке</span> : null}</div>
        <h3>{typo(a.title)}</h3>
        {size === 'l' && a.lead ? <p>{typo(a.lead)}</p> : null}
      </div>
    </Link>
  )
}

/** Карточка объекта для каталога и подборок */
const MONTHS_SHORT = ['янв.', 'февр.', 'март', 'апр.', 'май', 'июнь', 'июль', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.']
/** Карточка объекта. Без фото — компактная текстовая: стена одинаковых заглушек в каталоге хуже, чем её отсутствие */
/** Уменьшенная копия для карточек и превью (если её ещё нет — исходник) */
export const cardImg = (m?: Media | number | null): Media | undefined =>
  m && typeof m === 'object' && m.url ? { ...m, url: m.sizes?.card?.url || m.url } : undefined

export function ObjectCard({ o, im: fallback }: { o: Obj & { cover?: Media }; im?: Media }) {
  const im = o.cover?.url ? o.cover : fallback
  const dev = o.developer as Developer | undefined
  const price = priceText(o)
  const where = o.region === 'moscow' ? (o.district ? districtName(o.district) : 'Москва') : regionName(o.region)
  const last = o.lastEventAt ? new Date(o.lastEventAt) : null
  return (
    <Link className={`ocard card${im?.url ? '' : ' noph'}`} href={`/obekty/${o.slug}/`}>
      {im?.url ? <div className="ph"><img src={im.url} alt={im.alt} loading="lazy" /></div> : null}
      <div className="tx">
        <div className="row"><StageStrip stage={o.stage} /><span className="st">{stageLabel(o.stage)}</span>{last ? <span className="st when">{MONTHS_SHORT[last.getUTCMonth()]} {last.getUTCFullYear()}</span> : null}</div>
        <h3>{o.name}</h3>
        <p>{[devName(dev?.name), where].filter(Boolean).join(' · ')}</p>
        {price || o.completion ? <p className="facts">{price ? <b>{price}</b> : null}{o.completion ? <span>ввод {o.completion}</span> : null}</p> : null}
        {o.signalCount ? <p className="sig">{o.signalCount} {plural(o.signalCount, 'сигнал', 'сигнала', 'сигналов')} до официальных новостей</p> : null}
      </div>
    </Link>
  )
}
