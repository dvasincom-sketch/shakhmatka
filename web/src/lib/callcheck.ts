/**
 * Вход по звонку через sms.ru («Авторизация по звонку», callcheck).
 * Читатель вводит номер → sms.ru выдаёт номер 8 800, на который нужно позвонить с этого телефона →
 * sms.ru сбрасывает звонок (бесплатно для звонящего) и отмечает проверку подтверждённой (check_status 401) → мы ставим cookie читателя.
 * Переменные окружения: SMSRU_API_ID — ключ API из личного кабинета sms.ru.
 * Без ключа в разработке работает имитация: показываем тестовый номер, вход подтверждается на втором опросе. В продакшене без ключа вход по звонку выключен.
 */
import crypto from 'node:crypto'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Reader } from './reader'

const API = 'https://sms.ru/callcheck'
const SECRET = () => process.env.PAYLOAD_SECRET || 'dev-secret'
export const CALL_COOKIE = 'sh_call'
export const callEnabled = () => !!process.env.SMSRU_API_ID || process.env.NODE_ENV !== 'production'

/** +7 (999) 123-45-67, 8 999…, 9991234567 → 79991234567; не российский мобильный/городской — null */
export function normPhone(v: string): string | null {
  let d = String(v || '').replace(/\D/g, '')
  if (d.length === 10) d = '7' + d
  if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1)
  return /^7[3489]\d{9}$/.test(d) ? d : null
}
export const prettyPhone = (d: string) => `+7 ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`

const sign = (v: string) => crypto.createHmac('sha256', SECRET()).update(v).digest('base64url')
/** Cookie ожидания звонка: check_id.телефон.срок.подпись — живёт 5 минут */
export function pendingValue(checkId: string, phone: string) {
  const exp = Date.now() + 5 * 60_000
  const v = `${checkId}.${phone}.${exp}`
  return `${v}.${sign(v)}`
}
export function readPending(v?: string): { checkId: string; phone: string } | null {
  if (!v) return null
  const [checkId, phone, exp, sig] = v.split('.')
  if (!checkId || !phone || !exp || !sig || +exp < Date.now()) return null
  const good = sign(`${checkId}.${phone}.${exp}`)
  if (good.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(good), Buffer.from(sig))) return null
  return { checkId, phone }
}

/** Создать проверку: номер, на который читатель должен позвонить */
export async function startCheck(phone: string): Promise<{ checkId: string; callPhone: string; callPretty: string } | { error: string }> {
  const key = process.env.SMSRU_API_ID
  if (!key) return { checkId: `dev${Date.now()}`, callPhone: '78000000000', callPretty: '8 800 000-00-00' } // имитация в разработке
  const u = new URL(`${API}/add`)
  u.searchParams.set('api_id', key); u.searchParams.set('phone', phone); u.searchParams.set('json', '1')
  const j = await fetch(u, { cache: 'no-store' }).then((r) => r.json()).catch(() => null) as { status?: string; check_id?: string; call_phone?: string | number; call_phone_pretty?: string; status_text?: string } | null
  if (!j || j.status !== 'OK' || !j.check_id || !j.call_phone) return { error: j?.status_text || 'Сервис звонков недоступен, попробуйте позже' }
  return { checkId: String(j.check_id), callPhone: String(j.call_phone), callPretty: j.call_phone_pretty || String(j.call_phone) }
}

const devPolls = new Map<string, number>()
/** Статус проверки: ok — звонок был с этого номера; expired — время вышло; wait — ещё не звонили */
export async function checkStatus(checkId: string): Promise<'ok' | 'wait' | 'expired' | 'error'> {
  const key = process.env.SMSRU_API_ID
  if (!key) { const n = (devPolls.get(checkId) || 0) + 1; devPolls.set(checkId, n); return n >= 2 ? 'ok' : 'wait' }
  const u = new URL(`${API}/status`)
  u.searchParams.set('api_id', key); u.searchParams.set('check_id', checkId); u.searchParams.set('json', '1')
  const j = await fetch(u, { cache: 'no-store' }).then((r) => r.json()).catch(() => null) as { status?: string; check_status?: number | string; check_status_text?: string } | null
  if (!j || j.status !== 'OK') return 'error'
  const c = Number(j.check_status)
  if (c === 401) return 'ok'
  if (c === 402 || /истек|истёк|expired/i.test(j.check_status_text || '')) return 'expired'
  return 'wait'
}

/** Находит или создаёт читателя по подтверждённому номеру */
export async function upsertReaderByPhone(phone: string): Promise<Reader> {
  const payload = await getPayload({ config })
  const ex = (await payload.find({ collection: 'readers', where: { phone: { equals: phone } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (ex) return ex as unknown as Reader
  return (await payload.create({ collection: 'readers', overrideAccess: true, data: { phone, confirmed: true, source: '/akkaunt/ (звонок)', unsubscribeKey: crypto.randomBytes(18).toString('base64url') } as never })) as unknown as Reader
}
