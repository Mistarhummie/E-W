import Image from 'next/image'
import Link from 'next/link'

import type { Product } from '../../payload-types'
import { cn } from '../../lib/cn'
import { mediaUrl } from '../../lib/media'
import { percentOff, unitPriceFor, wasPriceFor } from '../../lib/pricing'
import { Price } from '../ui/Price'
import { WishlistHeart } from './WishlistHeart'

type CardProduct = Pick<
  Product,
  'id' | 'title' | 'slug' | 'price' | 'compareAtPrice' | 'saleStartsAt' | 'saleEndsAt' | 'editions' | 'images' | 'club' | 'season' | 'tags' | 'totalStock' | 'trackStock' | 'preorder' | 'customisable'
>

export function ProductCard({ product, priority = false, className }: { product: CardProduct; priority?: boolean; className?: string }) {
  const images = (product.images ?? []).filter((m) => typeof m === 'object')
  const main = mediaUrl(images[0], 'card')
  const alt = mediaUrl(images[1], 'card')
  const price = unitPriceFor(product)
  const was = wasPriceFor(product)
  const off = percentOff(price, was)
  const soldOut = product.trackStock && (product.totalStock ?? 0) <= 0 && !product.preorder
  const isNew = product.tags?.includes('new')

  return (
    <article className={cn('group relative', className)}>
      <Link href={`/products/${product.slug}`} className="block" aria-label={product.title}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-mist">
          {main ? (
            <Image
              src={main}
              alt={product.title}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
              className={cn(
                'object-cover transition-all duration-700 ease-out-expo group-hover:scale-[1.06]',
                alt && 'group-hover:opacity-0',
                soldOut && 'opacity-60',
              )}
            />
          ) : null}
          {alt ? (
            <Image
              src={alt}
              alt=""
              fill
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
              className="scale-[1.06] object-cover opacity-0 transition-all duration-700 ease-out-expo group-hover:scale-100 group-hover:opacity-100"
            />
          ) : null}

          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {off ? <span className="rounded-full bg-sale px-2.5 py-1 text-[11px] font-bold text-white">-{off}%</span> : null}
            {isNew ? <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold">NEW</span> : null}
            {soldOut ? <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-white">SOLD OUT</span> : null}
          </div>

          {product.customisable ? (
            <span className="absolute inset-x-3 bottom-3 translate-y-3 rounded-full bg-white/95 py-2 text-center text-xs font-semibold opacity-0 shadow-sm backdrop-blur transition-all duration-500 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100">
              Add your name & number
            </span>
          ) : null}
        </div>
        <div className="mt-3 px-0.5">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug transition-colors group-hover:text-teal-dark">{product.title}</h3>
          {product.club || product.season ? <p className="mt-0.5 text-xs text-muted">{[product.club, product.season].filter(Boolean).join(' · ')}</p> : null}
          <Price price={price} was={was} className="mt-1.5" />
        </div>
      </Link>
      <WishlistHeart
        item={{ id: product.id, slug: product.slug ?? '', title: product.title, image: mediaUrl(images[0], 'thumb'), price }}
        className="absolute top-3 right-3"
      />
    </article>
  )
}
