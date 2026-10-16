'use server'

import { getPayloadClient } from '../../../lib/payload'

export async function subscribe(_prev: unknown, form: FormData) {
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: 'Please enter a valid email.' }
  const payload = await getPayloadClient()
  const existing = await payload.find({ collection: 'subscribers', where: { email: { equals: email } }, limit: 1, overrideAccess: true })
  if (!existing.docs.length) {
    await payload.create({ collection: 'subscribers', data: { email, source: 'footer' }, overrideAccess: true })
  }
  return { ok: true, message: "You're in! Watch your inbox for the next drop." }
}
