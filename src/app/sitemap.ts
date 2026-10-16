import type { MetadataRoute } from 'next'

import { getPayloadClient } from '../lib/payload'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://eastwest.ke').replace(/\/$/, '')
  const payload = await getPayloadClient()
  const [products, posts, pages, categories] = await Promise.all([
    payload.find({ collection: 'products', where: { and: [{ status: { equals: 'active' } }, { hasImage: { equals: true } }] }, limit: 5000, depth: 0, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: 'posts', where: { _status: { equals: 'published' } }, limit: 1000, depth: 0, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: 'pages', limit: 100, depth: 0, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: 'categories', limit: 200, depth: 0, select: { slug: true, updatedAt: true } }),
  ])
  return [
    { url: `${site}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${site}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${site}/gym`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${site}/blog`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${site}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    ...categories.docs.map((c) => ({ url: `${site}/shop?category=${c.slug}`, lastModified: c.updatedAt, priority: 0.7 })),
    ...products.docs.map((p) => ({ url: `${site}/products/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
    ...posts.docs.map((p) => ({ url: `${site}/blog/${p.slug}`, lastModified: p.updatedAt, priority: 0.5 })),
    ...pages.docs.map((p) => ({ url: `${site}/${p.slug}`, lastModified: p.updatedAt, priority: 0.3 })),
  ]
}
