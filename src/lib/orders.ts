import 'server-only'

import crypto from 'node:crypto'
import type { Payload } from 'payload'

import type { Badge, Category, Order, Product } from '../payload-types'
import { cleanPrintName, cleanPrintNumber, FONTS, NAME_PATTERN, NUMBER_PATTERN, SIZE_GROUPS } from './catalogue'
import { bestAutomatic, evaluateDiscount, findCode, type DiscountLine, type DiscountResult } from './discounts'
import { normalisePhone } from './phone'
import { printPriceFor, unitPriceFor } from './pricing'

export type CartLineInput = {
  productId: number | string
  edition?: string | null
  size: string
  quantity: number
  print?: { name?: string; number?: string; font?: string; badgeIds?: (number | string)[] } | null
}

export type QuoteInput = {
  lines: CartLineInput[]
  code?: string | null
  fulfilment: { method: 'pickup' | 'delivery'; storeId?: number | string | null; zoneId?: number | string | null }
  customerId?: number | string | null
  phone?: string
}

export type QuotedLine = {
  product: Product
  title: string
  edition: string | null
  size: string
  quantity: number
  unitPrice: number
  printPrice: number
  lineTotal: number
  print: { name: string; number: string; font: string; badges: string } | null
  needsPrinting: boolean
  preorder: boolean
}

export type Quote = {
  lines: QuotedLine[]
  subtotal: number
  deliveryFee: number
  discount: (DiscountResult & { ok: true }) | null
  codeError: string | null
  total: number
  errors: string[]
}

const idOf = (v: unknown) => (v && typeof v === 'object' && 'id' in v ? (v as { id: number | string }).id : v)

export function stockFor(product: Product, edition: string | null, size: string) {
  if (!product.trackStock) return Infinity
  const row = product.inventory?.find((r) => r.size === size && (r.edition || null) === (edition || null))
  // Stock rows without an edition apply to every edition.
  const any = product.inventory?.find((r) => r.size === size && !r.edition)
  return Math.max(0, row?.stock ?? any?.stock ?? 0)
}

/** Re-prices the cart from the database. Never trusts prices sent by the browser. */
export async function quote(payload: Payload, input: QuoteInput): Promise<Quote> {
  const errors: string[] = []
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  const ids = [...new Set(input.lines.map((l) => l.productId))]
  const products = ids.length
    ? (
        await payload.find({
          collection: 'products',
          where: { and: [{ id: { in: ids } }, { status: { equals: 'active' } }] },
          depth: 1,
          limit: ids.length,
          overrideAccess: true,
        })
      ).docs
    : []

  const lines: QuotedLine[] = []
  for (const input_ of input.lines.slice(0, 50)) {
    const product = products.find((p) => String(p.id) === String(input_.productId))
    if (!product) {
      errors.push('An item in your cart is no longer available.')
      continue
    }
    const quantity = Math.max(1, Math.min(20, Math.floor(Number(input_.quantity) || 1)))
    const edition = product.editions?.length
      ? (product.editions.find((e) => e.name === input_.edition)?.name ?? product.editions[0].name)
      : null
    const sizes: readonly string[] = SIZE_GROUPS[(product.sizeGroup ?? 'adult') as keyof typeof SIZE_GROUPS]
    if (!sizes.includes(input_.size)) {
      errors.push(`Choose a size for ${product.title}.`)
      continue
    }
    const inStock = stockFor(product, edition, input_.size)
    const preorder = inStock < quantity
    if (preorder && !product.preorder) {
      errors.push(
        inStock > 0
          ? `Only ${inStock} left of ${product.title} (${input_.size}).`
          : `${product.title} (${input_.size}) is sold out.`,
      )
      continue
    }

    let print: QuotedLine['print'] = null
    let printPrice = 0
    if (product.customisable && input_.print) {
      const name = cleanPrintName(input_.print.name ?? '').trim()
      const number = cleanPrintNumber(input_.print.number ?? '')
      if (name && !NAME_PATTERN.test(name)) errors.push(`The name on ${product.title} can only use letters.`)
      if (number && !NUMBER_PATTERN.test(number)) errors.push(`The number on ${product.title} must be 0–99.`)
      const allowed = (product.badges ?? []).filter((b): b is Badge => typeof b === 'object' && Boolean(b?.active))
      const chosen = allowed.filter((b) => (input_.print?.badgeIds ?? []).map(String).includes(String(b.id)))
      // One badge per group (league / competition).
      const byGroup = new Map<string, Badge>()
      for (const b of chosen) if (!byGroup.has(b.group)) byGroup.set(b.group, b)
      const badges = [...byGroup.values()]
      const font = FONTS.some((f) => f.value === input_.print?.font) ? input_.print!.font! : 'league'
      if (name || number || badges.length) {
        printPrice = printPriceFor(
          { name, number, badgeIds: badges.map((b) => b.id) },
          { namePrice: settings.namePrice ?? 200, numberPrice: settings.numberPrice ?? 200 },
          badges.map((b) => ({ id: b.id, price: b.price })),
        )
        print = { name, number, font: name || number ? font : '', badges: badges.map((b) => b.name).join(', ') }
      }
    }

    const unitPrice = unitPriceFor(product, edition)
    lines.push({
      product,
      title: product.title,
      edition,
      size: input_.size,
      quantity,
      unitPrice,
      printPrice,
      lineTotal: (unitPrice + printPrice) * quantity,
      print,
      needsPrinting: Boolean(print && (print.name || print.number || print.badges)),
      preorder,
    })
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0)

  let deliveryFee = 0
  if (input.fulfilment.method === 'delivery') {
    if (!input.fulfilment.zoneId) errors.push('Choose a delivery area.')
    else {
      const zone = await payload
        .findByID({ collection: 'delivery-zones', id: input.fulfilment.zoneId, depth: 0, overrideAccess: true })
        .catch(() => null)
      if (!zone || !zone.active) errors.push('Choose a delivery area.')
      else deliveryFee = subtotal >= (settings.freeDeliveryOver ?? Infinity) ? 0 : zone.fee
    }
  } else if (!input.fulfilment.storeId) {
    errors.push('Choose a pickup store.')
  }

  const discountLines: DiscountLine[] = lines.map((l) => ({
    productId: l.product.id,
    categoryId: idOf(l.product.category) as number,
    unitPrice: l.unitPrice,
    printPrice: l.printPrice,
    quantity: l.quantity,
  }))
  const ctx = {
    lines: discountLines,
    subtotal,
    deliveryFee,
    customerId: input.customerId,
    phone: input.phone ? normalisePhone(input.phone) : undefined,
  }

  let discount: Quote['discount'] = null
  let codeError: string | null = null
  if (input.code?.trim()) {
    const code = await findCode(payload, input.code)
    if (!code || code.automatic) codeError = "We couldn't find that code."
    else {
      const r = await evaluateDiscount(payload, code, ctx)
      if (r.ok) discount = r
      else codeError = r.reason
    }
  }
  if (!discount && lines.length) {
    const auto = await bestAutomatic(payload, ctx)
    if (auto?.ok) discount = auto
  }

  const total = Math.max(0, subtotal + deliveryFee - (discount?.amount ?? 0))
  return { lines, subtotal, deliveryFee, discount, codeError, total, errors }
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function newOrderNumber() {
  const bytes = crypto.randomBytes(6)
  return `EW-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')}`
}

export const newPickupCode = () => String(crypto.randomInt(1000, 10000))
export const newAccessToken = () => crypto.randomBytes(18).toString('base64url')

/** Night an order is printed: today if paid before the cut-off (Nairobi time), else tomorrow. */
export function printBatchFor(paidAt: Date, cutoff = '18:00') {
  const nairobi = new Date(paidAt.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }))
  const [h, m] = cutoff.split(':').map(Number)
  const afterCutoff = nairobi.getHours() * 60 + nairobi.getMinutes() >= (h || 18) * 60 + (m || 0)
  if (afterCutoff) nairobi.setDate(nairobi.getDate() + 1)
  const y = nairobi.getFullYear()
  const mo = String(nairobi.getMonth() + 1).padStart(2, '0')
  const d = String(nairobi.getDate()).padStart(2, '0')
  return `${y}-${mo}-${d}T00:00:00.000Z`
}

/**
 * Records a successful payment exactly once: marks the order paid, takes the
 * stock, counts the discount code, and sets the print night.
 */
export async function markOrderPaid(
  payload: Payload,
  order: Order,
  info: { mpesaReceipt?: string; message?: string; amount?: number },
) {
  if (order.paymentStatus === 'paid') return order
  if (info.amount && info.amount + 1 < order.total) {
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { paymentMessage: `Paid ${info.amount}, expected ${order.total}. Check before releasing.` },
      overrideAccess: true,
    })
    return order
  }
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  const paidAt = new Date()
  const needsPrint = order.items.some((i) => i.needsPrinting)

  const updated = await payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      status: 'paid',
      paymentStatus: 'paid',
      paidAt: paidAt.toISOString(),
      mpesaReceipt: info.mpesaReceipt ?? order.mpesaReceipt,
      paymentMessage: info.message ?? 'Paid',
      printBatch: needsPrint ? printBatchFor(paidAt, settings.printCutoff ?? '18:00') : null,
    },
    overrideAccess: true,
  })

  // Take stock and count sales.
  for (const item of order.items) {
    const productId = idOf(item.product)
    if (!productId) continue
    const product = await payload
      .findByID({ collection: 'products', id: productId as number, depth: 0, overrideAccess: true })
      .catch(() => null)
    if (!product) continue
    const inventory = product.trackStock
      ? (product.inventory ?? []).map((row) => {
          const match =
            row.size === item.size && ((row.edition || null) === (item.edition || null) || !row.edition)
          return match ? { ...row, stock: Math.max(0, (row.stock ?? 0) - item.quantity) } : row
        })
      : product.inventory
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { inventory, soldCount: (product.soldCount ?? 0) + item.quantity },
      overrideAccess: true,
    })
  }

  const codeId = idOf(order.discountCode)
  if (codeId) {
    const code = await payload
      .findByID({ collection: 'discount-codes', id: codeId as number, depth: 0, overrideAccess: true })
      .catch(() => null)
    if (code) {
      await payload.update({
        collection: 'discount-codes',
        id: code.id,
        data: {
          usedCount: (code.usedCount ?? 0) + 1,
          revenue: (code.revenue ?? 0) + order.total,
          discountGiven: (code.discountGiven ?? 0) + (order.discountAmount ?? 0),
          ...(code.type === 'voucher' ? { balance: Math.max(0, (code.balance ?? 0) - (order.discountAmount ?? 0)) } : {}),
        },
        overrideAccess: true,
      })
    }
  }
  return updated
}

export type { Category }
