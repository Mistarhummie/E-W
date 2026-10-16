'use server'

import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { getCurrentUser, getPayloadClient } from '../../../lib/payload'
import { isKenyanMobile, normalisePhone } from '../../../lib/phone'
import { SESSION_COOKIE, signSession } from '../../../lib/session'
import { sendSms } from '../../../lib/sms'

const hashCode = (phone: string, code: string) =>
  crypto.createHmac('sha256', process.env.PAYLOAD_SECRET || 'dev').update(`${phone}:${code}`).digest('hex')

const safeNext = (next: unknown) => (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/account')

async function startSession(userId: number | string) {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

type State = { error?: string; step?: 'code' | 'name'; phone?: string; demoCode?: string; message?: string } | null

/** Step 1: send a 6-digit code by SMS. Step 2: check it. Step 3 (new customers): ask for a name. */
export async function phoneLogin(prev: State, form: FormData): Promise<State> {
  const payload = await getPayloadClient()
  const phone = normalisePhone(String(form.get('phone') ?? prev?.phone ?? ''))
  const code = String(form.get('code') ?? '').replace(/\D/g, '')
  const name = String(form.get('name') ?? '').trim().slice(0, 80)
  const next = safeNext(form.get('next'))

  if (!isKenyanMobile(phone)) return { error: 'Enter a valid Kenyan mobile number, e.g. 0712 345 678.' }

  if (!code && !name) {
    const recent = await payload.find({
      collection: 'otp-codes',
      where: { and: [{ phone: { equals: phone } }, { createdAt: { greater_than: new Date(Date.now() - 45_000).toISOString() } }] },
      limit: 1,
      overrideAccess: true,
    })
    if (recent.docs.length) return { step: 'code', phone, message: 'We just sent a code. Please wait a moment before asking for another.' }
    const otp = String(crypto.randomInt(100000, 1000000))
    await payload.delete({ collection: 'otp-codes', where: { phone: { equals: phone } }, overrideAccess: true })
    await payload.create({
      collection: 'otp-codes',
      overrideAccess: true,
      data: { phone, codeHash: hashCode(phone, otp), expiresAt: new Date(Date.now() + 10 * 60_000).toISOString() },
    })
    await sendSms(phone, `${otp} is your EastWest login code. It expires in 10 minutes.`)
    return { step: 'code', phone, demoCode: process.env.DEMO_MODE === 'true' && !process.env.AT_API_KEY ? otp : undefined }
  }

  if (code) {
    const found = await payload.find({ collection: 'otp-codes', where: { phone: { equals: phone } }, limit: 1, overrideAccess: true })
    const otp = found.docs[0]
    if (!otp || new Date(otp.expiresAt) < new Date()) return { step: 'code', phone, error: 'That code has expired. Request a new one.' }
    if ((otp.attempts ?? 0) >= 5) return { step: 'code', phone, error: 'Too many tries. Request a new code.' }
    const a = Buffer.from(hashCode(phone, code))
    const b = Buffer.from(otp.codeHash)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      await payload.update({ collection: 'otp-codes', id: otp.id, data: { attempts: (otp.attempts ?? 0) + 1 }, overrideAccess: true })
      return { step: 'code', phone, error: 'That code is not right. Check the SMS and try again.' }
    }
    await payload.delete({ collection: 'otp-codes', id: otp.id, overrideAccess: true })
    const existing = await payload.find({ collection: 'users', where: { phone: { equals: phone } }, limit: 1, overrideAccess: true })
    const user = existing.docs[0]
    if (user) {
      if (user.role !== 'customer') return { error: 'Staff accounts sign in at /admin with email and password.' }
      await startSession(user.id)
      redirect(next)
    }
    // New customer: remember that this phone was verified for a few minutes.
    const jar = await cookies()
    jar.set('ew_verified_phone', signSession(`phone:${phone}`), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 })
    return { step: 'name', phone }
  }

  // Create the account for a verified new phone number.
  const jar = await cookies()
  const { verifySession } = await import('../../../lib/session')
  const verified = verifySession(jar.get('ew_verified_phone')?.value)
  if (verified !== `phone:${phone}`) return { error: 'Please verify your phone number again.' }
  if (!name) return { step: 'name', phone, error: 'Please tell us your name.' }
  const user = await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: {
      name,
      phone,
      username: phone,
      role: 'customer',
      password: crypto.randomBytes(24).toString('base64url'),
      marketingConsent: form.get('consent') === 'on',
    },
  })
  jar.delete('ew_verified_phone')
  await startSession(user.id)
  redirect(next)
}

export async function emailLogin(_prev: unknown, form: FormData) {
  const payload = await getPayloadClient()
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const password = String(form.get('password') ?? '')
  try {
    const res = await payload.login({ collection: 'users', data: { email, password } })
    if (!res.token || !res.user) throw new Error()
    const jar = await cookies()
    jar.set('payload-token', res.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  } catch {
    return { error: 'Wrong email or password.' }
  }
  redirect(safeNext(form.get('next')))
}

export async function register(_prev: unknown, form: FormData) {
  const payload = await getPayloadClient()
  const name = String(form.get('name') ?? '').trim()
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const phone = String(form.get('phone') ?? '')
  const password = String(form.get('password') ?? '')
  if (!name) return { error: 'Please enter your name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Please enter a valid email.' }
  if (phone && !isKenyanMobile(phone)) return { error: 'Please enter a valid Kenyan mobile number.' }
  if (password.length < 8) return { error: 'Use at least 8 characters for your password.' }
  try {
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name,
        email,
        phone: phone ? normalisePhone(phone) : undefined,
        username: phone ? normalisePhone(phone) : undefined,
        password,
        role: 'customer',
        birthday: (form.get('birthday') as string) || undefined,
        favouriteClub: String(form.get('club') ?? '').slice(0, 60) || undefined,
        marketingConsent: form.get('consent') === 'on',
      },
    })
  } catch {
    return { error: 'An account with that email or phone already exists. Try logging in.' }
  }
  return emailLogin(null, form)
}

export async function logout() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  jar.delete('payload-token')
  redirect('/')
}

export async function updateProfile(_prev: unknown, form: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'customer') return { error: 'Please log in again.' }
  const payload = await getPayloadClient()
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  try {
    await payload.update({
      collection: 'users',
      id: user.id,
      overrideAccess: true,
      data: {
        name: String(form.get('name') ?? user.name).slice(0, 80),
        email: email || undefined,
        birthday: (form.get('birthday') as string) || null,
        favouriteClub: String(form.get('club') ?? '').slice(0, 60) || null,
        marketingConsent: form.get('consent') === 'on',
        addresses: form.get('address') ? [{ label: 'Home', address: String(form.get('address')).slice(0, 500) }] : [],
      },
    })
  } catch {
    return { error: 'That email is already used by another account.' }
  }
  revalidatePath('/account')
  return { ok: true }
}

/** Data Protection Act: customers can delete their account. Orders are kept for accounting, without the link to the account. */
export async function deleteAccount() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'customer') return
  const payload = await getPayloadClient()
  await payload.update({ collection: 'orders', where: { customer: { equals: user.id } }, data: { customer: null }, overrideAccess: true })
  await payload.delete({ collection: 'users', id: user.id, overrideAccess: true })
  await logout()
}
