import { Store, Truck, Undo2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ProductCard } from '../../../../components/shop/ProductCard'
import { ProductConfigurator, type ConfigProduct } from '../../../../components/shop/ProductConfigurator'
import { ProductGallery } from '../../../../components/shop/ProductGallery'
import { ProductRail } from '../../../../components/shop/ProductRail'
import { RichText } from '../../../../components/ui/RichText'
import { SectionHeading } from '../../../../components/ui/SectionHeading'
import { SIZE_GROUPS } from '../../../../lib/catalogue'
import { mediaUrl } from '../../../../lib/media'
import { percentOff, unitPriceFor, wasPriceFor } from '../../../../lib/pricing'
import { getProduct, getProducts, getSettings } from '../../../../lib/queries'
import type { Badge, Category, Media, Product } from '../../../../payload-types'

type Params = { params: Promise<{ slug: string }> }

// Product pages are cached and refreshed when a product, price or stock changes in the admin.
export const revalidate = 3600

export async function generateStaticParams() {
  const top = await getProducts({ sort: 'popular', limit: 48 })
  return top.docs.map((p) => ({ slug: p.slug! }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return {}
  const image = mediaUrl(product.images?.[0], 'large')
  const meta = (product as Product & { meta?: { title?: string; description?: string } }).meta
  return {
    title: meta?.title ? { absolute: meta.title } : product.title,
    description: meta?.description || product.shortDescription || undefined,
    openGraph: { images: image ? [image] : undefined },
    alternates: { canonical: `/products/${product.slug}` },
  }
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params
  const [product, settings] = await Promise.all([getProduct(slug), getSettings()])
  if (!product || !product.hasImage) notFound()

  const category = typeof product.category === 'object' ? (product.category as Category) : null
  const images = (product.images ?? [])
    .filter((m): m is Media => typeof m === 'object')
    .map((m) => ({ src: mediaUrl(m, 'large')!, thumb: mediaUrl(m, 'thumb')!, alt: m.alt ?? product.title }))

  const config: ConfigProduct = {
    id: product.id,
    slug: product.slug ?? slug,
    title: product.title,
    image: mediaUrl(product.images?.[0], 'thumb'),
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    saleStartsAt: product.saleStartsAt,
    saleEndsAt: product.saleEndsAt,
    editions: (product.editions ?? []).map((e) => ({ name: e.name, price: e.price, compareAtPrice: e.compareAtPrice })),
    sizes: [...SIZE_GROUPS[(product.sizeGroup ?? 'adult') as keyof typeof SIZE_GROUPS]],
    trackStock: Boolean(product.trackStock),
    stock: (product.inventory ?? []).map((r) => ({ edition: r.edition || null, size: r.size, stock: r.stock ?? 0 })),
    preorder: Boolean(product.preorder),
    shipsBy: product.shipsBy,
    customisable: Boolean(product.customisable),
    badges: (product.badges ?? [])
      .filter((b): b is Badge => typeof b === 'object' && Boolean(b.active))
      .map((b) => ({ id: b.id, name: b.name, price: b.price, group: b.group })),
    namePrice: settings.namePrice ?? 200,
    numberPrice: settings.numberPrice ?? 200,
    backImage: mediaUrl(product.backImage, 'large'),
    nameColour: product.nameColour || '#ffffff',
  }

  const related = (product.related ?? []).filter((p): p is Product => typeof p === 'object' && p.status === 'active')
  const more =
    related.length >= 4
      ? related
      : (await getProducts({ category: category?.slug ?? undefined, limit: 9 })).docs.filter((p) => p.id !== product.id).slice(0, 8)

  const price = unitPriceFor(product)
  const off = percentOff(price, wasPriceFor(product))
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eastwest.ke'
  const totalStock = product.trackStock ? (product.totalStock ?? 0) : 1
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: images.map((i) => `${siteUrl}${i.src}`),
    description: product.shortDescription,
    brand: product.club ? { '@type': 'Brand', name: product.club } : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'KES',
      price,
      availability: totalStock > 0 || product.preorder ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${siteUrl}/products/${product.slug}`,
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="container-x pt-6 lg:pt-10">
        <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-ink">Home</Link> / <Link href="/shop" className="hover:text-ink">Shop</Link>
          {category ? <> / <Link href={`/shop?category=${category.slug}`} className="hover:text-ink">{category.title}</Link></> : null}
        </nav>
        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <ProductGallery
            images={images}
            title={product.title}
            badge={off ? <span className="absolute top-4 left-4 rounded-full bg-sale px-3 py-1.5 text-xs font-bold text-white">-{off}%</span> : null}
          />
          <div className="animate-fade-up">
            {product.club ? <p className="text-xs font-bold tracking-[0.25em] text-teal-dark uppercase">{product.club}</p> : null}
            <h1 className="display mt-2 text-4xl leading-[0.95] sm:text-5xl">{product.title}</h1>
            {product.shortDescription ? <p className="mt-3 text-muted">{product.shortDescription}</p> : null}
            <div className="mt-6">
              <ProductConfigurator product={config} />
            </div>

            <ul className="mt-8 grid gap-3 rounded-2xl bg-mist p-5 text-sm">
              <li className="flex gap-3">
                <Store className="h-5 w-5 shrink-0 text-teal" />
                <span>
                  <strong>Collect free</strong> from our Nairobi stores. We SMS you when it&apos;s ready.
                </span>
              </li>
              <li className="flex gap-3">
                <Truck className="h-5 w-5 shrink-0 text-teal" />
                <span>
                  <strong>Delivery anywhere in Kenya</strong>, free over KSH {(settings.freeDeliveryOver ?? 10000).toLocaleString('en-KE')}.
                </span>
              </li>
              <li className="flex gap-3">
                <Undo2 className="h-5 w-5 shrink-0 text-teal" />
                <span>
                  {settings.returnDays ?? 7}-day returns on unprinted items. <Link href="/returns" className="underline">Returns policy</Link>
                </span>
              </li>
            </ul>

            {product.description ? (
              <details className="group mt-6 border-t border-line pt-5" open>
                <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-bold">
                  Description <span className="text-2xl transition-transform group-open:rotate-45">+</span>
                </summary>
                <RichText data={product.description} className="mt-3 text-[15px]" />
              </details>
            ) : null}
          </div>
        </div>
      </div>

      {more.length ? (
        <section className="container-x mt-24">
          <SectionHeading title="You may also like" eyebrow="Complete the look" />
          <ProductRail>
            {more.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductRail>
        </section>
      ) : null}
    </>
  )
}
