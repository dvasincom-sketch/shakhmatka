import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE } from '@/lib/ui'

export const metadata: Metadata = { title: 'Шахматка Про: аналитика по новостройкам', description: 'Оценка перспективы объектов, история цен, ранние сигналы по участкам и судебные риски застройщиков.', alternates: { canonical: `${SITE}/pro/` } }

const FEAT = [
  ['Оценка перспективы', 'Сравнение объекта с соседними проектами: цена, темп продаж, сроки, риски согласований.'],
  ['История цен', 'Как менялась цена по очередям и форматам квартир со старта продаж.'],
  ['Ранние сигналы', 'Новые участки, решения ГЗК, смена собственника — до того, как проект появится в рекламе.'],
  ['Судебные риски', 'Иски дольщиков, арбитраж, исполнительные производства по застройщику и его проектным компаниям.'],
]

export default function Pro() {
  return (
    <>
      <nav className="crumbs"><Link href="/">Лента</Link><span>/</span><span>Подписка</span></nav>
      <section className="pro-hero">
        <span className="pill dark">Шахматка Про</span>
        <h1>Узнавайте о проектах<span>раньше рекламы</span></h1>
        <p>Лента, статьи и карточки объектов бесплатны. Аналитика для решения о покупке — по подписке.</p>
        <p className="note">Подписка откроется после запуска сайта.</p>
      </section>
      <div className="feat-grid sec">
        {FEAT.map(([t, d]) => <div key={t} className="card feat"><h2>{t}</h2><p>{d}</p></div>)}
      </div>
    </>
  )
}
