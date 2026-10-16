import crypto from 'node:crypto'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) return Response.redirect(new URL('/login?error=google', request.url))
  const state = crypto.randomBytes(16).toString('base64url')
  const next = new URL(request.url).searchParams.get('next') ?? '/account'
  const jar = await cookies()
  jar.set('ew_oauth', JSON.stringify({ state, next }), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 })
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  })
  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
