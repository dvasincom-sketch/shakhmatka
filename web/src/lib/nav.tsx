'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const NAV = [
  { href: '/', label: 'Лента' },
  { href: '/obekty/', label: 'Объекты' },
  { href: '/krt/', label: 'КРТ' },
  { href: '/signaly/', label: 'Сигналы' },
  { href: '/zastroyshchiki/', label: 'Застройщики' },
  { href: '/pro/', label: 'Подписка' },
]

export function NavLinks() {
  const path = usePathname() || '/'
  const active = (href: string) => (href === '/' ? path === '/' || path.startsWith('/novosti') : path.startsWith(href.replace(/\/$/, '')))
  return (
    <nav className="nav" aria-label="Разделы">
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined}>{n.label}</Link>
      ))}
    </nav>
  )
}
