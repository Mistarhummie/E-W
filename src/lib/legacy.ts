import 'server-only'

import { getPayloadClient } from './payload'

/** Find the new product page for an old eastwest.ke address, so old links and Google results keep working. */
export async function findLegacyProduct(path: string) {
  const clean = '/' + path.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+|\/+$/g, '')
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'products',
    where: { or: [{ legacyUrl: { equals: clean } }, { legacyUrl: { equals: `${clean}/` } }, { legacyUrl: { like: `eastwest.ke${clean}` } }] },
    limit: 1,
    depth: 0,
    select: { slug: true },
  })
  return res.docs[0]?.slug ?? null
}
