/**
 * Рассылка «Следить» вручную: npm run digest  (DRY=1 — только посчитать, без отправки; ONLY=<id читателя> — одному).
 * В проде — внешний cron раз в день: GET /akkaunt/rassylka/?key=<DIGEST_KEY>.
 */
import { initPayload } from './_payload'
import { runDigest } from '../lib/digest'

await initPayload()
console.log(await runDigest({ dry: process.env.DRY === '1', only: process.env.ONLY ? +process.env.ONLY : undefined }))
process.exit(0)
