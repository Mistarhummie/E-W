'use client'

import { Heart, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { formatKsh } from '../../lib/catalogue'
import { useWishlist } from './WishlistProvider'

export function WishlistGrid() {
  const { items, toggle } = useWishlist()
  if (!items.length)
    return (
      <div className="mt-10 rounded-3xl bg-mist p-10 text-center">
        <Heart className="mx-auto h-10 w-10 text-teal" />
        <p className="mt-4 text-lg font-semibold">Nothing saved yet</p>
        <p className="mt-1 text-sm text-muted">Tap the heart on any product to keep it here.</p>
        <Link href="/shop" className="btn btn-primary mt-6">
          Browse the shop
        </Link>
      </div>
    )
  return (
    <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <article key={item.id} className="group relative animate-fade-up">
          <Link href={`/products/${item.slug}`} className="block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-mist">
              {item.image ? (
                <Image src={item.image} alt={item.title} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
              ) : null}
            </div>
            <h2 className="mt-3 line-clamp-2 text-sm font-semibold group-hover:text-teal-dark">{item.title}</h2>
            <p className="mt-1 text-sm">{formatKsh(item.price)}</p>
          </Link>
          <button
            type="button"
            onClick={() => toggle(item)}
            aria-label={`Remove ${item.title}`}
            className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition-all hover:scale-110 hover:bg-ink hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </article>
      ))}
    </div>
  )
}
