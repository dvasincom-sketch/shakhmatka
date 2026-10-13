import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * getPayload для скриптов с одной повторной попыткой.
 * На SQLite после добавления новой коллекции первое автообновление схемы иногда падает
 * с «index … already exists» (особенность drizzle-kit push), а повторное проходит.
 */
export async function initPayload() {
  try {
    return await getPayload({ config })
  } catch (e) {
    const msg = String((e as Error)?.message || '') + String((e as { cause?: unknown })?.cause || '')
    if (!/already exists/.test(msg)) throw e
    console.log('Схема базы обновилась, повторяю подключение…')
    return await getPayload({ config })
  }
}
