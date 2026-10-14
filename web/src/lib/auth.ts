import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { User } from '@/payload-types'
import { roleOf } from '@/access'

/** Текущий пользователь сайта (редакция) по cookie payload-token; гостю — null */
export async function getUser(): Promise<(User & { roleName: string }) | null> {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    if (!user || user.collection !== 'users') return null
    const role = roleOf(user as User)
    return { ...(user as User), roleName: role === 'admin' ? 'Администратор' : 'Редактор' }
  } catch {
    return null
  }
}
