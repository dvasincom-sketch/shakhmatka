import { NextResponse } from 'next/server'
import { COOKIE, consumeToken, loginLink, mailEnabled, normEmail, sendLoginMail, sessionValue, baseFor, upsertReader, validEmail } from '@/lib/reader'

export const dynamic = 'force-dynamic'

/** Ссылка из письма: ?r=<id>&t=<токен>&next=<страница> → cookie и переход */
export async function GET(req: Request) {
  const u = new URL(req.url)
  const id = +(u.searchParams.get('r') || 0), t = u.searchParams.get('t') || ''
  const next = u.searchParams.get('next') || '/akkaunt/'
  const r = id && t ? await consumeToken(id, t) : null
  const to = new URL(r ? (next.startsWith('/') ? next : '/akkaunt/') : '/akkaunt/?oshibka=ssylka', baseFor(req))
  if (r) to.searchParams.set('podpiska', '1')
  const res = NextResponse.redirect(to)
  if (r) res.cookies.set(COOKIE, sessionValue(r.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 180 * 86400 })
  return res
}

/** POST {email} — прислать ссылку для входа */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({})) as { email?: string }
  const email = normEmail(b.email || '')
  if (!validEmail(email)) return NextResponse.json({ error: 'email' }, { status: 400 })
  const r = await upsertReader(email, '/akkaunt/')
  const link = await loginLink(r, '/akkaunt/', baseFor(req))
  const sent = await sendLoginMail(email, link)
  return NextResponse.json({ ok: true, sent, devLink: !mailEnabled() && process.env.NODE_ENV !== 'production' ? link : undefined })
}
