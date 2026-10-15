import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { FOLLOW_KINDS, type FollowKind, baseFor, currentReader, loginLink, mailEnabled, normEmail, recountFollows, sendLoginMail, upsertReader, validEmail } from '@/lib/reader'

export const dynamic = 'force-dynamic'
const KEY = /^[a-z0-9-]{1,100}$/
// простая защита от рассылки писем на чужие адреса: не больше 5 писем в час с одного IP
const hits = new Map<string, number[]>()
function limited(ip: string) {
  const now = Date.now(); const a = (hits.get(ip) || []).filter((t) => now - t < 36e5)
  if (a.length >= 5) return true
  a.push(now); hits.set(ip, a); return false
}

async function exists(kind: FollowKind, key: string) {
  if (kind === 'signals' || kind === 'bureau' || kind === 'place') return true
  const payload = await getPayload({ config })
  const col = kind === 'object' ? 'objects' : 'developers'
  return (await payload.count({ collection: col, where: { slug: { equals: key } } })).totalDocs > 0
}

/** GET ?kind=&key= — состояние кнопки: вошёл ли читатель и следит ли он */
export async function GET(req: Request) {
  const u = new URL(req.url)
  const kind = u.searchParams.get('kind') as FollowKind, key = u.searchParams.get('key') || ''
  const r = await currentReader()
  if (!r) return NextResponse.json({ loggedIn: false, following: false })
  const payload = await getPayload({ config })
  const f = FOLLOW_KINDS.includes(kind) && KEY.test(key)
    ? (await payload.find({ collection: 'follows', where: { and: [{ reader: { equals: r.id } }, { kind: { equals: kind } }, { key: { equals: key } }] }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
    : undefined
  return NextResponse.json({ loggedIn: true, email: r.email, following: !!f })
}

/** POST {kind, key, label, page, email?} — подписаться. Гость указывает email и получает письмо-подтверждение. */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({})) as { kind?: string; key?: string; label?: string; page?: string; email?: string }
  const kind = b.kind as FollowKind, key = String(b.key || ''), label = String(b.label || '').slice(0, 140), page = String(b.page || '').slice(0, 300)
  if (!FOLLOW_KINDS.includes(kind) || !KEY.test(key) || !(await exists(kind, key))) return NextResponse.json({ error: 'bad-target' }, { status: 400 })
  const payload = await getPayload({ config })
  let r = await currentReader()
  let sent = false, devLink: string | undefined
  if (!r) {
    const email = normEmail(b.email || '')
    if (!validEmail(email)) return NextResponse.json({ error: 'email' }, { status: 400 })
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local'
    if (limited(ip)) return NextResponse.json({ error: 'rate' }, { status: 429 })
    r = await upsertReader(email, page)
    const link = await loginLink(r, page.startsWith('/') ? page : '/akkaunt/', baseFor(req))
    sent = await sendLoginMail(email, link, label || undefined)
    if (!mailEnabled() && process.env.NODE_ENV !== 'production') devLink = link
  }
  const ex = (await payload.find({ collection: 'follows', where: { and: [{ reader: { equals: r.id } }, { kind: { equals: kind } }, { key: { equals: key } }] }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!ex) await payload.create({ collection: 'follows', overrideAccess: true, data: { reader: r.id, kind, key, label, page, status: r.confirmed ? 'active' : 'pending' } as never })
  await recountFollows(r.id)
  return NextResponse.json({ ok: true, following: !!r.confirmed, pending: !r.confirmed, sent, devLink })
}

/** DELETE ?kind=&key= — отписаться */
export async function DELETE(req: Request) {
  const u = new URL(req.url)
  const r = await currentReader()
  if (!r) return NextResponse.json({ error: 'auth' }, { status: 401 })
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'follows', where: { and: [{ reader: { equals: r.id } }, { kind: { equals: u.searchParams.get('kind') || '' } }, { key: { equals: u.searchParams.get('key') || '' } }] }, overrideAccess: true })
  await recountFollows(r.id)
  return NextResponse.json({ ok: true, following: false })
}
