/**
 * Справочник районов и регионов из content/places/places.json. Идемпотентно (upsert по key).
 * Не перезаписывает intro, если редакция уже поменяла его в админке: обновляет только пустые поля.
 * npx payload run src/seed/places.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { initPayload } from './_payload'

const FILE = path.resolve(process.env.CONTENT_DIR ? path.join(process.env.CONTENT_DIR, '..', 'places', 'places.json') : '../content/places/places.json')

async function run() {
  const payload = await initPayload()
  const { places } = JSON.parse(fs.readFileSync(FILE, 'utf8')) as { places: Record<string, string>[] }
  for (const p of places) {
    const found = (await payload.find({ collection: 'places', where: { key: { equals: p.key } }, limit: 1 })).docs[0] as unknown as Record<string, unknown> | undefined
    if (!found) {
      await payload.create({ collection: 'places', data: p as never })
      console.log('создан', p.key)
    } else {
      const patch = Object.fromEntries(Object.entries(p).filter(([k]) => !found[k]))
      if (Object.keys(patch).length) await payload.update({ collection: 'places', id: found.id as number, data: patch as never })
      console.log('ok', p.key, Object.keys(patch).join(',') || '')
    }
  }
  process.exit(0)
}
await run()
