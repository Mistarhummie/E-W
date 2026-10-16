import Image from 'next/image'
import Link from 'next/link'

import { mediaUrl } from '../../lib/media'
import type { Post } from '../../payload-types'

export const POST_CATEGORIES: Record<string, string> = {
  'match-day': 'Match day',
  'new-kits': 'New kits',
  style: 'Style',
  training: 'Training',
  news: 'Store news',
}

export const postDate = (p: Pick<Post, 'publishedAt' | 'createdAt'>) =>
  new Date(p.publishedAt ?? p.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })

export function PostCard({ post, large = false }: { post: Post; large?: boolean }) {
  const cover = mediaUrl(post.cover, large ? 'large' : 'card')
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div className={`relative overflow-hidden rounded-2xl bg-mist ${large ? 'aspect-[16/9]' : 'aspect-[16/10]'}`}>
        {cover ? (
          <Image
            src={cover}
            alt={post.title}
            fill
            priority={large}
            sizes={large ? '(min-width: 1024px) 60vw, 100vw' : '(min-width: 768px) 33vw, 100vw'}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : null}
      </div>
      <p className="mt-4 text-xs font-semibold tracking-wider text-teal-dark uppercase">
        {post.category ? POST_CATEGORIES[post.category] : 'Blog'} · {postDate(post)}
      </p>
      <h2 className={`mt-2 font-bold leading-snug group-hover:text-teal-dark ${large ? 'text-3xl' : 'text-xl'}`}>{post.title}</h2>
      {post.excerpt ? <p className="mt-2 line-clamp-2 text-sm text-muted">{post.excerpt}</p> : null}
    </Link>
  )
}
