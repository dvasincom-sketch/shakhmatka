import { notFound } from 'next/navigation'

/** Любой несуществующий адрес → фирменная 404 из (frontend)/not-found.tsx */
export default function Missing() {
  notFound()
}
