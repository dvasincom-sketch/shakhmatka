/**
 * Досье объектов из content/objects/dossiers/*.json: карточка, хронология, галерея, «По соседству».
 * Фото берутся из content/objects/media/ и загружаются в Media один раз (по имени файла).
 * Затем авто-досье из content/objects/archive-dossiers.json (генератор: content/archive/build-dossiers.py):
 *   застройщики и районы создаются, если их нет; объект с галочкой auto перезаписывается целиком;
 *   ручной объект (auto снята) не трогаем, только дописываем хронологию, если она пустая.
 * npm run seed:dossiers
 */
import fs from 'node:fs'
import path from 'node:path'
import { initPayload } from './_payload'

const BASE = path.resolve(process.env.CONTENT_DIR ? path.join(process.env.CONTENT_DIR, '..', 'objects') : '../content/objects')
type Img = { file: string; alt: string; caption?: string }

async function run() {
  const payload = await initPayload()
  const media = async (img?: Img) => {
    if (!img) return undefined
    const found = (await payload.find({ collection: 'media', where: { filename: { equals: img.file } }, limit: 1 })).docs[0]
    if (found) return found.id
    const doc = await payload.create({ collection: 'media', data: { alt: img.alt, caption: img.caption }, filePath: path.join(BASE, 'media', img.file) })
    return doc.id
  }
  const dir = path.join(BASE, 'dossiers')
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
    const dev = d.developer ? (await payload.find({ collection: 'developers', where: { slug: { equals: d.developer } }, limit: 1 })).docs[0] : undefined
    const data = {
      name: d.name, slug: d.slug, zu: d.zu, region: d.region, district: d.district, stage: d.stage,
      developer: dev?.id, legalEntity: d.legalEntity, summary: d.summary,
      aliases: (d.aliases || []).map((value: string) => ({ value })),
      gallery: (await Promise.all((d.gallery || []).map(media))).filter(Boolean),
      timeline: await Promise.all((d.timeline || []).map(async (t: Record<string, unknown>) => ({ ...t, image: await media(t.image as Img), verified: !!t.verified }))),
      neighbors: await Promise.all((d.neighbors || []).map(async (n: Record<string, unknown>) => ({ ...n, image: await media(n.image as Img) }))),
    }
    const ex = (await payload.find({ collection: 'objects', where: { slug: { equals: d.slug } }, limit: 1 })).docs[0]
    if (ex) await payload.update({ collection: 'objects', id: ex.id, data: data as never })
    else await payload.create({ collection: 'objects', data: data as never })
    console.log(ex ? 'обновлено' : 'создано', d.slug, `— событий: ${data.timeline.length}, фото: ${data.gallery.length}`)
  }
  await archive(payload)
  process.exit(0)
}
await run()

type Payload = Awaited<ReturnType<typeof initPayload>>
type ArchObj = { slug: string; manual?: boolean; name?: string; zu?: string | null; aliases?: string[]; region?: string; district?: string; stage?: string | null; developer?: string; summary?: string; timeline: Record<string, unknown>[] }

async function archive(payload: Payload) {
  const file = path.join(BASE, 'archive-dossiers.json')
  if (!fs.existsSync(file)) return
  const A = JSON.parse(fs.readFileSync(file, 'utf8')) as { developers: { slug: string; name: string }[]; places: Record<string, string>[]; objects: ArchObj[] }

  const devId = new Map<string, number | string>()
  for (const d of (await payload.find({ collection: 'developers', limit: 5000, pagination: false, depth: 0 })).docs) devId.set(d.slug, d.id)
  let nd = 0
  for (const d of A.developers) if (!devId.has(d.slug)) { devId.set(d.slug, (await payload.create({ collection: 'developers', data: d })).id); nd++ }

  const placeKeys = new Set((await payload.find({ collection: 'places', limit: 5000, pagination: false, depth: 0 })).docs.map((p) => p.key))
  let np = 0
  for (const p of A.places) if (!placeKeys.has(p.key)) { await payload.create({ collection: 'places', data: p as never }); np++ }

  const existing = new Map<string, { id: number | string; auto?: boolean | null; tl: number }>()
  for (const o of (await payload.find({ collection: 'objects', limit: 10000, pagination: false, depth: 0, select: { slug: true, auto: true, timeline: true } })).docs)
    existing.set(o.slug, { id: o.id, auto: o.auto, tl: (o.timeline || []).length })

  let created = 0, updated = 0, filled = 0, kept = 0
  for (const o of A.objects) {
    const timeline = o.timeline.map((t) => ({ ...t, verified: false }))
    const ex = existing.get(o.slug)
    if (o.manual || (ex && !ex.auto)) {
      if (ex && !ex.tl) { await payload.update({ collection: 'objects', id: ex.id, data: { timeline } as never }); filled++ } else kept++
      continue
    }
    const data = {
      name: o.name, slug: o.slug, zu: o.zu || undefined, region: o.region, district: o.district || null, stage: o.stage || null,
      developer: o.developer ? devId.get(o.developer) : null, summary: o.summary, auto: true,
      aliases: (o.aliases || []).map((value) => ({ value })), timeline,
    }
    if (ex) { await payload.update({ collection: 'objects', id: ex.id, data: data as never }); updated++ }
    else { await payload.create({ collection: 'objects', data: data as never }); created++ }
    if ((created + updated) % 100 === 0) console.log(`  … ${created + updated}`)
  }
  // досье, которых больше нет в выгрузке (склеены с другими при пересборке), удаляем — только автоматические
  const keep = new Set(A.objects.map((o) => o.slug))
  let removed = 0
  for (const [slug, ex] of existing) if (ex.auto && !keep.has(slug)) { await payload.delete({ collection: 'objects', id: ex.id }); removed++ }
  console.log(`Архив: объектов создано ${created}, обновлено ${updated}, удалено устаревших ${removed}, ручным дописана хронология ${filled}, ручные без изменений ${kept}; застройщиков +${nd}, районов +${np}`)
}
