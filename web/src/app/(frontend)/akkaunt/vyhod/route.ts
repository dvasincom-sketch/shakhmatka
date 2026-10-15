import { NextResponse } from 'next/server'
import { COOKIE, baseFor } from '@/lib/reader'

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL('/akkaunt/', baseFor(req)))
  res.cookies.delete(COOKIE)
  return res
}
