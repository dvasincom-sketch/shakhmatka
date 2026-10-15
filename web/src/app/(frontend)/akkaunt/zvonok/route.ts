import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { CALL_COOKIE, callEnabled, checkStatus, normPhone, pendingValue, prettyPhone, readPending, startCheck, upsertReaderByPhone } from '@/lib/callcheck'
import { COOKIE, sessionValue } from '@/lib/reader'

export const dynamic = 'force-dynamic'
const secure = process.env.NODE_ENV === 'production'

/** POST {phone} — начать вход по звонку: вернуть номер 8 800, на который звонить; POST {check: true} — проверить, был ли звонок */
export async function POST(req: Request) {
  if (!callEnabled()) return NextResponse.json({ error: 'Вход по звонку пока не настроен' }, { status: 503 })
  const b = await req.json().catch(() => ({})) as { phone?: string; check?: boolean }
  const jar = await cookies()
  if (b.check) {
    const p = readPending(jar.get(CALL_COOKIE)?.value)
    if (!p) return NextResponse.json({ state: 'expired' })
    const st = await checkStatus(p.checkId)
    if (st !== 'ok') return NextResponse.json({ state: st })
    const r = await upsertReaderByPhone(p.phone)
    const res = NextResponse.json({ state: 'ok' })
    res.cookies.set(COOKIE, sessionValue(r.id), { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 180 * 86400 })
    res.cookies.delete(CALL_COOKIE)
    return res
  }
  const phone = normPhone(b.phone || '')
  if (!phone) return NextResponse.json({ error: 'Проверьте номер: нужен российский номер, например +7 999 123-45-67' }, { status: 400 })
  const c = await startCheck(phone)
  if ('error' in c) return NextResponse.json({ error: c.error }, { status: 502 })
  const res = NextResponse.json({ callPhone: c.callPhone, callPretty: c.callPretty, phone: prettyPhone(phone), dev: !process.env.SMSRU_API_ID })
  res.cookies.set(CALL_COOKIE, pendingValue(c.checkId, phone), { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 5 * 60 })
  return res
}
