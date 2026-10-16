import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://eastwest.ke').replace(/\/$/, '')
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/account', '/checkout', '/orders', '/login', '/register', '/wishlist'] }],
    sitemap: `${site}/sitemap.xml`,
  }
}
