/**
 * Полная пересборка поискового индекса Meilisearch (если задан MEILI_HOST).
 * npm run search:index — запускается при старте контейнера после импорта.
 */
import { initPayload } from './_payload'
import { reindexAll, searchEnabled, MEILI_HOST, INDEX } from '../lib/search'

async function run() {
  if (!searchEnabled()) { console.log('поиск: MEILI_HOST не задан — индекс не собираю, сайт ищет по базе'); process.exit(0) }
  const payload = await initPayload()
  const t = Date.now()
  const n = await reindexAll(payload)
  console.log(`✓ поиск: индекс «${INDEX}» на ${MEILI_HOST} — ${n} документов за ${Math.round((Date.now() - t) / 1000)} с`)
  process.exit(0)
}
await run()
