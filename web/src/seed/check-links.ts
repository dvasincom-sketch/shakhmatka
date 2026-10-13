/**
 * Проверка внутренних ссылок во всех статьях: npm run check:links
 * Печатает отчёт и завершается с кодом 1, если есть битые ссылки (удобно для CI перед публикацией).
 */
import { initPayload } from './_payload'
import { buildLinkIndex, findBroken } from '../lib/links'

async function run() {
  const payload = await initPayload()
  const index = await buildLinkIndex(payload)
  const arts = await payload.find({ collection: 'articles', limit: 100000, pagination: false, depth: 0, select: { slug: true, body: true } })
  const byTarget = new Map<string, { reason: string; in: Set<string> }>()
  let total = 0
  for (const a of arts.docs) {
    for (const b of findBroken(index, a.body || '')) {
      total++
      const t = byTarget.get(b.href) || { reason: b.reason, in: new Set<string>() }
      t.in.add(a.slug)
      byTarget.set(b.href, t)
    }
  }
  console.log(`Статей: ${arts.docs.length}, страниц на сайте: ${index.pages.size}`)
  if (!total) { console.log('Битых внутренних ссылок нет'); process.exit(0) }
  console.log(`Битых ссылок: ${total}, разных адресов: ${byTarget.size}\n`)
  const rows = [...byTarget.entries()].sort((a, b) => b[1].in.size - a[1].in.size)
  for (const [href, t] of rows) console.log(`${String(t.in.size).padStart(3)} ×  ${href}  — ${t.reason}\n        ${[...t.in].join(', ')}`)
  process.exit(1)
}
await run()
