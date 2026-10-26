import type { Payload } from 'payload'

import type { Badge, Product } from '../payload-types'

const idOf = (v: unknown) => (v && typeof v === 'object' ? (v as { id: number }).id : (v as number | null | undefined))

/**
 * The badges a customer can pick on a product: every active badge linked to the
 * jersey's league (or its parent league), plus the product's own extra badges.
 * Used by the product page and again by checkout, so prices can't be tampered with.
 */
export async function badgesForProduct(payload: Payload, product: Product): Promise<Badge[]> {
  if (!product.customisable) return []
  const found = new Map<number, Badge>()
  for (const b of product.badges ?? []) {
    if (typeof b === 'object' && b?.active) found.set(b.id, b)
  }
  const extraIds = (product.badges ?? []).map(idOf).filter((id): id is number => typeof id === 'number' && !found.has(id))
  if (extraIds.length) {
    const extra = await payload.find({ collection: 'badges', where: { id: { in: extraIds }, active: { equals: true } }, depth: 1, limit: 100 })
    for (const b of extra.docs) found.set(b.id, b)
  }

  if (product.leagueBadges !== false && product.category) {
    const category = product.category
    const leagueIds = [idOf(category), typeof category === 'object' ? idOf(category.parent) : null].filter((id): id is number => typeof id === 'number')
    if (typeof category !== 'object') {
      const cat = await payload.findByID({ collection: 'categories', id: category, depth: 0 }).catch(() => null)
      if (typeof cat?.parent === 'number') leagueIds.push(cat.parent)
    }
    const league = await payload.find({
      collection: 'badges',
      where: { and: [{ active: { equals: true } }, { leagues: { in: leagueIds } }] },
      depth: 1,
      limit: 100,
    })
    for (const b of league.docs) found.set(b.id, b)
  }

  const order = { league: 0, competition: 1, extra: 2 } as const
  return [...found.values()].sort((a, b) => order[a.group] - order[b.group] || (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

/** Keeps one badge each from the league and competition groups, and any number of campaign badges. */
export function pickBadges<T extends { group: Badge['group'] }>(chosen: T[]): T[] {
  const seen = new Set<string>()
  return chosen.filter((b) => {
    if (b.group === 'extra') return true
    if (seen.has(b.group)) return false
    seen.add(b.group)
    return true
  })
}
