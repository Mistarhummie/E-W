import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { POST_CATEGORIES, PostCard, postDate } from '../../../../components/blog/PostCard'
import { RichText } from '../../../../components/ui/RichText'
import { mediaUrl } from '../../../../lib/media'
import { getPost, getPosts } from '../../../../lib/queries'

export const revalidate = 3600

export async function generateStaticParams() {
  const posts = await getPosts({ limit: 50 })
  return posts.docs.map((p) => ({ slug: p.slug! }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getPost((await params).slug)
  if (!post) return {}
  const cover = mediaUrl(post.cover, 'large')
  return {
    title: post.meta?.title ? { absolute: post.meta.title } : post.title,
    description: post.meta?.description || post.excerpt || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: 'article', title: post.title, description: post.excerpt ?? undefined, images: cover ? [cover] : undefined },
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug)
  if (!post) notFound()
  const [more] = await Promise.all([getPosts({ limit: 4 })])
  const related = more.docs.filter((p) => p.id !== post.id).slice(0, 3)
  const cover = mediaUrl(post.cover, 'hero')
  const author = typeof post.author === 'object' && post.author ? post.author.name : null
  const site = process.env.NEXT_PUBLIC_SITE_URL || ''

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    image: cover ? `${site}${cover}` : undefined,
    author: { '@type': 'Organization', name: 'EastWest Fashions' },
  }

  return (
    <article className="pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <header className="container-x max-w-3xl text-center">
        <Link href={post.category ? `/blog?category=${post.category}` : '/blog'} className="text-xs font-bold tracking-[0.3em] text-teal-dark uppercase hover:text-ink">
          {post.category ? POST_CATEGORIES[post.category] : 'Blog'}
        </Link>
        <h1 className="display mt-3 text-5xl leading-[0.95] sm:text-6xl">{post.title}</h1>
        <p className="mt-4 text-sm text-muted">
          {postDate(post)}
          {author ? ` · ${author}` : ''}
        </p>
      </header>
      {cover ? (
        <div className="container-x mt-10">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-mist animate-fade-up">
            <Image src={cover} alt={post.title} fill priority sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
          </div>
        </div>
      ) : null}
      <div className="container-x mt-12 max-w-3xl">
        <RichText data={post.content} />
        {post.tags?.length ? (
          <div className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span key={t} className="rounded-full bg-mist px-3 py-1 text-xs font-semibold">
                #{t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {related.length ? (
        <section className="container-x mt-24">
          <h2 className="display mb-8 text-4xl">Keep reading</h2>
          <div className="grid gap-x-6 gap-y-12 md:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  )
}
