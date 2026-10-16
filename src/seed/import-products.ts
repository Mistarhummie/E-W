/**
 * Import products from a CSV or JSON export of the old eastwest.ke shop.
 *
 *   npm run import:products -- ./products.csv          (add new, update matching)
 *   npm run import:products -- ./products.csv --hidden (import as hidden for review)
 *
 * Columns (CSV header or JSON keys; only title, price and category are required):
 *   title, price, compare_at_price, section (jerseys|gym|kids|accessories), category (name or slug),
 *   club, season, gender (men|women|unisex|kids), description, images (URLs separated by | or ,),
 *   customisable (yes/no), size_group (adult|women|kids|onesize), legacy_url
 *
 * Products are matched on legacy_url, then title, so re-running the import updates instead of duplicating.
 * Products whose images fail to download are imported without photos and stay off the site until one is added.
 */
import fs from 'node:fs/promises'
import path from 'node:path'

import { getPayload, type Payload, type Where } from 'payload'

import config from '../payload.config'
import { slugify } from '../fields/slug'
import type { Product } from '../payload-types'

type Row = Record<string, string>

const hidden = process.argv.includes('--hidden')
const file = process.argv.slice(2).find((a) => /\.(csv|json)$/i.test(a))

/** Small RFC 4180 CSV parser (quoted fields, commas and newlines inside quotes). */
function parseCsv(text: string): Row[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  const [header, ...body] = rows.filter((r) => r.some((v) => v.trim()))
  const keys = header.map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, '_'))
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])))
}

const paragraphs = (s: string) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: s
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => ({
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

const toNumber = (v?: string) => {
  const n = Number(String(v ?? '').replace(/[^\d.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : undefined
}

async function categoryId(payload: Payload, name: string, section: string, cache: Map<string, number>) {
  const slug = slugify(name)
  if (cache.has(slug)) return cache.get(slug)!
  const found = await payload.find({ collection: 'categories', where: { or: [{ slug: { equals: slug } }, { title: { equals: name } }] }, limit: 1, depth: 0 })
  const id =
    found.docs[0]?.id ??
    (await payload.create({ collection: 'categories', overrideAccess: true, data: { title: name, slug, section: section as never } })).id
  cache.set(slug, id)
  return id
}

async function downloadImage(payload: Payload, url: string, alt: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const type = res.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg'
    if (!type.startsWith('image/')) throw new Error(`not an image (${type})`)
    const data = Buffer.from(await res.arrayBuffer())
    const name = path.basename(new URL(url).pathname) || `${slugify(alt)}.jpg`
    const doc = await payload.create({ collection: 'media', overrideAccess: true, data: { alt }, file: { data, mimetype: type, name, size: data.length } })
    return doc.id
  } catch (err) {
    console.warn(`  ! image skipped (${url}): ${(err as Error).message}`)
    return null
  }
}

async function main() {
  if (!file) {
    console.error('Usage: npm run import:products -- ./products.csv [--hidden]')
    process.exit(1)
  }
  const text = await fs.readFile(path.resolve(file), 'utf8')
  const rows: Row[] = file.toLowerCase().endsWith('.json')
    ? (JSON.parse(text) as Record<string, unknown>[]).map((r) =>
        Object.fromEntries(Object.entries(r).map(([k, v]) => [k.toLowerCase().replace(/[\s-]+/g, '_'), Array.isArray(v) ? v.join('|') : String(v ?? '')])),
      )
    : parseCsv(text)

  const payload = await getPayload({ config })
  const cats = new Map<string, number>()
  let created = 0
  let updated = 0
  let failed = 0

  for (const [i, r] of rows.entries()) {
    const title = r.title || r.name
    const price = toNumber(r.price || r.regular_price)
    if (!title || !price || !r.category) {
      console.warn(`Row ${i + 2}: skipped, needs title, price and category`)
      failed++
      continue
    }
    try {
      const section = ['jerseys', 'gym', 'kids', 'accessories'].includes(r.section) ? r.section : 'jerseys'
      const where: Where = r.legacy_url ? { or: [{ legacyUrl: { equals: r.legacy_url } }, { title: { equals: title } }] } : { title: { equals: title } }
      const existing = (await payload.find({ collection: 'products', where, limit: 1, depth: 0, overrideAccess: true })).docs[0]

      const images: number[] = []
      if (!existing?.images?.length) {
        for (const url of (r.images || r.image || '').split(/[|,]\s*/).filter((u) => /^https?:\/\//.test(u)).slice(0, 8)) {
          const id = await downloadImage(payload, url, title)
          if (id) images.push(id)
        }
      }

      const compareAt = toNumber(r.compare_at_price || r.sale_was)
      const sizeGroup = (['adult', 'women', 'kids', 'onesize'].includes(r.size_group) ? r.size_group : section === 'kids' ? 'kids' : 'adult') as Product['sizeGroup']
      const category = await categoryId(payload, r.category, section, cats)
      const data: Partial<Product> = {
        title,
        section: section as Product['section'],
        category,
        club: r.club || undefined,
        season: r.season || undefined,
        gender: (['men', 'women', 'unisex', 'kids'].includes(r.gender) ? r.gender : 'unisex') as Product['gender'],
        shortDescription: r.short_description || undefined,
        description: r.description ? paragraphs(r.description) : undefined,
        price,
        compareAtPrice: compareAt && compareAt > price ? compareAt : null,
        sizeGroup,
        customisable: /^(y|yes|true|1)$/i.test(r.customisable || (section === 'jerseys' ? 'yes' : 'no')),
        trackStock: false,
        legacyUrl: r.legacy_url || undefined,
        ...(images.length ? { images } : {}),
      }

      if (existing) {
        await payload.update({ collection: 'products', id: existing.id, overrideAccess: true, data })
        updated++
      } else {
        await payload.create({
          collection: 'products',
          overrideAccess: true,
          data: { ...data, title, section: section as Product['section'], category, price, sizeGroup, images, status: hidden ? 'hidden' : 'active' },
        })
        created++
      }
      console.log(`${existing ? 'updated' : 'created'}: ${title}${images.length ? ` (${images.length} photos)` : ''}`)
    } catch (err) {
      failed++
      console.warn(`Row ${i + 2} (${title}): ${(err as Error).message}`)
    }
  }

  console.log(`\nDone. ${created} created, ${updated} updated, ${failed} skipped.`)
  process.exit(0)
}

await main()
