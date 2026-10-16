import { ArrowUpRight, PackageCheck, Printer, ShieldCheck, Store, Truck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { GymTabs } from '../../components/home/GymTabs'
import { HeroCarousel, type HeroSlide } from '../../components/home/HeroCarousel'
import { ProductCard } from '../../components/shop/ProductCard'
import { ProductRail } from '../../components/shop/ProductRail'
import { ShirtPreview } from '../../components/shop/ShirtPreview'
import { Countdown } from '../../components/ui/Countdown'
import { Reveal } from '../../components/ui/Reveal'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { TRAINING_TYPES } from '../../lib/catalogue'
import { mediaRef, mediaUrl } from '../../lib/media'
import { getBanners, getCategories, getPosts, getProducts, getSettings } from '../../lib/queries'
import type { Product } from '../../payload-types'

export const revalidate = 300

export default async function HomePage() {
  const [heroes, promos, settings, categories, newIn, top, womenGym, menGym, posts] = await Promise.all([
    getBanners('home-hero'),
    getBanners('home-promo'),
    getSettings(),
    getCategories(),
    getProducts({ tag: 'new', limit: 12, sort: 'new' }),
    getProducts({ section: 'jerseys', sort: 'popular', limit: 12 }),
    getProducts({ section: 'gym', gender: 'women', sort: 'popular', limit: 8 }),
    getProducts({ section: 'gym', gender: 'men', sort: 'popular', limit: 8 }),
    getPosts({ limit: 3 }),
  ])

  const slides: HeroSlide[] = heroes.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    eyebrow: b.eyebrow,
    ctaLabel: b.ctaLabel,
    ctaLink: b.ctaLink,
    textTone: b.textTone,
    media: mediaRef(b.media),
    mobileMedia: mediaRef(b.mobileMedia),
  }))

  const leagueTiles = categories.filter((c) => c.showOnHome).slice(0, 8)
  const deal = settings.deal
  const dealProducts = (deal?.products ?? []).filter((p): p is Product => typeof p === 'object' && p?.status === 'active')
  const dealLive = deal?.endsAt && new Date(deal.endsAt) > new Date() && dealProducts.length > 0

  return (
    <>
      {slides.length ? (
        <HeroCarousel slides={slides} />
      ) : (
        <HeroCarousel
          slides={[
            {
              id: 'default',
              eyebrow: 'NEW SEASON KITS',
              title: 'Wear your club',
              subtitle: 'Order online, add your name and number, and collect at our Nairobi stores.',
              ctaLabel: 'Shop jerseys',
              ctaLink: '/shop?section=jerseys',
              media: null,
            },
          ]}
        />
      )}

      {/* Trust strip */}
      <section className="border-b border-line bg-white">
        <div className="no-scrollbar flex overflow-hidden py-4">
          <div className="flex shrink-0 animate-marquee items-center gap-12 pr-12 hover:[animation-play-state:paused]">
            {[0, 1].map((k) => (
              <div key={k} className="flex shrink-0 items-center gap-12" aria-hidden={k === 1}>
                {[
                  [Printer, 'Name & number printed overnight'],
                  [Store, 'Collect from our Nairobi stores'],
                  [Truck, `Free delivery over KSH ${(settings.freeDeliveryOver ?? 10000).toLocaleString('en-KE')}`],
                  [ShieldCheck, 'Pay securely with M-Pesa or card'],
                  [PackageCheck, 'Delivery anywhere in Kenya'],
                ].map(([Icon, text]) => {
                  const I = Icon as typeof Printer
                  return (
                    <span key={text as string} className="flex shrink-0 items-center gap-2.5 text-sm font-semibold whitespace-nowrap">
                      <I className="h-5 w-5 text-teal" /> {text as string}
                    </span>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deal countdown */}
      {dealLive ? (
        <section className="container-x mt-16">
          <Reveal className="overflow-hidden rounded-3xl bg-deal">
            <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_2fr] lg:items-center">
              <div>
                <p className="text-xs font-bold tracking-[0.3em] uppercase">Limited time</p>
                <h2 className="display mt-2 text-5xl leading-none sm:text-6xl">{deal?.label || 'Deal of the week'}</h2>
                <Countdown to={deal!.endsAt!} className="mt-6" />
                <Link href="/shop?tag=deal" className="btn btn-primary mt-6">
                  See all deals
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {dealProducts.slice(0, 3).map((p, i) => (
                  <ProductCard key={p.id} product={p} className={i === 2 ? 'hidden sm:block' : undefined} />
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      ) : null}

      {/* Shop by league */}
      {leagueTiles.length ? (
        <section className="container-x mt-20">
          <SectionHeading eyebrow="Find your club" title="Shop by league" href="/shop?section=jerseys" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {leagueTiles.map((c, i) => (
              <Reveal key={c.id} delay={i * 60}>
                <Link href={`/shop?category=${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-ink">
                  {mediaUrl(c.image, 'card') ? (
                    <Image
                      src={mediaUrl(c.image, 'card')!}
                      alt={c.title}
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-cover opacity-80 transition-all duration-700 ease-out-expo group-hover:scale-110 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-teal to-ink" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-white sm:p-5">
                    <span className="display text-2xl leading-none sm:text-3xl">{c.title}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink transition-all duration-500 group-hover:rotate-45 group-hover:bg-teal group-hover:text-white">
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* New in */}
      {newIn.docs.length ? (
        <section className="container-x mt-20">
          <SectionHeading eyebrow="Just landed" title="New in" href="/shop?tag=new" />
          <ProductRail>
            {newIn.docs.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 2} />
            ))}
          </ProductRail>
        </section>
      ) : null}

      {/* Customise callout */}
      <section className="container-x mt-24">
        <Reveal className="grid overflow-hidden rounded-3xl bg-ink text-white lg:grid-cols-2">
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            <p className="text-xs font-bold tracking-[0.3em] text-teal uppercase">Make it yours</p>
            <h2 className="display mt-3 text-5xl leading-[0.9] sm:text-7xl">
              Your name.
              <br />
              <span className="text-teal">Your number.</span>
            </h2>
            <p className="mt-5 max-w-md text-white/70">
              Add a printed name and number for KSH {settings.namePrice ?? 200} each, choose League or Team font for free, and add official badges. See it on the shirt
              before you pay. Printed overnight and ready for pickup the next day.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop?section=jerseys" className="btn btn-teal px-8 py-4">
                Customise a jersey
              </Link>
            </div>
          </div>
          <div className="relative p-6 sm:p-10">
            <div className="mx-auto max-w-sm rotate-2 transition-transform duration-700 hover:rotate-0">
              <ShirtPreview name="ONYANGO" number="7" shirtColour="#02B3AD" colour="#0b0b0c" badges={['Premier League']} />
            </div>
          </div>
        </Reveal>
      </section>

      {/* Top sellers */}
      {top.docs.length ? (
        <section className="container-x mt-24">
          <SectionHeading eyebrow="Fans' favourites" title="Top sellers" href="/shop?section=jerseys&sort=popular" />
          <ProductRail>
            {top.docs.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductRail>
        </section>
      ) : null}

      {/* Promo tiles from admin */}
      {promos.length ? (
        <section className="container-x mt-24 grid gap-4 md:grid-cols-2">
          {promos.slice(0, 2).map((b, i) => {
            const m = mediaRef(b.media, 'large')
            return (
              <Reveal key={b.id} delay={i * 100}>
                <Link href={b.ctaLink || '/shop'} className="group relative block aspect-[4/3] overflow-hidden rounded-3xl bg-ink text-white">
                  {m?.type === 'video' ? (
                    <video src={m.url} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                  ) : m ? (
                    <Image src={m.url} alt={m.alt ?? b.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 p-6 sm:p-8">
                    {b.eyebrow ? <p className="text-xs font-bold tracking-[0.3em] text-teal">{b.eyebrow}</p> : null}
                    <p className="display mt-1 text-4xl">{b.title}</p>
                    <span className="mt-3 inline-block text-sm font-semibold underline-offset-4 group-hover:underline">{b.ctaLabel || 'Shop now'} →</span>
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </section>
      ) : null}

      {/* Gym section, Gymshark style */}
      <section className="mt-24 bg-mist py-20">
        <div className="container-x">
          <SectionHeading eyebrow="Gym wear" title="Popular right now" href="/gym" linkLabel="Shop gym wear" />
          <GymTabs
            panels={[
              {
                label: 'Women',
                content: womenGym.docs.length ? (
                  <ProductRail>
                    {womenGym.docs.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </ProductRail>
                ) : (
                  <p className="text-muted">New gym wear for women is coming soon.</p>
                ),
              },
              {
                label: 'Men',
                content: menGym.docs.length ? (
                  <ProductRail>
                    {menGym.docs.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </ProductRail>
                ) : (
                  <p className="text-muted">New gym wear for men is coming soon.</p>
                ),
              },
            ]}
          />
          <h3 className="display mt-20 mb-6 text-3xl sm:text-4xl">How do you train?</h3>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0">
            {TRAINING_TYPES.map((t, i) => (
              <Reveal key={t.value} delay={i * 70} className="w-[42%] shrink-0 sm:w-auto">
                <Link
                  href={`/shop?section=gym&training=${t.value}`}
                  className="group flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-2xl bg-ink p-4 text-white transition-all duration-500 hover:-translate-y-1 hover:bg-teal"
                >
                  <span className="display text-2xl leading-none">{t.label}</span>
                  <span className="mt-2 text-xs text-white/70 transition-all group-hover:text-white">Shop →</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Click & collect */}
      <section className="container-x mt-24">
        <Reveal className="relative overflow-hidden rounded-3xl bg-teal p-8 text-white sm:p-14">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -right-10 -bottom-32 h-80 w-80 rounded-full bg-ink/10" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold tracking-[0.3em] uppercase">Skip the queue</p>
            <h2 className="display mt-2 text-5xl leading-[0.9] sm:text-6xl">Order online, collect in store</h2>
            <p className="mt-4 text-white/85">
              Pay with M-Pesa, pick a store, and we&apos;ll SMS a pickup code when your order is ready. Customised shirts are printed overnight.
            </p>
            <Link href="/contact" className="btn btn-primary mt-8">
              Find our stores
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Blog */}
      {posts.docs.length ? (
        <section className="container-x mt-24">
          <SectionHeading eyebrow="The EastWest blog" title="Stories & kit news" href="/blog" linkLabel="Read the blog" />
          <div className="grid gap-6 md:grid-cols-3">
            {posts.docs.map((post, i) => (
              <Reveal key={post.id} delay={i * 80}>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-mist">
                    {mediaUrl(post.cover, 'card') ? (
                      <Image src={mediaUrl(post.cover, 'card')!} alt={post.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : null}
                  </div>
                  <h3 className="mt-4 text-xl font-bold leading-snug group-hover:text-teal-dark">{post.title}</h3>
                  {post.excerpt ? <p className="mt-2 line-clamp-2 text-sm text-muted">{post.excerpt}</p> : null}
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}
