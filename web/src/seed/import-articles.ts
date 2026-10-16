/**
 * Импорт статей из content/articles (markdown + YAML-frontmatter) в Payload.
 * Запуск: npm run seed   (папка задаётся CONTENT_DIR, по умолчанию ../content/articles)
 * Повторный запуск обновляет записи по slug, дубликатов не создаёт.
 */
import { initPayload } from './_payload'
import { sourcePath } from './_source'
import matter from 'gray-matter'
import fs from 'fs'
import path from 'path'

const STAGE_HINTS: Record<string, string> = {
  'danilovskiy-ot-granel': 'sales',
  silika: 'sales',
  'severnyy-port': 'sales',
  'bolshaya-ordynka-25': 'concept',
  'status-na-zaozernoy': 'sales',
}
const DEV_ROLES_LINKED = new Set(['main', 'previous', 'partner'])

const iso = (v: unknown) => (v ? new Date(String(v instanceof Date ? v.toISOString() : v)).toISOString() : undefined)

async function run() {
  const payload = await initPayload()
  const dir = path.resolve(process.cwd(), process.env.CONTENT_DIR || '../content/articles')
  const files = fs.readdirSync(dir).filter((f) => /^(\d+|(signaly|obzor|rayon|arhitektory|arhitektura|interer)-\d{4}-\d{2})-.+\.md$/.test(f)).sort()
  payload.logger.info(`Импорт из ${dir}: ${files.length} файлов`)

  const upsert = async (collection: 'developers' | 'objects' | 'articles', slug: string, data: Record<string, unknown>): Promise<{ id: number | string }> => {
    const found = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, draft: true })
    if (found.docs[0]) return (await payload.update({ collection, id: found.docs[0].id, data, draft: false } as never)) as unknown as { id: number | string }
    return (await payload.create({ collection, data: { ...data, slug }, draft: false } as never)) as { id: number | string }
  }

  const media = async (file: string, alt: string, caption?: string, credit?: string) => {
    const filename = path.basename(file)
    const found = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1 })
    if (found.docs[0]) return payload.update({ collection: 'media', id: found.docs[0].id, data: { alt, caption, credit } })
    const filePath = await sourcePath(dir, file)
    if (!filePath) { payload.logger.warn(`нет файла ${file} (ни в content/articles, ни в incoming/ бакета)`); return null }
    return payload.create({ collection: 'media', data: { alt, caption, credit }, filePath })
  }

  const failed: string[] = []
  for (const f of files) {
    const { data: fm, content } = matter(fs.readFileSync(path.join(dir, f), 'utf8'))
    if (fm.status === 'skip') {
      // статью сняли после фактчекинга — если она уже была в базе, убираем
      const was = fm.slug ? (await payload.find({ collection: 'articles', where: { slug: { equals: fm.slug } }, limit: 1, depth: 0 })).docs[0] : undefined
      if (was) { await payload.delete({ collection: 'articles', id: was.id }); payload.logger.info(`снята ${fm.slug}: ${fm.skip_reason}`) }
      else payload.logger.info(`пропуск ${f}: ${fm.skip_reason}`)
      continue
    }

    const devIds: (number | string)[] = []
    let mainDev: number | string | undefined
    const prevDevs: (number | string)[] = []
    // застройщики и объекты: существующие не перезаписываем (досье ведутся отдельно), только создаём недостающие
    const ensure = async (collection: 'developers' | 'objects', slug: string, data: Record<string, unknown>) => {
      const found = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0 })
      if (found.docs[0]) return found.docs[0] as { id: number | string }
      return (await payload.create({ collection, data: { ...data, slug } } as never)) as { id: number | string }
    }
    for (const d of fm.developers || []) {
      const doc = await ensure('developers', d.id, { name: d.name })
      if (DEV_ROLES_LINKED.has(d.role)) devIds.push(doc.id)
      if (d.role === 'main') mainDev = doc.id
      if (d.role === 'previous') prevDevs.push(doc.id)
    }

    const objIds: (number | string)[] = []
    for (const o of fm.objects || []) {
      const names: string[] = o.names || [o.id]
      const doc = await ensure('objects', o.id, {
        name: names[0],
        aliases: names.slice(1).map((value) => ({ value })),
        zu: o.zu,
        region: fm.region,
        district: (fm.districts || [])[0],
        stage: STAGE_HINTS[o.id],
        developer: mainDev,
        previousDevelopers: prevDevs,
      })
      objIds.push(doc.id)
    }

    const imgs = []
    const imgIsDoc: boolean[] = []
    const DOC = /скан|документ|приложени|постановлени|протокол|выписк|схем|границ|карт[аеуы]\b|ГПЗУ|таблиц|чертёж|чертеж|план участ|параметр/i
    for (const im of fm.images || []) {
      const m = await media(im.file, im.alt || im.caption || 'Иллюстрация', im.caption, im.credit)
      if (m) { imgs.push(m.id); imgIsDoc.push(DOC.test(`${im.alt || ''} ${im.caption || ''}`)) }
    }

    let schema: unknown = undefined
    try { schema = typeof fm.schema === 'string' ? JSON.parse(fm.schema) : fm.schema } catch { payload.logger.warn(`битый JSON-LD в ${f}`) }
    // микроразметку сверяем с текстом: заголовок, описание и FAQ берём из шапки (их правят чаще, чем schema)
    if (schema && typeof schema === 'object') {
      const nodes = ((schema as { '@graph'?: Record<string, unknown>[] })['@graph'] || [schema]) as Record<string, unknown>[]
      for (const n of nodes) {
        if (/Article/.test(String(n['@type']))) { n.headline = fm.title; if (fm.seo?.description || fm.lead) n.description = fm.seo?.description || fm.lead }
        if (n['@type'] === 'FAQPage' && Array.isArray(fm.faq) && fm.faq.length) {
          n.mainEntity = fm.faq.map((x: { q: string; a: string }) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } }))
        }
      }
    }

    try { await upsert('articles', fm.slug, {
      title: fm.title,
      lead: fm.lead,
      body: content.trim(),
      // обложка — первая картинка, которая не скан документа и не схема; иначе карточка без фото
      heroImage: imgIsDoc.length ? imgs[imgIsDoc.findIndex((d) => !d)] : imgs[0],
      images: imgs,
      type: fm.type,
      region: fm.region,
      objects: objIds,
      developers: devIds,
      topics: [...(fm.topics || []), ...(fm.places || []).map((p: string) => `rayon-${p}`)].map((value: string) => ({ value })), // places: материалы серии о районе
      sourceNoteId: fm.source?.id,
      metaTitle: fm.seo?.title,
      metaDescription: fm.seo?.description,
      mainQuery: fm.seo?.main_query,
      keywords: (fm.seo?.keywords || []).map((value: string) => ({ value })),
      faq: (fm.faq || []).map((x: { q: string; a: string }) => ({ q: x.q, a: x.a })),
      schema,
      reviewStatus: fm.status === 'ready' ? 'ready' : 'needs_review',
      factcheck: (fm.factcheck || []).map((c: Record<string, string>) => ({ claim: c.claim, status: ['confirmed', 'changed', 'refuted', 'unverified'].includes(c.status) ? c.status : 'unverified', source: String(c.source || ''), note: c.note })),
      removed: (fm.removed || []).map((value: string) => ({ value: String(value) })),
      editorNotes: fm.editor_notes,
      // дата публикации = дата исходной заметки; дата обновления = дата проверки фактов
      datePublished: iso(fm.date_published || fm.source?.date),
      dateModified: iso(fm.date_modified),
      author: fm.author || 'Редакция Шахматки',
      _status: 'published',
    })
    payload.logger.info(`✓ ${fm.slug}`)
    } catch (e) {
      // одна битая статья не должна останавливать импорт остальных
      failed.push(f); payload.logger.error(`✗ ${f}: ${String((e as Error)?.message || e).slice(0, 300)}`)
    }
  }
  if (failed.length) payload.logger.warn(`не импортированы (${failed.length}): ${failed.join(', ')}`)
  process.exit(0)
}

await run().catch((e) => { console.error(e); process.exit(1) })
