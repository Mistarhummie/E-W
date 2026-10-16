import 'server-only'

import { normalisePhone } from './phone'

/** Safaricom Daraja M-Pesa Express (STK push). */

const base = () =>
  process.env.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke'

export const mpesaConfigured = () =>
  Boolean(process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_SECRET && process.env.MPESA_PASSKEY)

let cachedToken: { value: string; expires: number } | null = null

async function accessToken() {
  if (cachedToken && cachedToken.expires > Date.now()) return cachedToken.value
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64')
  const res = await fetch(`${base()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`M-Pesa auth failed (${res.status})`)
  const json = (await res.json()) as { access_token: string; expires_in: string }
  cachedToken = { value: json.access_token, expires: Date.now() + (Number(json.expires_in) - 60) * 1000 }
  return cachedToken.value
}

const timestamp = () => {
  // Daraja wants Nairobi local time as YYYYMMDDHHmmss.
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return `${get('year')}${get('month')}${get('day')}${get('hour')}${get('minute')}${get('second')}`
}

export async function stkPush(opts: { phone: string; amount: number; reference: string; description: string }) {
  const shortcode = process.env.MPESA_SHORTCODE!
  const ts = timestamp()
  const password = Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${ts}`).toString('base64')
  const isTill = process.env.MPESA_TRANSACTION_TYPE === 'CustomerBuyGoodsOnline'
  const callback = `${process.env.NEXT_PUBLIC_SITE_URL}/webhooks/mpesa?secret=${encodeURIComponent(
    process.env.MPESA_CALLBACK_SECRET || '',
  )}`
  const res = await fetch(`${base()}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline',
      Amount: Math.ceil(opts.amount),
      PartyA: normalisePhone(opts.phone),
      PartyB: isTill ? process.env.MPESA_TILL_NUMBER || shortcode : shortcode,
      PhoneNumber: normalisePhone(opts.phone),
      CallBackURL: callback,
      AccountReference: opts.reference.slice(0, 12),
      TransactionDesc: opts.description.slice(0, 13),
    }),
    cache: 'no-store',
  })
  const json = (await res.json()) as {
    CheckoutRequestID?: string
    ResponseCode?: string
    CustomerMessage?: string
    errorMessage?: string
  }
  if (!res.ok || json.ResponseCode !== '0' || !json.CheckoutRequestID) {
    throw new Error(json.errorMessage || json.CustomerMessage || 'Could not send the M-Pesa prompt.')
  }
  return { checkoutRequestId: json.CheckoutRequestID, message: json.CustomerMessage }
}

/** Asks Safaricom for the result, for when the callback is slow or lost. */
export async function stkQuery(checkoutRequestId: string) {
  const shortcode = process.env.MPESA_SHORTCODE!
  const ts = timestamp()
  const password = Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${ts}`).toString('base64')
  const res = await fetch(`${base()}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ BusinessShortCode: shortcode, Password: password, Timestamp: ts, CheckoutRequestID: checkoutRequestId }),
    cache: 'no-store',
  })
  const json = (await res.json()) as { ResultCode?: string; ResultDesc?: string; errorCode?: string }
  if (json.errorCode) return { state: 'pending' as const }
  if (json.ResultCode === '0') return { state: 'paid' as const, message: json.ResultDesc }
  if (json.ResultCode) return { state: 'failed' as const, message: json.ResultDesc }
  return { state: 'pending' as const }
}

export type StkCallback = {
  Body: {
    stkCallback: {
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: { Item: { Name: string; Value?: string | number }[] }
    }
  }
}

export function parseCallback(body: StkCallback) {
  const cb = body.Body.stkCallback
  const item = (name: string) => cb.CallbackMetadata?.Item.find((i) => i.Name === name)?.Value
  return {
    checkoutRequestId: cb.CheckoutRequestID,
    success: cb.ResultCode === 0,
    message: cb.ResultDesc,
    receipt: item('MpesaReceiptNumber') as string | undefined,
    amount: Number(item('Amount') ?? 0),
  }
}
