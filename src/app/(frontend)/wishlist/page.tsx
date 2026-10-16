import type { Metadata } from 'next'

import { WishlistGrid } from '../../../components/shop/WishlistGrid'

export const metadata: Metadata = { title: 'Wishlist', robots: { index: false } }

export default function WishlistPage() {
  return (
    <div className="container-x pt-12">
      <h1 className="display text-5xl sm:text-6xl">Wishlist</h1>
      <p className="mt-2 text-muted">Saved on this device. Prices update when you open the product.</p>
      <WishlistGrid />
    </div>
  )
}
