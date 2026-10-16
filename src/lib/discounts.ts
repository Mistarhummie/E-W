import type { Payload, Where } from 'payload'

import type { DiscountCode } from '../payload-types'

export type DiscountLine = {
  productId: number | string
  categoryId?: number | string | null
  unitPrice: number
  printPrice: number
  quantity: number
}

export type DiscountResult =
  | { ok: true; amount: number; label: string; code: DiscountCode; freeDelivery: boolean }
  | { ok: false; reason: string }

const idOf = (v: unknown) => (v && typeof v === 'object' && 'id' in v ? (v as { id: number | string }).id : v)

function eligible(code: DiscountCode, line: DiscountLine) {
  if (code.appliesTo === 'products') {
    return (code.products ?? []).some((p) => String(idOf(p)) === String(line.productId))
  }
  if (code.appliesTo === 'categories') {
    return (code.categories ?? []).some((c) => String(idOf(c)) === String(line.categoryId))
  }
  return true
}

export async function evaluateDiscount(
  payload: Payload,
  code: DiscountCode,
  ctx: { lines: DiscountLine[]; subtotal: number; deliveryFee: number; customerId?: number | string | null; phone?: string },
): Promise<DiscountResult> {
  const now = new Date()
  if (!code.active) return { ok: false, reason: 'This code is no longer active.' }
  if (code.startsAt && new Date(code.startsAt) > now) return { ok: false, reason: 'This code is not active yet.' }
  if (code.endsAt && new Date(code.endsAt) < now) return { ok: false, reason: 'This code has expired.' }
  if (code.maxUses && (code.usedCount ?? 0) >= code.maxUses) return { ok: false, reason: 'This code has been fully used.' }
  if (code.minOrder && ctx.subtotal < code.minOrder) {
    return { ok: false, reason: `Spend KSH ${code.minOrder.toLocaleString('en-KE')} or more to use this code.` }
  }
  if (code.onePerCustomer && (ctx.customerId || ctx.phone)) {
    const or: Where[] = [
      ...(ctx.customerId ? [{ customer: { equals: ctx.customerId } }] : []),
      ...(ctx.phone ? [{ 'contact.phone': { equals: ctx.phone } }] : []),
    ]
    const used = await payload.count({
      collection: 'orders',
      where: { and: [{ discountCode: { equals: code.id } }, { paymentStatus: { equals: 'paid' } }, { or }] },
      overrideAccess: true,
    })
    if (used.totalDocs > 0) return { ok: false, reason: 'You have already used this code.' }
  }

  const lines = ctx.lines.filter((l) => eligible(code, l))
  if (!lines.length && code.type !== 'freeDelivery' && code.type !== 'voucher') {
    return { ok: false, reason: "This code doesn't apply to the items in your cart." }
  }
  const eligibleSubtotal = lines.reduce((s, l) => s + (l.unitPrice + l.printPrice) * l.quantity, 0)
  const value = code.value ?? 0
  let amount = 0
  let freeDelivery = false

  switch (code.type) {
    case 'percent':
      amount = Math.round((eligibleSubtotal * Math.min(value, 100)) / 100)
      break
    case 'fixed':
      amount = Math.min(value, eligibleSubtotal)
      break
    case 'freeDelivery':
      amount = ctx.deliveryFee
      freeDelivery = true
      break
    case 'freePrinting':
      amount = lines.reduce((s, l) => s + l.printPrice * l.quantity, 0)
      break
    case 'bxgy': {
      const buy = code.buyQty ?? 1
      const get = code.getQty ?? 1
      // Cheapest units go free: for every (buy + get) units, `get` of them.
      const units = lines.flatMap((l) => Array.from({ length: l.quantity }, () => l.unitPrice)).sort((a, b) => a - b)
      const freeCount = Math.floor(units.length / (buy + get)) * get
      amount = units.slice(0, freeCount).reduce((s, p) => s + p, 0)
      if (!amount) return { ok: false, reason: `Add ${buy + get} eligible items to use this offer.` }
      break
    }
    case 'voucher':
      amount = Math.min(code.balance ?? 0, ctx.subtotal + ctx.deliveryFee)
      if (amount <= 0) return { ok: false, reason: 'This voucher has no balance left.' }
      break
  }

  amount = Math.max(0, Math.min(amount, ctx.subtotal + ctx.deliveryFee))
  const label = code.description || (code.automatic ? 'Offer' : `Code ${code.code}`)
  return { ok: true, amount, label, code, freeDelivery }
}

export async function findCode(payload: Payload, raw: string) {
  const res = await payload.find({
    collection: 'discount-codes',
    where: { code: { equals: raw.toUpperCase().replace(/\s+/g, '') } },
    limit: 1,
    overrideAccess: true,
  })
  return res.docs[0] ?? null
}

/** Best automatic offer for this cart, if any. */
export async function bestAutomatic(
  payload: Payload,
  ctx: Parameters<typeof evaluateDiscount>[2],
): Promise<DiscountResult | null> {
  const autos = await payload.find({
    collection: 'discount-codes',
    where: { and: [{ automatic: { equals: true } }, { active: { equals: true } }] },
    limit: 50,
    overrideAccess: true,
  })
  let best: DiscountResult | null = null
  for (const code of autos.docs) {
    const r = await evaluateDiscount(payload, code, ctx)
    if (r.ok && (!best || !best.ok || r.amount > best.amount)) best = r
  }
  return best
}
