/**
 * Loads demo data: stores, delivery zones, leagues, badges, sample products,
 * banners, pages, blog posts and an owner account.
 *
 *   npm run seed            (only fills an empty database)
 *   npm run seed -- --fresh (wipes catalogue content first; never orders or customers)
 */
import { getPayload, type Payload } from 'payload'

import config from '../payload.config'
import type { Product } from '../payload-types'
import { bannerSvg, gymSvg, jerseySvg, type Kit } from './art'
import { syncBadges } from './badges'
import { png } from './upload'

const fresh = process.argv.includes('--fresh')

const text = (s: string) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: s.split('\n\n').map((p) => ({
      type: 'paragraph',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      textFormat: 0,
      children: [{ type: 'text', text: p, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
    })),
  },
})

type Size = NonNullable<Product['inventory']>[number]['size']
type Tag = NonNullable<Product['tags']>[number]

type Jersey = { title: string; club: string; league: string; season: string; kit: Kit; price: number; was?: number; tags?: Tag[] }

const JERSEYS: Jersey[] = [
  { title: 'Arsenal Home 25/26', club: 'Arsenal', league: 'premier-league', season: '25/26', kit: { base: '#DB0007', accent: '#ffffff', trim: '#ffffff', pattern: 'plain' }, price: 2500, tags: ['new', 'trending'] },
  { title: 'Arsenal Away 25/26', club: 'Arsenal', league: 'premier-league', season: '25/26', kit: { base: '#F5E9C9', accent: '#0d2e5c', trim: '#0d2e5c', pattern: 'plain' }, price: 2500, tags: ['new'] },
  { title: 'Manchester United Home 25/26', club: 'Manchester United', league: 'premier-league', season: '25/26', kit: { base: '#C70101', accent: '#000000', trim: '#000000' }, price: 2500, tags: ['new', 'top'] },
  { title: 'Chelsea Home 25/26', club: 'Chelsea', league: 'premier-league', season: '25/26', kit: { base: '#034694', accent: '#ffffff', trim: '#ffffff' }, price: 2500, tags: ['trending'] },
  { title: 'Liverpool Home 25/26', club: 'Liverpool', league: 'premier-league', season: '25/26', kit: { base: '#C8102E', accent: '#F6EB61', trim: '#F6EB61' }, price: 2500, was: 3000, tags: ['deal', 'top'] },
  { title: 'Manchester City Home 25/26', club: 'Manchester City', league: 'premier-league', season: '25/26', kit: { base: '#6CABDD', accent: '#ffffff', trim: '#1c2c5b' }, price: 2500 },
  { title: 'Newcastle Home 25/26', club: 'Newcastle United', league: 'premier-league', season: '25/26', kit: { base: '#ffffff', accent: '#111111', trim: '#111111', pattern: 'stripes' }, price: 2500 },
  { title: 'Real Madrid Home 25/26', club: 'Real Madrid', league: 'la-liga', season: '25/26', kit: { base: '#ffffff', accent: '#FEBE10', trim: '#00529F' }, price: 2500, tags: ['new', 'top'] },
  { title: 'Barcelona Home 25/26', club: 'Barcelona', league: 'la-liga', season: '25/26', kit: { base: '#A50044', accent: '#004D98', trim: '#EDBB00', pattern: 'stripes' }, price: 2500, tags: ['trending'] },
  { title: 'Atletico Madrid Home 25/26', club: 'Atletico Madrid', league: 'la-liga', season: '25/26', kit: { base: '#ffffff', accent: '#CB3524', trim: '#272E61', pattern: 'stripes' }, price: 2300, was: 2800, tags: ['deal'] },
  { title: 'AC Milan Home 25/26', club: 'AC Milan', league: 'serie-a', season: '25/26', kit: { base: '#000000', accent: '#FB090B', trim: '#ffffff', pattern: 'stripes' }, price: 2500 },
  { title: 'Inter Milan Home 25/26', club: 'Inter Milan', league: 'serie-a', season: '25/26', kit: { base: '#000000', accent: '#0068A8', trim: '#ffffff', pattern: 'stripes' }, price: 2500, tags: ['new'] },
  { title: 'Juventus Home 25/26', club: 'Juventus', league: 'serie-a', season: '25/26', kit: { base: '#ffffff', accent: '#000000', trim: '#000000', pattern: 'stripes' }, price: 2300, was: 2800, tags: ['deal'] },
  { title: 'Bayern Munich Home 25/26', club: 'Bayern Munich', league: 'bundesliga', season: '25/26', kit: { base: '#DC052D', accent: '#ffffff', trim: '#ffffff' }, price: 2500, tags: ['top'] },
  { title: 'Borussia Dortmund Home 25/26', club: 'Borussia Dortmund', league: 'bundesliga', season: '25/26', kit: { base: '#FDE100', accent: '#000000', trim: '#000000', pattern: 'chevron' }, price: 2500 },
  { title: 'PSG Home 25/26', club: 'Paris Saint-Germain', league: 'ligue-1', season: '25/26', kit: { base: '#004170', accent: '#DA291C', trim: '#ffffff', pattern: 'halves' }, price: 2500, tags: ['new'] },
  { title: 'Al Nassr Home 25/26', club: 'Al Nassr', league: 'saudi-pro-league', season: '25/26', kit: { base: '#FCD116', accent: '#1E3A8A', trim: '#1E3A8A' }, price: 2500, tags: ['trending'] },
  { title: 'Inter Miami Home 25/26', club: 'Inter Miami', league: 'mls', season: '25/26', kit: { base: '#F7B5CD', accent: '#231F20', trim: '#231F20' }, price: 2500, tags: ['top'] },
  { title: 'Harambee Stars Home 2025', club: 'Kenya', league: 'harambee-stars', season: '2025', kit: { base: '#BB0000', accent: '#006600', trim: '#000000', pattern: 'sash' }, price: 2000, tags: ['top', 'new'] },
  { title: 'Harambee Stars Away 2025', club: 'Kenya', league: 'harambee-stars', season: '2025', kit: { base: '#ffffff', accent: '#006600', trim: '#BB0000', pattern: 'sash' }, price: 2000 },
  { title: 'Argentina Home 2026', club: 'Argentina', league: 'international', season: '2026', kit: { base: '#ffffff', accent: '#75AADB', trim: '#000000', pattern: 'stripes' }, price: 2500, tags: ['new', 'trending'] },
  { title: 'Portugal Home 2026', club: 'Portugal', league: 'international', season: '2026', kit: { base: '#9E1B32', accent: '#006600', trim: '#FFD700' }, price: 2500 },
]

const GYM: { title: string; gender: 'men' | 'women'; kind: Parameters<typeof gymSvg>[1]; colour: string; cat: string; training: string[]; price: number; was?: number; tags?: Tag[] }[] = [
  { title: 'Sculpt Seamless Leggings', gender: 'women', kind: 'leggings', colour: '#02B3AD', cat: 'leggings', training: ['gym', 'yoga'], price: 2200, tags: ['new', 'top'] },
  { title: 'Sculpt Seamless Leggings – Black', gender: 'women', kind: 'leggings', colour: '#151515', cat: 'leggings', training: ['gym', 'hiit'], price: 2200, tags: ['top'] },
  { title: 'Power Sports Bra', gender: 'women', kind: 'bra', colour: '#151515', cat: 'sports-bras', training: ['gym', 'running', 'hiit'], price: 1500, tags: ['new'] },
  { title: 'Flow Training Shorts – Women', gender: 'women', kind: 'shorts', colour: '#8FA7A6', cat: 'shorts', training: ['running', 'hiit'], price: 1400, was: 1800, tags: ['deal'] },
  { title: 'Lift Oversized Tank', gender: 'men', kind: 'tank', colour: '#1a1a1a', cat: 'tops', training: ['gym'], price: 1300, tags: ['top'] },
  { title: 'Lift Oversized Tank – Teal', gender: 'men', kind: 'tank', colour: '#02B3AD', cat: 'tops', training: ['gym', 'hiit'], price: 1300, tags: ['new'] },
  { title: 'Pace 7" Running Shorts', gender: 'men', kind: 'shorts', colour: '#22313a', cat: 'shorts', training: ['running', 'football'], price: 1500 },
  { title: 'Rest Day Hoodie', gender: 'men', kind: 'hoodie', colour: '#2b2b2b', cat: 'hoodies', training: ['gym', 'running'], price: 3200, tags: ['trending'] },
]

async function wipe(payload: Payload) {
  for (const collection of ['products', 'categories', 'badges', 'banners', 'posts', 'pages', 'discount-codes', 'stores', 'delivery-zones', 'media'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } }, overrideAccess: true })
  }
}

async function main() {
  // On Vercel the build runs the seed; it only loads demo content when SEED_DEMO=true.
  if (process.env.VERCEL && process.env.SEED_DEMO !== 'true') {
    console.log('SEED_DEMO is not true; skipping demo content.')
    process.exit(0)
  }
  const payload = await getPayload({ config })
  if (fresh) await wipe(payload)
  const existing = await payload.count({ collection: 'products', overrideAccess: true })
  if (existing.totalDocs > 0) {
    payload.logger.info('Products already exist; skipping seed. Use --fresh to reload demo data.')
    await syncBadges(payload)
    process.exit(0)
  }

  // A previous run that stopped half-way leaves stores and categories behind; clear them first.
  if (!fresh && (await payload.count({ collection: 'stores', overrideAccess: true })).totalDocs > 0) await wipe(payload)

  payload.logger.info('Seeding stores and delivery zones…')
  const store1 = await payload.create({
    collection: 'stores',
    overrideAccess: true,
    data: {
      name: 'EastWest – Sonalux House',
      address: 'Sonalux House, Moi Avenue, Nairobi CBD',
      mapUrl: 'https://maps.google.com/?q=Sonalux+House+Moi+Avenue+Nairobi',
      phone: '+254700011817',
      hours: [
        { days: 'Mon–Sat', time: '8am – 7pm' },
        { days: 'Sunday', time: '10am – 4pm' },
      ],
      isDispatchStore: true,
    },
  })
  await payload.create({
    collection: 'stores',
    overrideAccess: true,
    data: {
      name: 'EastWest Store 2',
      address: 'Address to be confirmed',
      hours: [
        { days: 'Mon–Sat', time: '8am – 7pm' },
        { days: 'Sunday', time: '10am – 4pm' },
      ],
    },
  })
  const zones = [
    ['Nairobi CBD', 'Within the CBD', 200, 'Same or next day'],
    ['Nairobi – inner suburbs', 'Westlands, Kilimani, Upper Hill, South B/C, Parklands, Ngara', 350, 'Next day'],
    ['Nairobi – outer areas', 'Rongai, Kitengela, Ruaka, Kikuyu, Utawala, Ruiru, Syokimau', 500, 'Next day'],
    ['Rest of Kenya (courier)', 'Mombasa, Kisumu, Nakuru, Eldoret and all towns, via courier', 600, '1–3 days'],
  ] as const
  for (const [i, [name, description, fee, eta]] of zones.entries()) {
    await payload.create({ collection: 'delivery-zones', overrideAccess: true, data: { name, description, fee, eta, sortOrder: i } })
  }

  payload.logger.info('Seeding categories…')
  const catDefs = [
    ['Premier League', 'premier-league', 'jerseys', { base: '#3D195B', accent: '#00FF85', pattern: 'sash' }],
    ['La Liga', 'la-liga', 'jerseys', { base: '#FF4B44', accent: '#ffffff', pattern: 'plain' }],
    ['Serie A', 'serie-a', 'jerseys', { base: '#024494', accent: '#00A8E8', pattern: 'stripes' }],
    ['Bundesliga', 'bundesliga', 'jerseys', { base: '#D20515', accent: '#000000', pattern: 'halves' }],
    ['Ligue 1', 'ligue-1', 'jerseys', { base: '#091C3E', accent: '#DAE025', pattern: 'chevron' }],
    ['Saudi Pro League', 'saudi-pro-league', 'jerseys', { base: '#0D6B3C', accent: '#ffffff', pattern: 'plain' }],
    ['MLS', 'mls', 'jerseys', { base: '#001F5B', accent: '#E31837', pattern: 'hoops' }],
    ['Harambee Stars', 'harambee-stars', 'jerseys', { base: '#BB0000', accent: '#006600', pattern: 'sash' }],
    ['International', 'international', 'jerseys', { base: '#75AADB', accent: '#ffffff', pattern: 'stripes' }],
    ['Leggings', 'leggings', 'gym', null],
    ['Shorts', 'shorts', 'gym', null],
    ['Tops & tanks', 'tops', 'gym', null],
    ['Hoodies', 'hoodies', 'gym', null],
    ['Sports bras', 'sports-bras', 'gym', null],
  ] as const
  const cats: Record<string, number> = {}
  for (const [i, [title, slug, section, kit]] of catDefs.entries()) {
    const image = kit ? await png(jerseySvg(kit as Kit), `cat-${slug}`, payload, title) : undefined
    const doc = await payload.create({
      collection: 'categories',
      overrideAccess: true,
      data: { title, slug, section, image, showOnHome: section === 'jerseys' && i < 8, sortOrder: i },
    })
    cats[slug] = doc.id
  }

  payload.logger.info('Seeding products…')
  const adult: Size[] = ['S', 'M', 'L', 'XL', '2XL', '3XL']
  for (const [i, j] of JERSEYS.entries()) {
    const front = await png(jerseySvg(j.kit, { crest: j.club.toUpperCase() }), `${j.club}-${i}-front`, payload, `${j.title} front`)
    const back = await png(jerseySvg(j.kit, { back: true }), `${j.club}-${i}-back`, payload, `${j.title} back`)
    const editions = [
      { name: 'Fan Edition', price: j.price, compareAtPrice: j.was ?? null },
      { name: 'Player Edition', price: j.price + 1000, compareAtPrice: j.was ? j.was + 1000 : null },
    ]
    const inventory = editions.flatMap((e) =>
      adult.map((size, si) => ({ edition: e.name, size, stock: (i + si) % 7 === 0 ? 0 : ((i * 3 + si * 5) % 9) + 1 })),
    )
    await payload.create({
      collection: 'products',
      overrideAccess: true,
      data: {
        title: j.title,
        section: 'jerseys',
        category: cats[j.league],
        club: j.club,
        season: j.season,
        gender: 'unisex',
        shortDescription: `The ${j.club} ${j.season} shirt. Add your name, number and badges, printed overnight in Nairobi.`,
        description: text(
          `Show your colours in the ${j.title}. Fan Edition has a relaxed fit for everyday wear; Player Edition is the slim, lightweight version worn on the pitch.\n\nAdd a printed name and number in League or Team font, plus official sleeve badges, and see it on the shirt before you pay.`,
        ),
        images: [front, back],
        backImage: back,
        price: j.price,
        compareAtPrice: j.was ?? null,
        editions,
        sizeGroup: 'adult',
        trackStock: true,
        inventory,
        customisable: true,
        nameColour: ['#ffffff', '#F5E9C9', '#FDE100', '#FCD116', '#F7B5CD'].includes(j.kit.base) ? '#111111' : '#ffffff',
        tags: j.tags ?? [],
        featured: Boolean(j.tags?.includes('top')),
        status: 'active',
      },
    })
  }

  // Kids jersey (no editions) to show the kids size group.
  {
    const kit: Kit = { base: '#DB0007', accent: '#ffffff', trim: '#ffffff' }
    const front = await png(jerseySvg(kit, { crest: 'ARS' }), 'kids-arsenal', payload, 'Arsenal kids kit')
    await payload.create({
      collection: 'products',
      overrideAccess: true,
      data: {
        title: 'Arsenal Kids Home Kit 25/26',
        section: 'kids',
        category: cats['premier-league'],
        club: 'Arsenal',
        season: '25/26',
        gender: 'kids',
        shortDescription: 'Shirt and shorts set for young Gunners.',
        images: [front],
        price: 2000,
        sizeGroup: 'kids',
        trackStock: true,
        inventory: (['4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'] as Size[]).map((size, i) => ({ size, stock: i + 2 })),
        customisable: true,
        tags: ['new'],
        status: 'active',
      },
    })
  }

  await syncBadges(payload)

  for (const [i, g] of GYM.entries()) {
    const img = await png(gymSvg(g.colour, g.kind), `gym-${i}`, payload, g.title)
    const sizes: Size[] = g.gender === 'women' ? ['XS', 'S', 'M', 'L', 'XL'] : adult
    await payload.create({
      collection: 'products',
      overrideAccess: true,
      data: {
        title: g.title,
        section: 'gym',
        category: cats[g.cat],
        gender: g.gender,
        training: g.training as never,
        shortDescription: 'Sweat-wicking, squat-proof and built to move.',
        description: text('Four-way stretch fabric that moves with you, dries fast and keeps its shape wash after wash.'),
        images: [img],
        price: g.price,
        compareAtPrice: g.was ?? null,
        sizeGroup: g.gender === 'women' ? 'women' : 'adult',
        trackStock: true,
        inventory: sizes.map((size, si) => ({ size, stock: ((i + si) % 6) + 1 })),
        tags: g.tags ?? [],
        status: 'active',
      },
    })
  }

  payload.logger.info('Seeding banners…')
  const heroDefs = [
    { title: 'New season. New kits.', eyebrow: '25/26 KITS ARE HERE', subtitle: 'Premier League, La Liga, Serie A and more. Add your name and number tonight.', ctaLabel: 'Shop jerseys', ctaLink: '/shop?section=jerseys', art: bannerSvg({ from: '#0b0b0c', to: '#014f4c', kit: { base: '#DB0007', accent: '#ffffff', trim: '#ffffff' }, words: 'KITS' }) },
    { title: 'Train like you mean it', eyebrow: 'GYM WEAR', subtitle: 'Leggings, shorts and tanks built for Nairobi heat.', ctaLabel: 'Shop gym wear', ctaLink: '/gym', art: bannerSvg({ from: '#02B3AD', to: '#0b0b0c', words: 'TRAIN' }) },
    { title: 'Harambee Stars', eyebrow: 'SUPPORT KENYA', subtitle: 'The 2025 home and away shirts, with your name on the back.', ctaLabel: 'Shop Harambee Stars', ctaLink: '/shop?category=harambee-stars', art: bannerSvg({ from: '#1a0000', to: '#004d00', kit: { base: '#BB0000', accent: '#006600', trim: '#000000', pattern: 'sash' }, words: 'KENYA' }) },
  ]
  for (const [i, h] of heroDefs.entries()) {
    const media = await png(h.art, `hero-${i}`, payload, h.title)
    await payload.create({
      collection: 'banners',
      overrideAccess: true,
      data: { title: h.title, eyebrow: h.eyebrow, subtitle: h.subtitle, ctaLabel: h.ctaLabel, ctaLink: h.ctaLink, placement: 'home-hero', media, sortOrder: i, textTone: 'light' },
    })
  }
  const promoDefs = [
    { title: 'Retro classics', eyebrow: 'THROWBACK', ctaLink: '/shop?q=retro', art: bannerSvg({ from: '#2d1b4e', to: '#0b0b0c', kit: { base: '#ffffff', accent: '#000000', pattern: 'stripes' }, words: 'RETRO' }) },
    { title: 'Kids kits', eyebrow: 'MINI FANS', ctaLink: '/shop?section=kids', art: bannerSvg({ from: '#02B3AD', to: '#015955', kit: { base: '#DB0007', accent: '#ffffff' }, words: 'KIDS' }) },
  ]
  for (const [i, p] of promoDefs.entries()) {
    const media = await png(p.art, `promo-${i}`, payload, p.title)
    await payload.create({ collection: 'banners', overrideAccess: true, data: { ...p, art: undefined, placement: 'home-promo', media, sortOrder: i } as never })
  }
  {
    const media = await png(bannerSvg({ from: '#0b0b0c', to: '#02B3AD', words: 'MOVE' }), 'gym-hero', payload, 'Gym wear')
    await payload.create({
      collection: 'banners',
      overrideAccess: true,
      data: { title: 'Built to move', eyebrow: 'EASTWEST GYM', subtitle: 'Seamless leggings, sports bras, shorts and tanks.', ctaLabel: 'Shop new in', ctaLink: '/shop?section=gym&tag=new', placement: 'gym-hero', media },
    })
  }

  payload.logger.info('Seeding pages, posts and settings…')
  const pages = [
    ['About us', 'about', 'EastWest Fashions Ke sells football jerseys and gym wear from our stores in Nairobi CBD. We print names, numbers and badges in-house every night, so your shirt is ready the next day.'],
    ['Delivery', 'delivery', 'Collect free from either of our Nairobi stores, or choose delivery at checkout. Delivery prices depend on your area and are shown before you pay. Orders over KSH 10,000 ship free.\n\nCustomised shirts are printed overnight. If you pay before 6pm, your shirt is printed that night.'],
    ['Returns & exchanges', 'returns', 'You can return or exchange unworn items with tags within 7 days. Shirts printed with a name, number or badge cannot be returned unless we made a mistake, so please check your spelling before you pay.'],
    ['Size guide', 'size-guide', 'Fan Edition shirts have a regular fit. Player Edition shirts fit slimmer, so consider one size up if you are between sizes.'],
    ['Terms of use', 'terms', 'These terms will be provided by EastWest Fashions Ke before launch.'],
    ['Privacy policy', 'privacy', 'We collect your name, phone number, email and delivery address to process your orders. We only send you offers if you agree to it, and you can ask us to download or delete your data at any time by contacting us. We follow the Kenya Data Protection Act, 2019.'],
  ] as const
  for (const [title, slug, body] of pages) {
    await payload.create({ collection: 'pages', overrideAccess: true, data: { title, slug, content: text(body) } })
  }
  await payload.create({
    collection: 'pages',
    overrideAccess: true,
    data: {
      title: 'FAQ',
      slug: 'faq',
      faqs: [
        { question: 'How long does printing take?', answer: 'Orders paid before 6pm are printed the same night and ready the next day.' },
        { question: 'How do I pay?', answer: 'With M-Pesa (you get a prompt on your phone) or with a Visa or Mastercard card.' },
        { question: 'Can I collect my order?', answer: 'Yes. Pick a store at checkout and we will SMS a pickup code when your order is ready.' },
        { question: 'Do you deliver outside Nairobi?', answer: 'Yes, anywhere in Kenya by courier. The price is shown at checkout.' },
      ],
    },
  })

  const blogArt = [
    bannerSvg({ from: '#0b0b0c', to: '#3D195B', kit: { base: '#DB0007', accent: '#fff' }, words: 'KITS' }),
    bannerSvg({ from: '#02B3AD', to: '#0b0b0c', words: 'GYM' }),
    bannerSvg({ from: '#1a0000', to: '#004d00', kit: { base: '#BB0000', accent: '#006600', pattern: 'sash' }, words: 'STARS' }),
  ]
  const posts = [
    ['Every 25/26 Premier League home kit, ranked', 'new-kits', 'We lined up every new Premier League home shirt in store and ranked them from worst to best.'],
    ['5 leg-day essentials for Nairobi gyms', 'training', 'What to wear for squats, deadlifts and everything in between when the gym is 28 degrees.'],
    ['How to style your Harambee Stars shirt', 'style', 'Match day or weekend: three easy ways to wear the national colours.'],
  ] as const
  for (const [i, [title, category, excerpt]] of posts.entries()) {
    const cover = await png(blogArt[i], `blog-${i}`, payload, title)
    await payload.create({
      collection: 'posts',
      overrideAccess: true,
      data: { title, category, excerpt, cover, content: text(`${excerpt}\n\nThis is a sample post. Replace it from the admin under Content → Blog posts.`), _status: 'published', publishedAt: new Date(Date.now() - i * 86400000 * 3).toISOString() },
    })
  }

  const dealProducts = await payload.find({ collection: 'products', where: { tags: { contains: 'deal' } }, limit: 3, overrideAccess: true })
  await payload.updateGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    data: {
      announcements: [
        { text: 'Free delivery on orders over KSH 10,000', link: '/delivery' },
        { text: 'Pay before 6pm and your shirt is printed tonight', link: '/shop?section=jerseys' },
        { text: 'Order online, collect at Sonalux House, Moi Avenue', link: '/contact' },
      ],
      deal: { label: 'Deal of the week', products: dealProducts.docs.map((p) => p.id), endsAt: new Date(Date.now() + 5 * 86400000).toISOString() },
      freeDeliveryOver: 10000,
      namePrice: 200,
      numberPrice: 200,
      printCutoff: '18:00',
      phone: '+254700011817',
      whatsapp: '254700011817',
      email: 'eastwefa20@gmail.com',
    },
  })

  await payload.create({ collection: 'discount-codes', overrideAccess: true, data: { code: 'KARIBU10', type: 'percent', value: 10, description: '10% off your first order', onePerCustomer: true, active: true } })
  await payload.create({ collection: 'discount-codes', overrideAccess: true, data: { code: 'FREEPRINT', type: 'freePrinting', description: 'Free name & number printing', active: true, minOrder: 3000 } })

  // The owner login is only created when both are set (never a default password).
  // Otherwise the first account made at /admin becomes the owner.
  const ownerEmail = process.env.SEED_OWNER_EMAIL
  const ownerPassword = process.env.SEED_OWNER_PASSWORD
  const owners = await payload.count({ collection: 'users', where: { role: { equals: 'owner' } }, overrideAccess: true })
  if (!owners.totalDocs && ownerEmail && ownerPassword) {
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { email: ownerEmail, password: ownerPassword, name: 'EastWest Owner', role: 'owner', store: store1.id },
    })
    payload.logger.info(`Owner account created: ${ownerEmail}`)
  } else if (!owners.totalDocs) {
    payload.logger.info('No owner yet: open /admin and create the first account, which becomes the owner.')
  }

  payload.logger.info('Seed complete.')
  process.exit(0)
}

try {
  await main()
} catch (err) {
  console.error(err)
  process.exit(1)
}
