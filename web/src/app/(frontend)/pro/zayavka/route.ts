import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { esc, normEmail, sendMail, validEmail } from '@/lib/reader'

export const dynamic = 'force-dynamic'
const ROLES = ['private', 'developer', 'broker', 'investor', 'architect', 'owner', 'other']
const PRODUCTS = ['invest', 'pro', 'land', 'data']
const hits = new Map<string, number[]>()

/** POST — заявка с /pro/: сохраняется в «Заявки» и уходит письмом редакции (LEADS_EMAIL) */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({})) as Record<string, unknown>
  const s = (k: string, n = 300) => String(b[k] ?? '').trim().slice(0, n)
  if (s('website')) return NextResponse.json({ ok: true }) // ловушка для ботов
  const email = normEmail(s('email'))
  if (!s('name') || !validEmail(email)) return NextResponse.json({ error: 'fields' }, { status: 400 })
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local'
  const now = Date.now(); const a = (hits.get(ip) || []).filter((t) => now - t < 36e5)
  if (a.length >= 5) return NextResponse.json({ error: 'rate' }, { status: 429 })
  a.push(now); hits.set(ip, a)
  const role = ROLES.includes(s('role')) ? s('role') : 'other'
  const product = (Array.isArray(b.product) ? b.product : []).map(String).filter((x) => PRODUCTS.includes(x))
  const data = { name: s('name', 120), company: s('company', 200), role, product, email, phone: s('phone', 80), request: s('request', 3000), page: s('page', 200) }
  const payload = await getPayload({ config })
  await payload.create({ collection: 'leads', overrideAccess: true, data: data as never })
  const to = process.env.LEADS_EMAIL
  if (to) {
    const rows = Object.entries(data).map(([k, v]) => `<tr><td style="color:#777;padding:2px 10px 2px 0">${k}</td><td>${esc(Array.isArray(v) ? v.join(', ') : String(v))}</td></tr>`).join('')
    await sendMail(to, `Заявка Про: ${data.company || data.name}`, `<table>${rows}</table>`, Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n')).catch(() => null)
  }
  return NextResponse.json({ ok: true })
}
