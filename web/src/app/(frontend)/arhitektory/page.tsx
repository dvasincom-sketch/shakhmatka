import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE, ogFor } from '@/lib/ui'
import { plural } from '@/lib/geo'
import { BUREAUS } from '@/lib/architects'
import { JsonLd } from '@/lib/jsonld'

export const metadata: Metadata = {
  title: 'Архитектурные бюро новостроек Москвы',
  description: 'Какие архитектурные бюро проектируют новостройки Москвы: APEX, Kleinewelt, WALL, KAMEN, GAFA и ещё полторы сотни бюро — их проекты, концепции и победы в конкурсах по досье Шахматки.',
  alternates: { canonical: `${SITE}/arhitektory/` },
  openGraph: ogFor(`${SITE}/arhitektory/`),
}

const KIND_H: Record<string, [string, string]> = {
  architecture: ['Архитектура', 'бюро и мастерские — авторы проектов'],
  landscape: ['Ландшафт', 'благоустройство, дворы и парки'],
  interior: ['Интерьеры', 'лобби и общие пространства'],
}

export default function Architects() {
  const groups = (['architecture', 'landscape', 'interior'] as const).map((k) => ({ k, list: BUREAUS.filter((b) => b.kind === k) })).filter((g) => g.list.length)
  const top = BUREAUS.filter((b) => b.kind === 'architecture').slice(0, 12)
  const total = new Set(BUREAUS.flatMap((b) => b.objects.map((o) => o.slug))).size
  const ld = {
    '@type': 'CollectionPage', name: 'Архитектурные бюро', url: `${SITE}/arhitektory/`, inLanguage: 'ru',
    mainEntity: { '@type': 'ItemList', numberOfItems: BUREAUS.length, itemListElement: top.map((b, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Organization', name: b.name, url: `${SITE}/arhitektory/${b.key}/` } })) },
  }
  return (
    <>
      <JsonLd data={ld} />
      <nav className="crumbs" aria-label="Путь"><Link href="/">Лента</Link><span>/</span><span>Архитекторы</span></nav>
      <h1 className="page-h tt">Архитектурные бюро<span>кто рисует новую Москву</span></h1>
      <p className="hello-sub">Бюро и мастерские, которые упоминаются в досье проектов и статьях Шахматки: чьи концепции согласовали, кто выиграл конкурс, кого заменили по ходу проекта.</p>

      <dl className="land-stats dev-stats">
        <div className="card"><dt>Бюро</dt><dd>{BUREAUS.length}</dd><small>архитектура, ландшафт, интерьеры</small></div>
        <div className="card"><dt>Проектов</dt><dd>{total}</dd><small>с известным архитектором</small></div>
        <div className="card"><dt>Самое частое</dt><dd>{top[0]?.name}</dd><small>{top[0] ? `${top[0].objects.length} ${plural(top[0].objects.length, 'проект', 'проекта', 'проектов')} в досье` : ''}</small></div>
      </dl>

      {groups.map((g) => (
        <section key={g.k} className="sec" aria-labelledby={`h-${g.k}`}>
          <div className="sec-h"><h2 id={`h-${g.k}`} className="tt">{KIND_H[g.k][0]}<span>{KIND_H[g.k][1]}</span></h2></div>
          <ul className="arch-list">
            {g.list.map((b) => (
              <li key={b.key}>
                <Link className="arch-card card" href={`/arhitektory/${b.key}/`}>
                  <b>{b.name}</b>
                  <span className="n">{b.objects.length ? `${b.objects.length} ${plural(b.objects.length, 'проект', 'проекта', 'проектов')}` : ''}{b.articles.length ? `${b.objects.length ? ' · ' : ''}${b.articles.length} ${plural(b.articles.length, 'статья', 'статьи', 'статей')}` : ''}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="note">Связи бюро с проектами — по досье Шахматки: часть из них сигналы с рынка, а не официальные сообщения; это помечено на странице бюро. Нашли ошибку — напишите нам.</p>
    </>
  )
}
