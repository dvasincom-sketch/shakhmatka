import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { buildLinkIndex, resolveLink } from './links'

/** Индекс страниц сайта, один раз на запрос */
export const getLinkIndex = cache(async () => buildLinkIndex(await getPayload({ config })))
export async function getResolver() {
  const index = await getLinkIndex()
  return (href: string) => resolveLink(index, href)
}
