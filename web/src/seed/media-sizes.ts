/**
 * Досоздаёт уменьшенные копии (размер card) для файлов, загруженных до их появления.
 * Берёт исходник из локальной папки media/ (или content/…); в проде с S3 не нужен — там файлы грузятся уже с копиями.
 * npm run media:sizes
 */
import fs from 'node:fs'
import path from 'node:path'
import { initPayload } from './_payload'

const DIRS = ['media', '../content/objects/photos', '../content/articles/media'].map((d) => path.resolve(d))

async function run() {
  const payload = await initPayload()
  const docs = (await payload.find({ collection: 'media', limit: 100000, pagination: false, depth: 0 })).docs as unknown as { id: number; filename?: string; sizes?: { card?: { url?: string | null } } }[]
  let done = 0, miss = 0
  for (const m of docs) {
    if (m.sizes?.card?.url || !m.filename) continue
    const src = DIRS.map((d) => path.join(d, m.filename!)).find((p) => fs.existsSync(p))
    if (!src) { miss++; continue }
    const tmp = path.join(fs.mkdtempSync('/tmp/msz-'), m.filename)
    fs.copyFileSync(src, tmp) // payload перезаписывает файл в media/, поэтому грузим копию
    await payload.update({ collection: 'media', id: m.id, data: {}, filePath: tmp, overwriteExistingFiles: true } as never)
    done++
  }
  console.log(`Уменьшенные копии: сделано ${done}, исходник не найден ${miss}`)
  process.exit(0)
}
await run()
