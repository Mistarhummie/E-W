import { notFound, permanentRedirect } from 'next/navigation'

import { findLegacyProduct } from '../../../../lib/legacy'

// Old eastwest.ke product links (e.g. /product/arsenal-home-kit) redirect to the new product page.
export default async function LegacyPath({ params }: { params: Promise<{ slug: string; rest: string[] }> }) {
  const { slug, rest } = await params
  const target = await findLegacyProduct([slug, ...rest].join('/'))
  if (target) permanentRedirect(`/products/${target}`)
  notFound()
}
