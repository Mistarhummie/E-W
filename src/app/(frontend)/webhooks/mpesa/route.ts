import crypto from 'node:crypto'

import { parseCallback, type StkCallback } from '../../../../lib/mpesa'
import { markOrderPaid } from '../../../../lib/orders'
import { getPayloadClient } from '../../../../lib/payload'

// Safaricom calls this after the customer enters (or cancels) their PIN.
export async function POST(request: Request) {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret') ?? ''
  const expected = process.env.MPESA_CALLBACK_SECRET ?? ''
  const ok = expected && secret.length === expected.length && crypto.timingSafeEqual(Buffer.from(secret), Buffer.from(expected))
  if (!ok) return Response.json({ ResultCode: 1, ResultDesc: 'Rejected' }, { status: 403 })

  let body: StkCallback
  try {
    body = (await request.json()) as StkCallback
  } catch {
    return Response.json({ ResultCode: 1, ResultDesc: 'Bad request' }, { status: 400 })
  }
  const result = parseCallback(body)
  const payload = await getPayloadClient()
  const found = await payload.find({
    collection: 'orders',
    where: { mpesaCheckoutId: { equals: result.checkoutRequestId } },
    limit: 1,
    overrideAccess: true,
  })
  const order = found.docs[0]
  if (order) {
    if (result.success) {
      await markOrderPaid(payload, order, { mpesaReceipt: result.receipt, message: result.message, amount: result.amount })
    } else if (order.paymentStatus !== 'paid') {
      await payload.update({
        collection: 'orders',
        id: order.id,
        data: { paymentStatus: 'failed', paymentMessage: result.message },
        overrideAccess: true,
      })
    }
  }
  return Response.json({ ResultCode: 0, ResultDesc: 'Accepted' })
}
