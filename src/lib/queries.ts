import 'server-only'

import { unstable_cache } from 'next/cache'
import type { Where } from 'payload'

import { getPayloadClient } from './payload'

const DAY = 60 * 60 * 24

export const getSettings = unstable_cache(
  async () => (await getPayloadClient()).findGlobal({ slug: 'site-settings', depth: 2 }),
  ['settings'],
  { tags: ['settings'], revalidate: DAY },
)

export const getCategories = unstable_cache(
  async () =>
    (
      await (await getPayloadClient()).find({ collection: 'categories', limit: 200, depth: 1, sort: 'sortOrder' })
    ).docs,
  ['categories'],
  { tags: ['catalogue'], revalidate: DAY },
)

export const getBanners = unstable_cache(
  async (placement: string) => {
    const now = new Date().toISOString()
    const res = await (await getPayloadClient()).find({
      collection: 'banners',
      where: {
        and: [
          { placement: { equals: placement } },
          { active: { equals: true } },
          { or: [{ startsAt: { exists: false } }, { startsAt: { less_than_equal: now } }] },
          { or: [{ endsAt: { exists: false } }, { endsAt: { greater_than: now } }] },
        ],
      },
      sort: 'sortOrder',
      depth: 1,
      limit: 10,
    })
    return res.docs
  },
  ['banners'],
  // Short revalidate so scheduled banners switch on/off close to their time.
  { tags: ['banners'], revalidate: 300 },
)

export type ProductQuery = {
  section?: string
  category?: string
  q?: string
  size?: string
  tag?: string
  gender?: string
  training?: string
  min?: number
  max?: number
  sort?: string
  page?: number
  limit?: number
}

const SORTS: Record<string, string> = {
  new: '-createdAt',
  'price-asc': 'fromPrice',
  'price-desc': '-fromPrice',
  popular: '-soldCount',
}

export const getProducts = unstable_cache(
  async (query: ProductQuery) => {
    const payload = await getPayloadClient()
    const and: Where[] = [{ status: { equals: 'active' } }, { hasImage: { equals: true } }]
    if (query.section) and.push({ section: { equals: query.section } })
    if (query.category) {
      const cats = await payload.find({
        collection: 'categories',
        where: { or: [{ slug: { equals: query.category } }, { 'parent.slug': { equals: query.category } }] },
        limit: 100,
        depth: 0,
      })
      and.push({ category: { in: cats.docs.map((c) => c.id) } })
    }
    if (query.q) {
      const q = query.q.trim()
      and.push({ or: [{ title: { like: q } }, { club: { like: q } }, { season: { like: q } }] })
    }
    if (query.tag) and.push({ tags: { contains: query.tag } })
    if (query.gender) and.push({ gender: { in: [query.gender, 'unisex'] } })
    if (query.training) and.push({ training: { contains: query.training } })
    if (query.size) and.push({ 'inventory.size': { equals: query.size } })
    if (query.min) and.push({ fromPrice: { greater_than_equal: query.min } })
    if (query.max) and.push({ fromPrice: { less_than_equal: query.max } })
    return payload.find({
      collection: 'products',
      where: { and },
      sort: SORTS[query.sort ?? ''] ?? '-featured,-createdAt',
      page: query.page ?? 1,
      limit: query.limit ?? 24,
      depth: 1,
      select: {
        title: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        saleStartsAt: true,
        saleEndsAt: true,
        editions: true,
        images: true,
        club: true,
        season: true,
        tags: true,
        totalStock: true,
        trackStock: true,
        preorder: true,
        customisable: true,
        section: true,
        category: true,
        fromPrice: true,
      },
    })
  },
  ['products'],
  { tags: ['catalogue'], revalidate: DAY },
)

export const getProduct = unstable_cache(
  async (slug: string) => {
    const res = await (await getPayloadClient()).find({
      collection: 'products',
      where: { and: [{ slug: { equals: slug } }, { status: { equals: 'active' } }] },
      depth: 2,
      limit: 1,
    })
    return res.docs[0] ?? null
  },
  ['product'],
  { tags: ['catalogue'], revalidate: DAY },
)

export const getStores = unstable_cache(
  async () =>
    (await (await getPayloadClient()).find({ collection: 'stores', limit: 20, depth: 0, sort: 'createdAt' })).docs,
  ['stores'],
  { tags: ['settings'], revalidate: DAY },
)

export const getZones = unstable_cache(
  async () =>
    (
      await (await getPayloadClient()).find({
        collection: 'delivery-zones',
        where: { active: { equals: true } },
        limit: 50,
        depth: 0,
        sort: 'sortOrder',
      })
    ).docs,
  ['zones'],
  { tags: ['settings'], revalidate: DAY },
)

export const getPosts = unstable_cache(
  async (opts: { limit?: number; page?: number; category?: string } = {}) =>
    (await getPayloadClient()).find({
      collection: 'posts',
      where: {
        and: [
          { _status: { equals: 'published' } },
          ...(opts.category ? [{ category: { equals: opts.category } }] : []),
        ],
      },
      sort: '-publishedAt',
      limit: opts.limit ?? 12,
      page: opts.page ?? 1,
      depth: 1,
    }),
  ['posts'],
  { tags: ['blog'], revalidate: DAY },
)

export const getPost = unstable_cache(
  async (slug: string) => {
    const res = await (await getPayloadClient()).find({
      collection: 'posts',
      where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
      depth: 2,
      limit: 1,
    })
    return res.docs[0] ?? null
  },
  ['post'],
  { tags: ['blog'], revalidate: DAY },
)

export const getPage = unstable_cache(
  async (slug: string) => {
    const res = await (await getPayloadClient()).find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      depth: 1,
      limit: 1,
    })
    return res.docs[0] ?? null
  },
  ['page'],
  { tags: ['pages'], revalidate: DAY },
)

export const getFooterPages = unstable_cache(
  async () =>
    (
      await (await getPayloadClient()).find({
        collection: 'pages',
        where: { showInFooter: { equals: true } },
        limit: 20,
        depth: 0,
        select: { title: true, slug: true },
      })
    ).docs,
  ['footer-pages'],
  { tags: ['pages'], revalidate: DAY },
)
