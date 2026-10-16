import { notFound, permanentRedirect } from 'next/navigation'
import { latinPath } from '@/lib/cyr-redirect'

/** Кириллический адрес (/застройщики/самолёт/) → латинский; любой другой несуществующий адрес → фирменная 404 из (frontend)/not-found.tsx */
export default async function Missing({ params }: { params: Promise<{ missing: string[] }> }) {
  const target = await latinPath((await params).missing || [])
  if (target) permanentRedirect(target)
  notFound()
}
