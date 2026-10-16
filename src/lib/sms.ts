import 'server-only'

import { normalisePhone } from './phone'

/**
 * Sends an SMS through Africa's Talking. Without an API key (local testing),
 * the message is written to the server log instead.
 */
export async function sendSms(to: string, message: string): Promise<boolean> {
  const phone = `+${normalisePhone(to)}`
  const apiKey = process.env.AT_API_KEY
  const username = process.env.AT_USERNAME || 'sandbox'
  if (!apiKey) {
    console.info(`[sms:log-only] to ${phone}: ${message}`)
    return true
  }
  const host = username === 'sandbox' ? 'api.sandbox.africastalking.com' : 'api.africastalking.com'
  const body = new URLSearchParams({ username, to: phone, message })
  if (process.env.AT_SENDER_ID) body.set('from', process.env.AT_SENDER_ID)
  try {
    const res = await fetch(`https://${host}/version1/messaging`, {
      method: 'POST',
      headers: { apiKey, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) console.error('[sms] failed', res.status, await res.text())
    return res.ok
  } catch (err) {
    console.error('[sms] error', err)
    return false
  }
}
