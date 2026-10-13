/**
 * Подтягивает проверенные параметры объектов (класс, цена, срок ввода) из content/objects/facts.json.
 * Идемпотентно: npx payload run src/seed/object-facts.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { initPayload } from './_payload'

const FILE = path.resolve(process.env.CONTENT_DIR ? path.join(process.env.CONTENT_DIR, '..', 'objects', 'facts.json') : '../content/objects/facts.json')

async function run() {
  const payload = await initPayload()
  const { objects } = JSON.parse(fs.readFileSync(FILE, 'utf8')) as { objects: Record<string, Record<string, unknown>> }
  for (const [slug, data] of Object.entries(objects)) {
    const found = await payload.find({ collection: 'objects', where: { slug: { equals: slug } }, limit: 1 })
    const doc = found.docs[0]
    if (!doc) { console.log('нет объекта', slug); continue }
    await payload.update({ collection: 'objects', id: doc.id, data: data as never })
    console.log('обновлён', slug)
  }
  process.exit(0)
}
await run()
