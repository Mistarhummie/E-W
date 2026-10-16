'use server'

import { getCurrentUser, getPayloadClient } from '../../../lib/payload'
import { initializeCardPayment, paystackConfigured, verifyCardPayment } from '../../../lib/paystack'
import { mpesaConfigured, stkPush, stkQuery } from '../../../lib/mpesa'
import { markOrderPaid, newAccessToken, newOrderNumber, newPickupCode, quote, type CartLineInput } from '../../../lib/orders'
import { isKenyanMobile, normalisePhone } from '../../../lib/phone'
import { sendSms } from '../../../lib/sms'

export type QuoteRequest = {
  lines: CartLineInput[]
  code?: string
  fulfilment: { method: 'pickup' | 'delivery'; storeId?: number | string | null; zoneId?: number | string | null }
  phone?: string
}

export type QuoteResponse = {
  lines: { key: number; title: string; unitPrice: number; printPrice: number; quantity: number; lineTotal: number; preorder: boolean }[]
  subtotal: number
  deliveryFee: number
  discount: { amount: number; label: string; code: string | null } | null
  codeError: string | null
  total: number
  errors: string[]
  hasPrinting: boolean
}

export async function getQuote(req: QuoteRequest): Promise<QuoteResponse> {
  const payload = await getPayloadClient()
  const user = await getCurrentUser()
  const q = await quote(payload, { ...req, customerId: user && user.role === 'customer' ? user.id : null })
  return {
    lines: q.lines.map((l, i) => ({ key: i, title: l.title, unitPrice: l.unitPrice, printPrice: l.printPrice, quantity: l.quantity, lineTotal: l.lineTotal, preorder: l.preorder })),
    subtotal: q.subtotal,
    deliveryFee: q.deliveryFee,
    discount: q.discount ? { amount: q.discount.amount, label: q.discount.label, code: q.discount.code.automatic ? null : q.discount.code.code } : null,
    codeError: q.codeError,
    total: q.total,
    errors: q.errors,
    hasPrinting: q.lines.some((l) => l.needsPrinting),
  }
}

export type PlaceOrderRequest = QuoteRequest & {
  contact: { name: string; phone: string; email?: string }
  address?: string
  deliveryNotes?: string
  payment: { method: 'mpesa' | 'card' | 'pickup'; mpesaPhone?: string }
  marketingConsent?: boolean
}

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; token: string; redirect?: string; message?: string }
  | { ok: false; errors: string[] }

export async function placeOrder(req: PlaceOrderRequest): Promise<PlaceOrderResult> {
  const payload = await getPayloadClient()
  const user = await getCurrentUser()
  const errors: string[] = []

  const name = req.contact.name?.trim().slice(0, 80)
  const email = req.contact.email?.trim().toLowerCase().slice(0, 120) || undefined
  if (!name) errors.push('Please enter your name.')
  if (!isKenyanMobile(req.contact.phone ?? '')) errors.push('Please enter a valid Kenyan mobile number, e.g. 0712 345 678.')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please check your email address.')
  if (req.fulfilment.method === 'delivery' && !req.address?.trim()) errors.push('Please enter your delivery address.')
  if (!req.lines?.length) errors.push('Your cart is empty.')
  if (req.payment.method === 'card' && !email) errors.push('Card payments need an email address for the receipt.')

  const phone = normalisePhone(req.contact.phone ?? '')
  const customerId = user && user.role === 'customer' ? user.id : null
  const q = await quote(payload, { ...req, customerId, phone })
  errors.push(...q.errors)
  if (req.code?.trim() && q.codeError) errors.push(q.codeError)

  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  const hasPrinting = q.lines.some((l) => l.needsPrinting)
  if (req.payment.method === 'pickup') {
    if (!settings.allowPayAtPickup) errors.push('Pay at pickup is not available right now.')
    else if (req.fulfilment.method !== 'pickup') errors.push('Pay at pickup is only for store collection.')
    else if (hasPrinting) errors.push('Customised shirts must be paid online before printing.')
  }
  const mpesaPhone = normalisePhone(req.payment.mpesaPhone || phone)
  if (req.payment.method === 'mpesa' && !isKenyanMobile(mpesaPhone)) errors.push('Please enter the M-Pesa number to pay with.')
  if (errors.length) return { ok: false, errors: [...new Set(errors)] }

  let store = req.fulfilment.storeId ?? null
  if (req.fulfilment.method === 'delivery') {
    const dispatch = await payload.find({ collection: 'stores', where: { isDispatchStore: { equals: true } }, limit: 1, overrideAccess: true })
    store = dispatch.docs[0]?.id ?? null
  }

  const token = newAccessToken()
  const order = await payload.create({
    collection: 'orders',
    overrideAccess: true,
    data: {
      orderNumber: newOrderNumber(),
      accessToken: token,
      status: 'pending',
      customer: customerId,
      contact: { name, phone, email },
      items: q.lines.map((l) => ({
        product: l.product.id,
        title: l.title,
        edition: l.edition,
        size: l.size,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        printPrice: l.printPrice,
        lineTotal: l.lineTotal,
        print: l.print ?? undefined,
        needsPrinting: l.needsPrinting,
        preorder: l.preorder,
      })),
      subtotal: q.subtotal,
      deliveryFee: q.deliveryFee,
      discountAmount: q.discount?.amount ?? 0,
      discountCode: q.discount?.code.id ?? null,
      discountLabel: q.discount?.label ?? null,
      total: q.total,
      fulfilmentMethod: req.fulfilment.method,
      store: store as number | null,
      zone: (req.fulfilment.zoneId as number) ?? null,
      address: req.address?.trim().slice(0, 500),
      deliveryNotes: req.deliveryNotes?.trim().slice(0, 500),
      pickupCode: req.fulfilment.method === 'pickup' ? newPickupCode() : null,
      paymentMethod: req.payment.method,
      paymentStatus: 'unpaid',
      mpesaPhone: req.payment.method === 'mpesa' ? mpesaPhone : null,
    },
  })

  if (customerId && req.marketingConsent) {
    await payload.update({ collection: 'users', id: customerId, data: { marketingConsent: true }, overrideAccess: true }).catch(() => null)
  }

  // Fully discounted (e.g. gift voucher covers it): nothing to pay.
  if (q.total <= 0) {
    await markOrderPaid(payload, order, { message: 'Covered by voucher/discount' })
    return { ok: true, orderNumber: order.orderNumber, token }
  }

  if (req.payment.method === 'pickup') {
    await sendSms(phone, `EastWest: Order ${order.orderNumber} reserved. Pay ${q.total} at the store when you collect. We'll SMS when it's ready.`)
    return { ok: true, orderNumber: order.orderNumber, token }
  }

  if (req.payment.method === 'card') {
    if (!paystackConfigured()) {
      return { ok: true, orderNumber: order.orderNumber, token, message: 'Card payments are not connected yet.' }
    }
    try {
      const url = await initializeCardPayment({
        email: email!,
        amount: q.total,
        reference: order.orderNumber,
        callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/orders/${order.orderNumber}?t=${token}`,
      })
      await payload.update({ collection: 'orders', id: order.id, data: { paystackReference: order.orderNumber }, overrideAccess: true })
      return { ok: true, orderNumber: order.orderNumber, token, redirect: url }
    } catch (err) {
      return { ok: true, orderNumber: order.orderNumber, token, message: (err as Error).message }
    }
  }

  const message = await sendMpesaPrompt(order.id, mpesaPhone, q.total, order.orderNumber)
  return { ok: true, orderNumber: order.orderNumber, token, message }
}

async function sendMpesaPrompt(orderId: number, phone: string, amount: number, orderNumber: string) {
  const payload = await getPayloadClient()
  if (!mpesaConfigured()) return 'M-Pesa is not connected yet.'
  try {
    const { checkoutRequestId, message } = await stkPush({ phone, amount, reference: orderNumber, description: 'EastWest' })
    await payload.update({ collection: 'orders', id: orderId, data: { mpesaCheckoutId: checkoutRequestId, mpesaPhone: phone, paymentMessage: message ?? 'Prompt sent' }, overrideAccess: true })
    return undefined
  } catch (err) {
    payload.logger.error(err)
    return (err as Error).message
  }
}

export async function getOrderForPage(orderNumber: string, token?: string | null) {
  return findOrder(orderNumber, token)
}

async function findOrder(orderNumber: string, token?: string | null) {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'orders', where: { orderNumber: { equals: orderNumber } }, limit: 1, depth: 1, overrideAccess: true, showHiddenFields: true })
  const order = res.docs[0]
  if (!order) return null
  const user = await getCurrentUser()
  const owner = user && order.customer && String(typeof order.customer === 'object' ? order.customer.id : order.customer) === String(user.id)
  const staff = user && user.role !== 'customer'
  if (owner || staff || (token && order.accessToken && token === order.accessToken)) return order
  return null
}

const lastQuery = new Map<string, number>()

export async function orderStatus(orderNumber: string, token?: string | null) {
  let order = await findOrder(orderNumber, token)
  if (!order) return null
  // If the M-Pesa callback is slow or lost, ask Safaricom directly (at most every 15s per order).
  const waited = Date.now() - new Date(order.updatedAt).getTime()
  const last = lastQuery.get(order.orderNumber) ?? 0
  if (
    order.paymentStatus === 'unpaid' &&
    order.paymentMethod === 'mpesa' &&
    order.mpesaCheckoutId &&
    mpesaConfigured() &&
    waited > 20000 &&
    Date.now() - last > 15000
  ) {
    lastQuery.set(order.orderNumber, Date.now())
    const r = await stkQuery(order.mpesaCheckoutId).catch(() => ({ state: 'pending' as const, message: undefined }))
    const payload = await getPayloadClient()
    if (r.state === 'paid') order = await markOrderPaid(payload, order, { message: r.message })
    else if (r.state === 'failed') {
      order = await payload.update({ collection: 'orders', id: order.id, data: { paymentStatus: 'failed', paymentMessage: r.message }, overrideAccess: true })
    }
  }
  if (order.paymentStatus === 'unpaid' && order.paymentMethod === 'card' && order.paystackReference && paystackConfigured()) {
    const v = await verifyCardPayment(order.paystackReference).catch(() => ({ paid: false, amount: 0 }))
    if (v.paid) order = await markOrderPaid(await getPayloadClient(), order, { message: 'Card payment', amount: v.amount })
  }
  return { status: order.status, paymentStatus: order.paymentStatus, message: order.paymentMessage ?? null }
}

/** "Track an order": order number + the phone used at checkout. */
export async function trackOrder(_prev: unknown, form: FormData) {
  const orderNumber = String(form.get('order') ?? '').trim().toUpperCase().replace(/^(?!EW-)/, 'EW-')
  const phone = normalisePhone(String(form.get('phone') ?? ''))
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'orders',
    where: { and: [{ orderNumber: { equals: orderNumber } }, { 'contact.phone': { equals: phone } }] },
    limit: 1,
    overrideAccess: true,
    showHiddenFields: true,
  })
  const order = res.docs[0]
  if (!order?.accessToken) return { error: "We couldn't find an order with that number and phone." }
  const { redirect } = await import('next/navigation')
  redirect(`/orders/${order.orderNumber}?t=${order.accessToken}`)
}

export async function retryMpesa(orderNumber: string, token: string, phone: string) {
  const order = await findOrder(orderNumber, token)
  if (!order || order.paymentStatus === 'paid') return { ok: false, message: 'This order is already paid or was not found.' }
  if (!isKenyanMobile(phone)) return { ok: false, message: 'Please enter a valid M-Pesa number.' }
  const payload = await getPayloadClient()
  await payload.update({ collection: 'orders', id: order.id, data: { paymentStatus: 'unpaid', paymentMethod: 'mpesa' }, overrideAccess: true })
  const message = await sendMpesaPrompt(order.id, normalisePhone(phone), order.total, order.orderNumber)
  return { ok: !message, message: message ?? 'Check your phone and enter your M-Pesa PIN.' }
}

/** Test mode only: pretend the payment went through. */
export async function simulatePayment(orderNumber: string, token: string) {
  if (process.env.DEMO_MODE !== 'true' || process.env.MPESA_ENV === 'production') return { ok: false }
  const order = await findOrder(orderNumber, token)
  if (!order) return { ok: false }
  await markOrderPaid(await getPayloadClient(), order, { mpesaReceipt: `TEST${Date.now().toString(36).toUpperCase()}`, message: 'Test payment' })
  return { ok: true }
}
