/**
 * Свежие события и поправки объектов из content/objects/updates.json (формат — в src/seed/_updates.ts).
 * Хронология дописывается, а не перезаписывается; уже загруженные события пропускаются, повторный запуск безопасен.
 * Дату последнего события и число сигналов пересчитывает хук коллекции Objects.
 *
 * Запускать ПОСЛЕ seed:dossiers: объекты с галочкой «auto» он пересобирает из архива целиком.
 *   npm run seed:updates                      — применить
 *   DRY=1 npm run seed:updates                — только показать, что изменится
 *   ONLY=myata,eleven npm run seed:updates    — только эти объекты
 */
import fs from 'node:fs'
import path from 'node:path'
import { initPayload } from './_payload'
import { planUpdate, type Obj, type Upd } from './_updates'

const FILE = path.resolve(process.env.CONTENT_DIR ? path.join(process.env.CONTENT_DIR, '..', 'objects', 'updates.json') : '../content/objects/updates.json')
const DRY = process.env.DRY === '1'
const ONLY = new Set((process.env.ONLY || '').split(',').map((s) => s.trim()).filter(Boolean))

/** SQLite занят другим процессом (запущенный next dev, другой seed) — ждём и повторяем, до 5 попыток */
async function retry<T>(f: () => Promise<T>): Promise<T> {
  for (let i = 1; ; i++) {
    try { return await f() } catch (e) {
      const busy = /SQLITE_BUSY|database is locked/.test(String((e as Error)?.message) + String((e as { cause?: unknown })?.cause))
      if (!busy || i >= 5) {
        if (busy) console.log('База занята другим процессом. Остановите npm run dev или другой скрипт (кто держит базу: lsof shakhmatka.db) и запустите снова.')
        throw e
      }
      console.log(`… база занята, повтор через ${i * 2} с (${i}/5)`)
      await new Promise((r) => setTimeout(r, i * 2000))
    }
  }
}

async function run() {
  const all = JSON.parse(fs.readFileSync(FILE, 'utf8')) as Record<string, Upd>
  const entries = Object.entries(all).filter(([slug]) => !slug.startsWith('_') && (!ONLY.size || ONLY.has(slug)))
  const payload = await initPayload()
  let changed = 0, same = 0, missing = 0, events = 0
  for (const [slug, u] of entries) {
    const o = (await retry(() => payload.find({
      collection: 'objects', where: { slug: { equals: slug } }, limit: 1, depth: 0,
      select: { slug: true, name: true, stage: true, district: true, summary: true, aliases: true, timeline: true },
    }))).docs[0] as unknown as Obj | undefined
    if (!o) { console.log(`нет объекта ${slug}`); missing++; continue }
    const p = planUpdate(o, u)
    if (!Object.keys(p.data).length) { same++; continue }
    console.log(`${DRY ? '[проверка] ' : ''}${slug}: ${p.changes.join('; ')}${p.skipped.length ? ` (уже есть: ${p.skipped.length})` : ''}`)
    if (!DRY) await retry(() => payload.update({ collection: 'objects', id: o.id, data: p.data as never }))
    changed++; events += p.added.length
  }
  console.log(`${DRY ? 'Проверка, база не менялась. ' : ''}Обновления объектов: изменено ${changed} (событий +${events}), без изменений ${same}, нет в базе ${missing}`)
  process.exit(0)
}
await run()
