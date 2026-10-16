import type { Payload } from 'payload'
import { describe, expect, it } from 'vitest'

import { evaluateDiscount, type DiscountLine } from '@/lib/discounts'
import { formatPhone, isKenyanMobile, normalisePhone } from '@/lib/phone'
import { percentOff, printPriceFor, unitPriceFor, wasPriceFor } from '@/lib/pricing'
import type { DiscountCode } from '@/payload-types'

const jersey = {
  price: 2500,
  compareAtPrice: 3000,
  editions: [
    { name: 'Fan Edition', price: 2500 },
    { name: 'Player Edition', price: 3500, compareAtPrice: null },
  ],
}

describe('pricing', () => {
  it('uses the edition price when one is chosen', () => {
    expect(unitPriceFor(jersey)).toBe(2500)
    expect(unitPriceFor(jersey, 'Player Edition')).toBe(3500)
  })

  it('only shows a was-price while the sale is running', () => {
    expect(wasPriceFor(jersey)).toBe(3000)
    expect(wasPriceFor({ ...jersey, saleEndsAt: '2020-01-01' })).toBeNull()
    expect(percentOff(2500, 3000)).toBe(17)
  })

  it('charges name, number and each badge', () => {
    const badges = [
      { id: 1, price: 100 },
      { id: 2, price: 200 },
    ]
    const prices = { namePrice: 200, numberPrice: 200 }
    expect(printPriceFor({ name: 'ONYANGO', number: '9', badgeIds: [1, 2] }, prices, badges)).toBe(700)
    expect(printPriceFor({ name: '  ', number: '10' }, prices, badges)).toBe(200)
    expect(printPriceFor(undefined, prices, badges)).toBe(0)
  })
})

describe('phone numbers', () => {
  it('normalises Kenyan mobile formats', () => {
    expect(normalisePhone('0712 345 678')).toBe('254712345678')
    expect(normalisePhone('+254 112 345 678')).toBe('254112345678')
    expect(isKenyanMobile('0712345678')).toBe(true)
    expect(isKenyanMobile('0201234567')).toBe(false)
    expect(formatPhone('0712345678')).toBe('+254 712 345 678')
  })
})

describe('discount codes', () => {
  const payload = { count: async () => ({ totalDocs: 0 }) } as unknown as Payload
  const code = (c: Partial<DiscountCode>) => ({ id: 1, code: 'TEST', active: true, type: 'percent', value: 10, ...c }) as DiscountCode
  const lines: DiscountLine[] = [
    { productId: 1, unitPrice: 2500, printPrice: 400, quantity: 1 },
    { productId: 2, unitPrice: 1500, printPrice: 0, quantity: 2 },
  ]
  const ctx = { lines, subtotal: 5900, deliveryFee: 350 }

  it('takes a percentage off', async () => {
    const r = await evaluateDiscount(payload, code({}), ctx)
    expect(r.ok && r.amount).toBe(590)
  })

  it('makes printing free', async () => {
    const r = await evaluateDiscount(payload, code({ type: 'freePrinting' }), ctx)
    expect(r.ok && r.amount).toBe(400)
  })

  it('gives the cheapest item free on buy 2 get 1', async () => {
    const r = await evaluateDiscount(payload, code({ type: 'bxgy', buyQty: 2, getQty: 1 }), ctx)
    expect(r.ok && r.amount).toBe(1500)
  })

  it('refunds delivery on free delivery codes', async () => {
    const r = await evaluateDiscount(payload, code({ type: 'freeDelivery' }), ctx)
    expect(r.ok && r.freeDelivery && r.amount).toBe(350)
  })

  it('never takes more than a voucher balance', async () => {
    const r = await evaluateDiscount(payload, code({ type: 'voucher', balance: 1000 }), ctx)
    expect(r.ok && r.amount).toBe(1000)
  })

  it('enforces minimum spend and expiry', async () => {
    expect((await evaluateDiscount(payload, code({ minOrder: 10000 }), ctx)).ok).toBe(false)
    expect((await evaluateDiscount(payload, code({ endsAt: '2020-01-01' }), ctx)).ok).toBe(false)
  })
})
