/**
 * Фото досье из content/objects/photos.json (файлы в content/objects/photos/).
 * Ставит галерею только объектам с пустой галереей: фото из кабинета и админки не перезаписываются.
 * npm run seed:photos
 */
import fs from 'node:fs'
import path from 'node:path'
import { initPayload } from './_payload'
import { sourcePath } from './_source'

const BASE = process.env.CONTENT_DIR ? path.join(process.env.CONTENT_DIR, '..', 'objects') : '../content/objects'
const FILE = path.resolve(BASE, 'photos.json')
const DIR = path.resolve(BASE, 'photos')

async function run() {
  const payload = await initPayload()
  const { photos } = JSON.parse(fs.readFileSync(FILE, 'utf8')) as { photos: Record<string, { files: string[]; credit?: string }> }
  const devs = new Map((await payload.find({ collection: 'developers', limit: 10000, depth: 0, pagination: false, select: { name: true } })).docs.map((d) => [d.id, d.name as string]))
  let set = 0, kept = 0, miss = 0
  for (const [slug, p] of Object.entries(photos)) {
    const o = (await payload.find({ collection: 'objects', where: { slug: { equals: slug } }, limit: 1, depth: 0, select: { name: true, gallery: true, developer: true } })).docs[0] as unknown as { id: number; name: string; gallery?: unknown[]; developer?: number } | undefined
    if (!o) { miss++; continue }
    if (o.gallery?.length) { kept++; continue }
    const dev = o.developer ? devs.get(o.developer) : undefined
    const isRender = (p.credit || 'визуализация').startsWith('визуал')
    const ids: number[] = []
    for (const [i, f] of p.files.entries()) {
      const found = (await payload.find({ collection: 'media', where: { filename: { equals: f } }, limit: 1, depth: 0 })).docs[0]
      if (found) { ids.push(found.id as number); continue }
      const filePath = await sourcePath(DIR, f)
      if (!filePath) { console.log(`  нет файла ${f}`); continue }
      const alt = `${o.name}${isRender ? ' — визуализация' : ' — фото'}${i ? ` ${i + 1}` : ''}`.slice(0, 125)
      const doc = await payload.create({
        collection: 'media',
        data: { alt, caption: isRender ? `Визуализация${dev ? `: ${dev}` : ''}` : undefined, credit: isRender ? dev : undefined } as never,
        filePath,
      })
      ids.push(doc.id as number)
    }
    if (!ids.length) continue
    await payload.update({ collection: 'objects', id: o.id, data: { gallery: ids } as never })
    set++
  }
  console.log(`Фото досье: галерея поставлена ${set}, уже были фото ${kept}, нет объекта ${miss}`)
  process.exit(0)
}
await run()
