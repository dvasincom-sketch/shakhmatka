/**
 * Фото объектов из открытых источников: content/objects/photos-remote.json
 * (генератор: pipeline/photos-remote/; сейчас — Wikimedia Commons, только свободные лицензии).
 * Сервер сам скачивает файл, кладёт его в Media (в S3 вместе с уменьшенными копиями) и ставит в галерею,
 * только если у объекта ещё нет ни одного фото. Повторный запуск безопасен: файл ищется по имени.
 * npm run seed:photos-remote
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { initPayload } from './_payload'

const FILE = path.resolve(process.env.CONTENT_DIR ? path.join(process.env.CONTENT_DIR, '..', 'objects', 'photos-remote.json') : '../content/objects/photos-remote.json')
type Pic = { title: string; license: string; author: string; what?: string }
const UA = 'Shakhmatka/1.0 (https://xn--80aaa3bi1bsw.xn--80adxhks/; редакция) node-fetch'

const fileUrl = (title: string) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title.replace(/^File:/, '').replace(/ /g, '_'))}?width=1600`
const nameFor = (slug: string, i: number, title: string) => `c-${slug}-${i + 1}${(path.extname(title).toLowerCase().match(/\.(jpe?g|png|webp)$/) || ['.jpg'])[0].replace('.jpeg', '.jpg')}`

async function download(url: string, to: string): Promise<boolean> {
  for (let a = 0; a < 3; a++) {
    const r = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' }).catch(() => null)
    if (r?.ok) { fs.writeFileSync(to, Buffer.from(await r.arrayBuffer())); return fs.statSync(to).size > 5000 }
    await new Promise((x) => setTimeout(x, 2000 * (a + 1)))
  }
  return false
}

async function run() {
  if (!fs.existsSync(FILE)) { console.log('нет файла', FILE); process.exit(0) }
  const payload = await initPayload()
  const all = JSON.parse(fs.readFileSync(FILE, 'utf8')) as Record<string, Pic[]>
  let set = 0, kept = 0, miss = 0, failed = 0
  for (const [slug, pics] of Object.entries(all)) {
    const o = (await payload.find({ collection: 'objects', where: { slug: { equals: slug } }, limit: 1, depth: 0, select: { name: true, gallery: true } })).docs[0] as unknown as { id: number; name: string; gallery?: unknown[] } | undefined
    if (!o) { miss++; continue }
    if (o.gallery?.length) { kept++; continue }
    const ids: number[] = []
    for (const [i, p] of pics.entries()) {
      const filename = nameFor(slug, i, p.title)
      const found = (await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, depth: 0 })).docs[0]
      if (found) { ids.push(found.id as number); continue }
      const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rp-')), filename)
      if (!(await download(fileUrl(p.title), tmp))) { failed++; console.log(`  не скачалось: ${p.title}`); continue }
      const doc = await payload.create({
        collection: 'media',
        data: { alt: `${o.name}${p.what ? ` — ${p.what}` : ''}`.slice(0, 125), credit: `Фото: ${p.author}, ${p.license}, Wikimedia Commons` } as never,
        filePath: tmp,
      })
      ids.push(doc.id as number)
      await new Promise((x) => setTimeout(x, 500)) // бережно к Commons
    }
    if (!ids.length) continue
    await payload.update({ collection: 'objects', id: o.id, data: { gallery: ids } as never })
    set++
  }
  console.log(`Фото из открытых источников: галерея поставлена ${set}, уже были фото ${kept}, нет объекта ${miss}, не скачалось ${failed}`)
  process.exit(0)
}
await run()
