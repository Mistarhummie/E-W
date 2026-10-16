'use client'

import { Heart } from 'lucide-react'
import React, { useState } from 'react'

import { cn } from '../../lib/cn'
import { useWishlist } from './WishlistProvider'

export function WishlistHeart({
  item,
  className,
}: {
  item: { id: number | string; slug: string; title: string; image: string | null; price: number }
  className?: string
}) {
  const { has, toggle } = useWishlist()
  const [pop, setPop] = useState(false)
  const active = has(item.id)
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${item.title} from wishlist` : `Save ${item.title} to wishlist`}
      onClick={() => {
        toggle(item)
        setPop(true)
        setTimeout(() => setPop(false), 350)
      }}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-all duration-300 hover:scale-110',
        pop && 'scale-125',
        className,
      )}
    >
      <Heart className={cn('h-[18px] w-[18px] transition-colors', active ? 'fill-sale text-sale' : 'text-ink')} />
    </button>
  )
}
