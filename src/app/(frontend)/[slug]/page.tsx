import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { RichText } from '../../../components/ui/RichText'
import { findLegacyProduct } from '../../../lib/legacy'
import { getFooterPages, getPage } from '../../../lib/queries'

export const revalidate = 3600

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getFooterPages()).map((p) => ({ slug: p.slug! }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const page = await getPage((await params).slug)
  if (!page) return {}
  return {
    title: page.meta?.title ? { absolute: page.meta.title } : page.title,
    description: page.meta?.description || page.intro || undefined,
    alternates: { canonical: `/${page.slug}` },
  }
}

export default async function StaticPage({ params }: Params) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) {
    const target = await findLegacyProduct(slug)
    if (target) permanentRedirect(`/products/${target}`)
    notFound()
  }
  const others = (await getFooterPages()).filter((p) => p.slug !== page.slug)
  const faqs = page.faqs ?? []

  const faqLd = faqs.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
      }
    : null

  return (
    <div className="container-x pt-12">
      {faqLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, '\\u003c') }} /> : null}
      <div className="grid gap-12 lg:grid-cols-[1fr_260px]">
        <div className="max-w-3xl">
          <h1 className="display text-5xl sm:text-6xl">{page.title}</h1>
          {page.intro ? <p className="mt-4 text-lg text-ink-soft">{page.intro}</p> : null}
          <RichText data={page.content} className="mt-8" />
          {faqs.length ? (
            <div className="mt-10 divide-y divide-line border-y border-line">
              {faqs.map((f) => (
                <details key={f.id ?? f.question} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-semibold transition-colors hover:text-teal-dark [&::-webkit-details-marker]:hidden">
                    {f.question}
                    <Plus className="h-5 w-5 shrink-0 transition-transform duration-300 group-open:rotate-45" />
                  </summary>
                  <p className="animate-fade-up pb-5 whitespace-pre-line text-muted">{f.answer}</p>
                </details>
              ))}
            </div>
          ) : null}
        </div>
        {others.length ? (
          <aside className="lg:pt-4">
            <p className="label">Help</p>
            <ul className="mt-3 space-y-2 text-sm">
              {others.map((p) => (
                <li key={p.id}>
                  <Link href={`/${p.slug}`} className="link-underline">
                    {p.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/contact" className="link-underline">
                  Contact us
                </Link>
              </li>
            </ul>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
