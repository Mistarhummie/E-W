import type { Metadata } from 'next'
import Link from 'next/link'

import { GymTabs } from '../../../components/home/GymTabs'
import { HeroCarousel, type HeroSlide } from '../../../components/home/HeroCarousel'
import { ProductCard } from '../../../components/shop/ProductCard'
import { ProductRail } from '../../../components/shop/ProductRail'
import { Reveal } from '../../../components/ui/Reveal'
import { SectionHeading } from '../../../components/ui/SectionHeading'
import { TRAINING_TYPES } from '../../../lib/catalogue'
import { mediaRef } from '../../../lib/media'
import { getBanners, getProducts } from '../../../lib/queries'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Gym wear',
  description: 'Leggings, sports bras, shorts, tanks and hoodies for training in Nairobi. Order online and collect in store or get it delivered across Kenya.',
}

export default async function GymPage() {
  const [heroes, newIn, women, men] = await Promise.all([
    getBanners('gym-hero'),
    getProducts({ section: 'gym', sort: 'new', limit: 12 }),
    getProducts({ section: 'gym', gender: 'women', sort: 'popular', limit: 8 }),
    getProducts({ section: 'gym', gender: 'men', sort: 'popular', limit: 8 }),
  ])

  const slides: HeroSlide[] = heroes.length
    ? heroes.map((b) => ({
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
    : [{ id: 'gym', title: 'Built to move', eyebrow: 'EASTWEST GYM', ctaLabel: 'Shop gym wear', ctaLink: '/shop?section=gym', media: null }]

  const rail = (docs: typeof women.docs, who: string) =>
    docs.length ? (
      <ProductRail>
        {docs.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </ProductRail>
    ) : (
      <p className="text-muted">New gym wear for {who} is coming soon.</p>
    )

  return (
    <>
      <HeroCarousel slides={slides} />

      <section className="container-x mt-6 grid gap-4 sm:grid-cols-2">
        {[
          { label: 'Women', href: '/shop?section=gym&gender=women', tone: 'bg-teal' },
          { label: 'Men', href: '/shop?section=gym&gender=men', tone: 'bg-ink' },
        ].map((t, i) => (
          <Reveal key={t.label} delay={i * 80}>
            <Link
              href={t.href}
              className={`group relative flex aspect-[16/9] items-end overflow-hidden rounded-3xl p-6 text-white sm:p-10 ${t.tone}`}
            >
              <span className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 transition-transform duration-700 group-hover:scale-125" />
              <span className="relative">
                <span className="display block text-6xl leading-none sm:text-7xl">{t.label}</span>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold">
                  Shop {t.label.toLowerCase()}
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </section>

      {newIn.docs.length ? (
        <section className="container-x mt-20">
          <SectionHeading eyebrow="Just landed" title="New in gym" href="/shop?section=gym&sort=new" />
          <ProductRail>
            {newIn.docs.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 2} />
            ))}
          </ProductRail>
        </section>
      ) : null}

      <section className="mt-20 bg-mist py-20">
        <div className="container-x">
          <SectionHeading eyebrow="Best sellers" title="Popular right now" href="/shop?section=gym&sort=popular" />
          <GymTabs
            panels={[
              { label: 'Women', content: rail(women.docs, 'women') },
              { label: 'Men', content: rail(men.docs, 'men') },
            ]}
          />
        </div>
      </section>

      <section className="container-x mt-20">
        <h2 className="display mb-6 text-4xl sm:text-5xl">How do you train?</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {TRAINING_TYPES.map((t, i) => (
            <Reveal key={t.value} delay={i * 70}>
              <Link
                href={`/shop?section=gym&training=${t.value}`}
                className="group flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-2xl bg-ink p-4 text-white transition-all duration-500 hover:-translate-y-1 hover:bg-teal"
              >
                <span className="display text-2xl leading-none">{t.label}</span>
                <span className="mt-2 text-xs text-white/70 group-hover:text-white">Shop →</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}
