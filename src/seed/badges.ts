/**
 * The sleeve badge library. Each badge is linked to the leagues whose jerseys can carry it;
 * champions badges are linked to the winning club's products instead (2025/26 season).
 * The pictures are placeholders: upload the real badge photos in Admin → Badges.
 */
import type { Payload } from 'payload'

import { badgeSvg } from './art'
import { png } from './upload'

const EUROPE = ['premier-league', 'la-liga', 'serie-a', 'bundesliga', 'ligue-1']

type Def = {
  name: string
  group: 'league' | 'competition' | 'extra'
  price: number
  leagues?: string[]
  clubs?: string[]
  art: [label: string, colour: string, ink?: string, gold?: boolean]
}

export const BADGE_LIBRARY: Def[] = [
  { name: 'Premier League Badge', group: 'league', price: 100, leagues: ['premier-league'], art: ['PL', '#3D195B', '#00FF85'] },
  { name: 'Premier League Champions Badge', group: 'league', price: 150, clubs: ['Liverpool'], art: ['PL', '#3D195B', '#C9A227', true] },
  { name: 'La Liga Badge', group: 'league', price: 100, leagues: ['la-liga'], art: ['LL', '#FF4B44'] },
  { name: 'La Liga Champions Badge', group: 'league', price: 150, clubs: ['Barcelona'], art: ['LL', '#FF4B44', '#ffffff', true] },
  { name: 'Serie A Badge', group: 'league', price: 100, leagues: ['serie-a'], art: ['A', '#024494'] },
  { name: 'Serie A Scudetto Badge', group: 'league', price: 150, clubs: ['Napoli'], art: ['A', '#009246', '#ffffff', true] },
  { name: 'Bundesliga Badge', group: 'league', price: 100, leagues: ['bundesliga'], art: ['BL', '#D20515'] },
  { name: 'Bundesliga Champions Badge', group: 'league', price: 150, clubs: ['Bayern Munich'], art: ['BL', '#D20515', '#ffffff', true] },
  { name: 'Ligue 1 Badge', group: 'league', price: 100, leagues: ['ligue-1'], art: ['L1', '#091C3E', '#DAE025'] },
  { name: 'Ligue 1 Champions Badge', group: 'league', price: 150, clubs: ['Paris Saint-Germain'], art: ['L1', '#091C3E', '#ffffff', true] },
  { name: 'Saudi Pro League Badge', group: 'league', price: 100, leagues: ['saudi-pro-league'], art: ['SPL', '#0D6B3C'] },
  { name: 'MLS Badge', group: 'league', price: 100, leagues: ['mls'], art: ['MLS', '#001F5B'] },
  { name: 'Champions League Badge with Foundation', group: 'competition', price: 200, leagues: EUROPE, art: ['UCL', '#0A1E5A'] },
  { name: 'Champions League Title Holders Badge', group: 'competition', price: 250, clubs: ['Paris Saint-Germain'], art: ['UCL', '#0A1E5A', '#ffffff', true] },
  { name: 'Europa League Badge with Foundation', group: 'competition', price: 200, leagues: EUROPE, art: ['UEL', '#F68E1E', '#111111'] },
  { name: 'Conference League Badge', group: 'competition', price: 150, leagues: EUROPE, art: ['UECL', '#00BE14', '#111111'] },
  { name: 'Club World Champions Badge', group: 'competition', price: 200, clubs: ['Chelsea'], art: ['FIFA', '#326295', '#ffffff', true] },
  { name: 'Africa Cup of Nations Badge', group: 'competition', price: 150, leagues: ['harambee-stars'], art: ['AFCON', '#00843D', '#FCD116'] },
  { name: 'FIFA World Cup 26 Badge', group: 'competition', price: 150, leagues: ['international'], art: ['WC26', '#111111'] },
  { name: 'No Room for Racism Badge', group: 'extra', price: 100, leagues: ['premier-league'], art: ['NRFR', '#111111'] },
]

/** Names used by earlier versions of the seed. */
const RENAMED: Record<string, string> = { 'Club World Cup Badge': 'Club World Champions Badge' }

/**
 * Brings the badges up to the library: creates missing ones, links them to their leagues,
 * and adds champions badges to the winning clubs' jerseys. Runs once: it stops as soon as
 * any badge is linked to a league, so later admin edits are never overwritten.
 */
export async function syncBadges(payload: Payload) {
  const linked = await payload.count({ collection: 'badges', where: { leagues: { exists: true } }, overrideAccess: true })
  if (linked.totalDocs > 0) {
    payload.logger.info('Badges are already linked to leagues; leaving them as they are.')
    return
  }
  payload.logger.info('Setting up the badge library…')
  const cats = await payload.find({ collection: 'categories', where: { section: { equals: 'jerseys' } }, limit: 200, depth: 0, overrideAccess: true })
  const catId = new Map(cats.docs.map((c) => [c.slug, c.id]))
  const existing = await payload.find({ collection: 'badges', limit: 500, depth: 0, overrideAccess: true })

  for (const [i, def] of BADGE_LIBRARY.entries()) {
    const leagues = (def.leagues ?? []).map((s) => catId.get(s)).filter((id): id is number => typeof id === 'number')
    const old = existing.docs.find((b) => b.name === def.name || RENAMED[b.name] === def.name)
    const image = old?.image ?? (await png(badgeSvg(...def.art), `badge-${i}`, payload, def.name))
    const data = { name: def.name, group: def.group, leagues, image, sortOrder: i }
    const badge = old
      ? await payload.update({ collection: 'badges', id: old.id, data, overrideAccess: true })
      : await payload.create({ collection: 'badges', data: { ...data, price: def.price, active: true }, overrideAccess: true })

    for (const club of def.clubs ?? []) {
      const products = await payload.find({ collection: 'products', where: { club: { equals: club } }, limit: 100, depth: 0, overrideAccess: true })
      for (const p of products.docs) {
        const ids = (p.badges ?? []).map((b) => (typeof b === 'object' ? b.id : b))
        if (!ids.includes(badge.id)) await payload.update({ collection: 'products', id: p.id, data: { badges: [...ids, badge.id] }, overrideAccess: true })
      }
    }
  }
}
