import crypto from 'node:crypto'
import { cookies } from 'next/headers'

import { getPayloadClient } from '../../../../../lib/payload'
import { SESSION_COOKIE, signSession } from '../../../../../lib/session'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const fail = () => Response.redirect(new URL('/login?error=google', url))
  const jar = await cookies()
  const saved = jar.get('ew_oauth')?.value
  jar.delete('ew_oauth')
  let next = '/account'
  try {
    const parsed = JSON.parse(saved ?? '{}') as { state?: string; next?: string }
    if (!parsed.state || parsed.state !== url.searchParams.get('state')) return fail()
    if (parsed.next?.startsWith('/') && !parsed.next.startsWith('//')) next = parsed.next
  } catch {
    return fail()
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: url.searchParams.get('code') ?? '',
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenRes.ok) return fail()
  const { access_token } = (await tokenRes.json()) as { access_token: string }
  const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${access_token}` } })
  if (!infoRes.ok) return fail()
  const info = (await infoRes.json()) as { sub: string; email?: string; email_verified?: boolean; name?: string }
  if (!info.email || !info.email_verified) return fail()

  const payload = await getPayloadClient()
  const email = info.email.toLowerCase()
  const found = await payload.find({
    collection: 'users',
    where: { or: [{ googleId: { equals: info.sub } }, { email: { equals: email } }] },
    limit: 1,
    overrideAccess: true,
  })
  let user = found.docs[0]
  if (user && user.role !== 'customer') return Response.redirect(new URL('/login?error=staff', url))
  if (!user) {
    user = await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { name: info.name || email.split('@')[0], email, googleId: info.sub, role: 'customer', password: crypto.randomBytes(24).toString('base64url') },
    })
  } else if (!user.googleId) {
    await payload.update({ collection: 'users', id: user.id, data: { googleId: info.sub }, overrideAccess: true })
  }
  jar.set(SESSION_COOKIE, signSession(user.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30 })
  return Response.redirect(new URL(next, url))
}
