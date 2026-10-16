import type { Metadata } from 'next'
import Link from 'next/link'

import { POST_CATEGORIES, PostCard } from '../../../components/blog/PostCard'
import { Reveal } from '../../../components/ui/Reveal'
import { cn } from '../../../lib/cn'
import { getPosts } from '../../../lib/queries'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Kit launches, match-day style, training tips and store news from EastWest Fashions, Nairobi.',
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string; page?: string }> }) {
  const { category, page } = await searchParams
  const current = category && POST_CATEGORIES[category] ? category : undefined
  const pageNo = Math.max(1, Number(page) || 1)
  const posts = await getPosts({ category: current, page: pageNo, limit: 13 })
  const [lead, ...rest] = pageNo === 1 ? posts.docs : [undefined, ...posts.docs]
  const href = (p: number) => `/blog?${new URLSearchParams({ ...(current ? { category: current } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`

  return (
    <div className="container-x pt-12">
      <p className="text-xs font-bold tracking-[0.3em] text-teal-dark uppercase">The EastWest blog</p>
      <h1 className="display mt-1 text-5xl sm:text-7xl">Stories & kit news</h1>

      <nav className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Blog categories">
        {[['', 'All'], ...Object.entries(POST_CATEGORIES)].map(([value, label]) => (
          <Link
            key={value}
            href={value ? `/blog?category=${value}` : '/blog'}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
              (current ?? '') === value ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {posts.docs.length ? (
        <>
          {lead ? (
            <Reveal className="mt-10">
              <PostCard post={lead} large />
            </Reveal>
          ) : null}
          <div className="mt-14 grid gap-x-6 gap-y-12 md:grid-cols-3">
            {rest.filter(Boolean).map((post, i) => (
              <Reveal key={post!.id} delay={(i % 3) * 80}>
                <PostCard post={post!} />
              </Reveal>
            ))}
          </div>
          {posts.totalPages > 1 ? (
            <div className="mt-14 flex justify-center gap-3">
              {posts.hasPrevPage ? (
                <Link href={href(pageNo - 1)} className="btn btn-outline px-5 py-2.5">
                  Newer
                </Link>
              ) : null}
              {posts.hasNextPage ? (
                <Link href={href(pageNo + 1)} className="btn btn-primary px-5 py-2.5">
                  Older posts
                </Link>
              ) : null}
            </div>
          ) : null}
        </>
      ) : (
        <p className="mt-10 rounded-2xl bg-mist p-10 text-center text-muted">No posts here yet. Check back soon.</p>
      )}
    </div>
  )
}
