/**
 * Черновики словаря из content/terms/terms.json (published=false). У существующих терминов дописывает только пустые поля
 * (body, full, sources) — правки редакции не перезаписываются, кроме полей из _force. Служебные поля с «_» не импортируются.
 * npm run seed:terms
 */
import fs from 'node:fs'
import path from 'node:path'
import { initPayload } from './_payload'

const FILE = path.resolve(process.env.CONTENT_DIR ? path.join(process.env.CONTENT_DIR, '..', 'terms', 'terms.json') : '../content/terms/terms.json')

async function run() {
  const payload = await initPayload()
  const { terms } = JSON.parse(fs.readFileSync(FILE, 'utf8')) as { terms: Record<string, unknown>[] }
  for (const raw of terms) {
    const t = Object.fromEntries(Object.entries(raw).filter(([k, v]) => !k.startsWith('_') && v != null))
    const found = (await payload.find({ collection: 'terms', where: { slug: { equals: t.slug } }, limit: 1 })).docs[0] as unknown as Record<string, unknown> | undefined
    if (found) {
      const empty = (v: unknown) => v == null || v === '' || (Array.isArray(v) && v.length === 0)
      // _force: поля, которые редакция переписала в terms.json сознательно (новая методика и т. п.) — обновляем даже непустые
      const force = (raw._force as string[] | undefined) || []
      const patch = Object.fromEntries(Object.entries(t).filter(([k]) => force.includes(k) || (['body', 'full', 'sources'].includes(k) && empty(found[k]))))
      if (Object.keys(patch).length) await payload.update({ collection: 'terms', id: found.id as number, data: patch as never })
      console.log('есть', t.slug, Object.keys(patch).join(',') || '')
      continue
    }
    await payload.create({ collection: 'terms', data: { ...t, full: t.full || undefined, published: false } as never })
    console.log('черновик', t.slug)
  }
  process.exit(0)
}
await run()
