import type { Metadata } from 'next'
import Link from 'next/link'

import { ProductCard } from '../../../components/shop/ProductCard'
import { ShopFilters } from '../../../components/shop/ShopFilters'
import { Reveal } from '../../../components/ui/Reveal'
import { SECTIONS, SIZE_GROUPS } from '../../../lib/catalogue'
import { getCategories, getProducts } from '../../../lib/queries'

type Search = Record<string, string | undefined>

const titleFor = (sp: Search, categoryTitle?: string) => {
  if (sp.q) return `Results for “${sp.q}”`
  if (categoryTitle) return categoryTitle
  if (sp.tag === 'deal') return 'Deals'
  if (sp.tag === 'new') return 'New in'
  if (sp.section && sp.section in SECTIONS) return SECTIONS[sp.section as keyof typeof SECTIONS]
  return 'Shop all'
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }): Promise<Metadata> {
  const sp = await searchParams
  const cats = await getCategories()
  const cat = cats.find((c) => c.slug === sp.category)
  return { title: titleFor(sp, cat?.title), description: cat?.description ?? undefined }
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const [cats, result] = await Promise.all([
    getCategories(),
    getProducts({
      section: sp.section,
      category: sp.category,
      q: sp.q?.slice(0, 60),
      size: sp.size,
      tag: sp.tag,
      gender: sp.gender,
      training: sp.training,
      max: sp.max ? Number(sp.max) : undefined,
      sort: sp.sort,
      page,
    }),
  ])
  const cat = cats.find((c) => c.slug === sp.category)
  const section = sp.section ?? cat?.section
  const filterCats = cats
    .filter((c) => !c.parent && (!section || c.section === section))
    .map((c) => ({ label: c.title, value: c.slug ?? '' }))
  const sizes = section === 'kids' ? [...SIZE_GROUPS.kids] : section === 'gym' ? ['XS', 'S', 'M', 'L', 'XL', '2XL'] : [...SIZE_GROUPS.adult]

  const pageHref = (n: number) => {
    const next = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][])
    next.set('page', String(n))
    return `/shop?${next.toString()}`
  }

  return (
    <div className="container-x pt-10">
      <nav className="mb-3 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link> / <Link href="/shop" className="hover:text-ink">Shop</Link>
        {cat ? <> / <span className="text-ink">{cat.title}</span></> : null}
      </nav>
      <h1 className="display animate-fade-up text-5xl leading-none sm:text-7xl">{titleFor(sp, cat?.title)}</h1>
      {cat?.description ? <p className="mt-3 max-w-2xl text-muted">{cat.description}</p> : null}

      <div className="mt-8">
        <ShopFilters categories={filterCats} sizes={sizes} total={result.totalDocs}>
          {result.docs.length ? (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
              {result.docs.map((p, i) => (
                <Reveal as="li" key={p.id} delay={(i % 4) * 60}>
                  <ProductCard product={p} priority={i < 4} />
                </Reveal>
              ))}
            </ul>
          ) : (
            <div className="rounded-3xl bg-mist p-12 text-center">
              <p className="display text-3xl">Nothing here yet</p>
              <p className="mt-2 text-muted">Try another filter, or search for your club.</p>
              <Link href="/shop" className="btn btn-primary mt-6">Clear filters</Link>
            </div>
          )}
          {result.totalPages > 1 ? (
            <nav className="mt-12 flex justify-center gap-2" aria-label="Pages">
              {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={pageHref(n)} aria-current={n === page ? 'page' : undefined} className="chip aria-[current=page]:bg-ink aria-[current=page]:text-white">
                  {n}
                </Link>
              ))}
            </nav>
          ) : null}
        </ShopFilters>
      </div>
    </div>
  )
}
