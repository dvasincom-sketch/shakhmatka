import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { baseFor } from '@/lib/reader'

/** Отписка в один клик из письма: ?k=<ключ отписки> — рассылка выключается, подписки остаются */
async function off(k: string) {
  if (!k || k.length < 10) return false
  const payload = await getPayload({ config })
  const r = (await payload.find({ collection: 'readers', where: { unsubscribeKey: { equals: k } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!r) return false
  await payload.update({ collection: 'readers', id: r.id, overrideAccess: true, data: { frequency: 'off' } as never })
  return true
}
export async function GET(req: Request) {
  const ok = await off(new URL(req.url).searchParams.get('k') || '')
  return NextResponse.redirect(new URL(ok ? '/akkaunt/?otpiska=1' : '/akkaunt/?oshibka=otpiska', baseFor(req)))
}
// List-Unsubscribe-Post: почтовые клиенты отписывают POST-запросом
export async function POST(req: Request) {
  await off(new URL(req.url).searchParams.get('k') || '')
  return NextResponse.json({ ok: true })
}
