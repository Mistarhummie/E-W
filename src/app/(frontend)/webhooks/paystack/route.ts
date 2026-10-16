import { markOrderPaid } from '../../../../lib/orders'
import { getPayloadClient } from '../../../../lib/payload'
import { validWebhookSignature, verifyCardPayment } from '../../../../lib/paystack'

export async function POST(request: Request) {
  const raw = await request.text()
  if (!validWebhookSignature(raw, request.headers.get('x-paystack-signature'))) {
    return new Response('Invalid signature', { status: 401 })
  }
  const event = JSON.parse(raw) as { event: string; data: { reference: string } }
  if (event.event !== 'charge.success') return new Response('ok')

  // Double-check with Paystack before releasing the order.
  const verified = await verifyCardPayment(event.data.reference)
  if (!verified.paid) return new Response('ok')
  const payload = await getPayloadClient()
  const found = await payload.find({
    collection: 'orders',
    where: { paystackReference: { equals: event.data.reference } },
    limit: 1,
    overrideAccess: true,
  })
  if (found.docs[0]) await markOrderPaid(payload, found.docs[0], { message: 'Card payment', amount: verified.amount })
  return new Response('ok')
}
