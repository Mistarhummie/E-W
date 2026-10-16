'use server'

import { headers } from 'next/headers'

import { getPayloadClient } from '../../../lib/payload'

const recent = new Map<string, number>()

export async function sendMessage(_prev: unknown, form: FormData) {
  // Honeypot: real people never fill this hidden field.
  if (form.get('company')) return { ok: true }
  const name = String(form.get('name') ?? '').trim().slice(0, 80)
  const email = String(form.get('email') ?? '').trim().toLowerCase().slice(0, 120)
  const phone = String(form.get('phone') ?? '').trim().slice(0, 20)
  const subject = String(form.get('subject') ?? 'General').slice(0, 80)
  const message = String(form.get('message') ?? '').trim().slice(0, 3000)
  if (!name || !message) return { error: 'Please add your name and a message.' }
  if (!email && !phone) return { error: 'Add an email or phone number so we can reply.' }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'That email does not look right.' }

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const last = recent.get(ip) ?? 0
  if (Date.now() - last < 30_000) return { error: 'Thanks, we got your last message. Please wait a moment before sending another.' }
  recent.set(ip, Date.now())

  const payload = await getPayloadClient()
  await payload.create({ collection: 'messages', overrideAccess: true, data: { name, email: email || undefined, phone: phone || undefined, subject, message } })
  return { ok: true }
}
