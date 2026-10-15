import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { currentReader } from '@/lib/reader'

/** POST {frequency: weekly|daily|off} */
export async function POST(req: Request) {
  const r = await currentReader()
  if (!r) return NextResponse.json({ error: 'auth' }, { status: 401 })
  const b = await req.json().catch(() => ({})) as { frequency?: string }
  if (!['weekly', 'daily', 'off'].includes(b.frequency || '')) return NextResponse.json({ error: 'bad' }, { status: 400 })
  const payload = await getPayload({ config })
  await payload.update({ collection: 'readers', id: r.id, overrideAccess: true, data: { frequency: b.frequency } as never })
  return NextResponse.json({ ok: true })
}
