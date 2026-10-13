/**
 * Черновики словаря из content/terms/terms.json (published=false). Существующие термины не трогает.
 * npm run seed:terms
 */
import fs from 'node:fs'
import path from 'node:path'
import { initPayload } from './_payload'

const FILE = path.resolve(process.env.CONTENT_DIR ? path.join(process.env.CONTENT_DIR, '..', 'terms', 'terms.json') : '../content/terms/terms.json')

async function run() {
  const payload = await initPayload()
  const { terms } = JSON.parse(fs.readFileSync(FILE, 'utf8')) as { terms: Record<string, unknown>[] }
  for (const t of terms) {
    const found = (await payload.find({ collection: 'terms', where: { slug: { equals: t.slug } }, limit: 1 })).docs[0]
    if (found) { console.log('есть', t.slug); continue }
    await payload.create({ collection: 'terms', data: { ...t, full: t.full || undefined, published: false } as never })
    console.log('черновик', t.slug)
  }
  process.exit(0)
}
await run()
