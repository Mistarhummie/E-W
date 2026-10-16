import crypto from 'node:crypto'
import type { AuthStrategy } from 'payload'

/**
 * Passwordless sessions (phone SMS code and Google sign-in) use their own signed
 * cookie. Payload's normal email + password login keeps using its own cookie.
 */
export const SESSION_COOKIE = 'ew_session'
const MAX_AGE_S = 60 * 60 * 24 * 30

const secret = () => process.env.PAYLOAD_SECRET || 'dev-secret'

const b64 = (buf: Buffer | string) => Buffer.from(buf).toString('base64url')

export function signSession(userId: number | string): string {
  const body = b64(JSON.stringify({ uid: userId, exp: Math.floor(Date.now() / 1000) + MAX_AGE_S }))
  const sig = b64(crypto.createHmac('sha256', secret()).update(body).digest())
  return `${body}.${sig}`
}

export function verifySession(token: string | undefined): number | string | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = b64(crypto.createHmac('sha256', secret()).update(body).digest())
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const { uid, exp } = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (typeof exp !== 'number' || exp < Date.now() / 1000) return null
    return uid
  } catch {
    return null
  }
}

export const sessionCookieHeader = (token: string) =>
  `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_S}${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`

export const clearSessionCookieHeader = () =>
  `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`

const readCookie = (cookieHeader: string | null, name: string) =>
  cookieHeader
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1)

export const otpStrategy: AuthStrategy = {
  name: 'ew-session',
  authenticate: async ({ headers, payload }) => {
    const uid = verifySession(readCookie(headers.get('cookie'), SESSION_COOKIE))
    if (!uid) return { user: null }
    try {
      const user = await payload.findByID({ collection: 'users', id: uid, depth: 0 })
      // Passwordless sessions are for shoppers; staff must use password login for the admin.
      if (!user || user.role !== 'customer') return { user: null }
      return { user: { ...user, collection: 'users', _strategy: 'ew-session' } as never }
    } catch {
      return { user: null }
    }
  },
}
