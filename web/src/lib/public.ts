import type { Where } from 'payload'

/** PUBLIC_ONLY_READY=1 — на публичном сайте видны только статьи, прошедшие сверку (reviewStatus = ready). */
export const ONLY_READY = process.env.PUBLIC_ONLY_READY === '1'

export function pub(where?: Where): Where | undefined {
  if (!ONLY_READY) return where
  const ready: Where = { reviewStatus: { equals: 'ready' } }
  return where ? { and: [where, ready] } : ready
}
