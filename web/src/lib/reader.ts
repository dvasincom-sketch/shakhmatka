/**
 * Читатели «Шахматки»: вход по ссылке из письма, подписки «Следить», рассылки.
 * Сессия — своя подписанная cookie `sh_reader` (не payload-token: та у сотрудников).
 * Почта — SMTP из переменных окружения (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM).
 * Без SMTP письма не уходят, а ссылка входа пишется в лог сервера (и в dev возвращается в ответ — для проверки).
 */
import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import nodemailer from 'nodemailer'

export const COOKIE = 'sh_reader'
const SECRET = () => process.env.PAYLOAD_SECRET || 'dev-secret'
const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://шахматка.москва'
export const FOLLOW_KINDS = ['object', 'developer', 'place', 'bureau', 'signals'] as const
export type FollowKind = (typeof FOLLOW_KINDS)[number]

export type Reader = { id: number; email: string; confirmed?: boolean | null; frequency?: string | null; unsubscribeKey?: string | null; follows?: number | null }

const sign = (v: string) => crypto.createHmac('sha256', SECRET()).update(v).digest('base64url')
const hash = (v: string) => crypto.createHash('sha256').update(v).digest('hex')

/** Значение cookie: id.срок.подпись — проверяется без базы */
export function sessionValue(id: number, days = 180) {
  const exp = Date.now() + days * 864e5
  return `${id}.${exp}.${sign(`${id}.${exp}`)}`
}

export async function readerId(): Promise<number | null> {
  const v = (await cookies()).get(COOKIE)?.value
  if (!v) return null
  const [id, exp, sig] = v.split('.')
  if (!id || !exp || !sig || +exp < Date.now()) return null
  const good = sign(`${id}.${exp}`)
  if (good.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(good), Buffer.from(sig))) return null
  return +id
}

export async function currentReader(): Promise<Reader | null> {
  const id = await readerId()
  if (!id) return null
  const payload = await getPayload({ config })
  const r = await payload.findByID({ collection: 'readers', id, depth: 0, overrideAccess: true }).catch(() => null)
  return (r as unknown as Reader) || null
}

export const normEmail = (e: string) => String(e || '').trim().toLowerCase()
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 200

/** Находит или создаёт читателя по email */
export async function upsertReader(email: string, source?: string): Promise<Reader> {
  const payload = await getPayload({ config })
  const ex = (await payload.find({ collection: 'readers', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (ex) return ex as unknown as Reader
  return (await payload.create({ collection: 'readers', overrideAccess: true, data: { email, source, unsubscribeKey: crypto.randomBytes(18).toString('base64url') } as never })) as unknown as Reader
}

/** Новая ссылка входа (действует 2 суток). В базе — только хеш токена. */
export async function loginLink(reader: Reader, next = '/akkaunt/', base = SITE()): Promise<string> {
  const token = crypto.randomBytes(24).toString('base64url')
  const payload = await getPayload({ config })
  await payload.update({ collection: 'readers', id: reader.id, overrideAccess: true, data: { loginTokenHash: hash(token), loginTokenExpires: new Date(Date.now() + 2 * 864e5).toISOString() } as never })
  const u = new URL('/akkaunt/vkhod/', base)
  u.searchParams.set('t', token)
  u.searchParams.set('r', String(reader.id))
  if (next.startsWith('/')) u.searchParams.set('next', next)
  return u.toString()
}

/** Проверка токена из письма: возвращает читателя и гасит токен (одноразовый) */
export async function consumeToken(id: number, token: string): Promise<Reader | null> {
  const payload = await getPayload({ config })
  const r = (await payload.findByID({ collection: 'readers', id, depth: 0, overrideAccess: true, showHiddenFields: true }).catch(() => null)) as unknown as (Reader & { loginTokenHash?: string; loginTokenExpires?: string }) | null
  if (!r?.loginTokenHash || !r.loginTokenExpires || new Date(r.loginTokenExpires).getTime() < Date.now()) return null
  if (r.loginTokenHash !== hash(token)) return null
  await payload.update({ collection: 'readers', id, overrideAccess: true, data: { loginTokenHash: null, loginTokenExpires: null, confirmed: true } as never })
  // всё, на что нажимал «Следить» до подтверждения, становится активным
  await payload.update({ collection: 'follows', where: { and: [{ reader: { equals: id } }, { status: { equals: 'pending' } }] }, overrideAccess: true, data: { status: 'active' } as never })
  return r
}

export async function recountFollows(readerIdN: number) {
  const payload = await getPayload({ config })
  const { totalDocs } = await payload.count({ collection: 'follows', where: { reader: { equals: readerIdN } }, overrideAccess: true })
  await payload.update({ collection: 'readers', id: readerIdN, overrideAccess: true, data: { follows: totalDocs } as never })
}

let transport: nodemailer.Transporter | null | undefined
function mailer() {
  if (transport !== undefined) return transport
  const host = process.env.SMTP_HOST
  transport = host
    ? nodemailer.createTransport({ host, port: +(process.env.SMTP_PORT || 465), secure: (process.env.SMTP_PORT || '465') === '465', auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined })
    : null
  return transport
}
export const mailEnabled = () => !!process.env.SMTP_HOST

export async function sendMail(to: string, subject: string, html: string, text: string, headers?: Record<string, string>): Promise<boolean> {
  const t = mailer()
  if (!t) { console.log(`[mail] SMTP не настроен — письмо «${subject}» для ${to} не отправлено:\n${text}`); return false }
  await t.sendMail({ from: process.env.MAIL_FROM || 'Шахматка <noreply@xn--80aaa3bi1bsw.xn--80adxhks>', to, subject, html, text, headers })
  return true
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** Письмо со ссылкой входа / подтверждения подписки */
export async function sendLoginMail(email: string, link: string, label?: string) {
  const subject = label ? `Подтвердите подписку: ${label}` : 'Вход в «Шахматку»'
  const lead = label ? `Вы нажали «Следить» на странице «${label}». Подтвердите email — и мы будем присылать, что там происходит: новые события досье, сигналы и материалы.` : 'Ссылка для входа в личный кабинет «Шахматки».'
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#1b1b1d;max-width:520px">
<p style="font-size:22px;font-weight:700;margin:0 0 12px">Шахматка</p><p>${esc(lead)}</p>
<p><a href="${link}" style="display:inline-block;background:#1b1b1d;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">${label ? 'Подтвердить и следить' : 'Войти'}</a></p>
<p style="color:#777;font-size:13px">Ссылка действует 2 суток и работает один раз. Если это были не вы — просто удалите письмо.</p></div>`
  return sendMail(email, subject, html, `${lead}\n\n${link}\n\nСсылка действует 2 суток. Если это были не вы — удалите письмо.`)
}

export const siteUrl = SITE
/** База для ссылок и редиректов: в проде — адрес сайта, локально — адрес, на который пришёл запрос (localhost) */
export const baseFor = (req: Request) => (process.env.NODE_ENV === 'production' ? SITE() : new URL(req.url).origin)
export { esc }
