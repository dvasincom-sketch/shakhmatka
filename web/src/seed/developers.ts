/**
 * Профили застройщиков из content/developers/profiles.json: поле about.
 * Заполняет about, только если оно пустое (правки редакции не трогает). Застройщика нет в базе — пропускает.
 * npm run seed:developers
 */
import fs from 'node:fs'
import path from 'node:path'
import { initPayload } from './_payload'

const FILE = path.resolve(process.env.CONTENT_DIR ? path.join(process.env.CONTENT_DIR, '..', 'developers', 'profiles.json') : '../content/developers/profiles.json')

async function run() {
  const payload = await initPayload()
  const { profiles } = JSON.parse(fs.readFileSync(FILE, 'utf8')) as { profiles: { slug: string; about: string }[] }
  let set = 0
  for (const p of profiles) {
    const found = (await payload.find({ collection: 'developers', where: { slug: { equals: p.slug } }, limit: 1, depth: 0 })).docs[0] as unknown as { id: number; about?: string | null } | undefined
    if (!found) { console.log('нет в базе', p.slug); continue }
    if (found.about?.trim()) { console.log('есть', p.slug); continue }
    await payload.update({ collection: 'developers', id: found.id, data: { about: p.about } as never })
    set++
    console.log('профиль', p.slug)
  }
  console.log(`Профили: заполнено ${set} из ${profiles.length}`)
  process.exit(0)
}
await run()
