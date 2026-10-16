/**
 * Price maths shared by the product page (preview) and checkout (authoritative).
 * Client-safe: no server imports.
 */

export type PricedProduct = {
  price: number
  compareAtPrice?: number | null
  saleStartsAt?: string | null
  saleEndsAt?: string | null
  editions?: { name: string; price: number; compareAtPrice?: number | null }[] | null
}

export type PrintChoice = {
  name?: string
  number?: string
  font?: string
  badgeIds?: (number | string)[]
}

export type PrintPrices = { namePrice: number; numberPrice: number }

export function unitPriceFor(product: PricedProduct, edition?: string | null) {
  const ed = edition ? product.editions?.find((e) => e.name === edition) : undefined
  return ed ? ed.price : product.price
}

export function wasPriceFor(product: PricedProduct, edition?: string | null, now = new Date()) {
  const ed = edition ? product.editions?.find((e) => e.name === edition) : undefined
  const was = ed ? ed.compareAtPrice : product.compareAtPrice
  const price = unitPriceFor(product, edition)
  if (!was || was <= price) return null
  if (product.saleStartsAt && new Date(product.saleStartsAt) > now) return null
  if (product.saleEndsAt && new Date(product.saleEndsAt) < now) return null
  return was
}

export const percentOff = (price: number, was: number | null) =>
  was && was > price ? Math.round(((was - price) / was) * 100) : 0

export function printPriceFor(
  print: PrintChoice | undefined,
  prices: PrintPrices,
  badges: { id: number | string; price: number }[],
) {
  if (!print) return 0
  let total = 0
  if (print.name?.trim()) total += prices.namePrice
  if (print.number?.trim()) total += prices.numberPrice
  for (const id of print.badgeIds ?? []) {
    const badge = badges.find((b) => String(b.id) === String(id))
    if (badge) total += badge.price
  }
  return total
}
