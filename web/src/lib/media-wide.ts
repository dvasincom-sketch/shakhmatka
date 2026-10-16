/**
 * Фото внутри текста статьи пишутся в markdown ссылкой на исходник (/api/media/file/<имя>).
 * Здесь подменяем их на облегчённую копию wide (webp до 1440 px), если она есть.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const RE = /\/api\/media\/file\/([\w.-]+\.(?:jpe?g|png|webp))/g

export async function withWideImages(html: string): Promise<string> {
  const names = [...new Set([...html.matchAll(RE)].map((m) => m[1]))]
  if (!names.length) return html
  const payload = await getPayload({ config })
  const docs = (await payload.find({ collection: 'media', where: { filename: { in: names } }, limit: names.length, depth: 0, pagination: false })).docs as unknown as { filename?: string; sizes?: { wide?: { url?: string | null } } }[]
  const map = new Map(docs.filter((d) => d.filename && d.sizes?.wide?.url).map((d) => [d.filename!, d.sizes!.wide!.url!]))
  return html.replace(RE, (all, name: string) => map.get(name) || all)
}
