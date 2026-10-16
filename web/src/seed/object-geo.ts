/**
 * Адреса и точки объектов из content/objects/geo.json (генератор: pipeline/geo-objects/validate.py).
 * Точку, которую редакция поставила вручную (источник «вручную»), не трогаем. Объекта нет в базе — пропускаем.
 * npm run seed:geo
 */
import fs from 'node:fs'
import path from 'node:path'
import { initPayload } from './_payload'

const FILE = path.resolve(process.env.CONTENT_DIR ? path.join(process.env.CONTENT_DIR, '..', 'objects', 'geo.json') : '../content/objects/geo.json')
type Geo = { address?: string; lat: number; lng: number; precision?: 'building' | 'street' | 'area'; source?: string }

async function run() {
  const payload = await initPayload()
  const geo = JSON.parse(fs.readFileSync(FILE, 'utf8')) as Record<string, Geo>
  const objs = (await payload.find({ collection: 'objects', limit: 10000, depth: 0, pagination: false, select: { slug: true, lat: true, lng: true, address: true, geoSource: true } })).docs as unknown as {
    id: number; slug: string; lat?: number | null; lng?: number | null; address?: string | null; geoSource?: string | null
  }[]
  let set = 0, same = 0, manual = 0
  for (const o of objs) {
    const g = geo[o.slug]
    if (!g) continue
    if (/вручную/i.test(o.geoSource || '')) { manual++; continue }
    const address = g.address || o.address || undefined
    if (o.lat === g.lat && o.lng === g.lng && o.address === address) { same++; continue }
    await payload.update({ collection: 'objects', id: o.id, data: { lat: g.lat, lng: g.lng, address, geoPrecision: g.precision || 'building', geoSource: g.source } as never })
    set++
  }
  console.log(`Точки объектов: обновлено ${set}, без изменений ${same}, ручных ${manual}, в файле ${Object.keys(geo).length}`)
  process.exit(0)
}
await run()
