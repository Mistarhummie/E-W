import 'server-only'

import crypto from 'node:crypto'

/** Paystack card payments in KES. */

export const paystackConfigured = () => Boolean(process.env.PAYSTACK_SECRET_KEY)

const headers = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
})

export async function initializeCardPayment(opts: { email: string; amount: number; reference: string; callbackUrl: string }) {
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      email: opts.email,
      amount: Math.round(opts.amount * 100),
      currency: 'KES',
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      channels: ['card'],
    }),
    cache: 'no-store',
  })
  const json = (await res.json()) as { status: boolean; message: string; data?: { authorization_url: string } }
  if (!json.status || !json.data) throw new Error(json.message || 'Could not start the card payment.')
  return json.data.authorization_url
}

export async function verifyCardPayment(reference: string) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: headers(),
    cache: 'no-store',
  })
  const json = (await res.json()) as { status: boolean; data?: { status: string; amount: number; currency: string } }
  return {
    paid: Boolean(json.status && json.data?.status === 'success' && json.data.currency === 'KES'),
    amount: (json.data?.amount ?? 0) / 100,
  }
}

export function validWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex')
  const a = Buffer.from(hash)
  const b = Buffer.from(signature)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
