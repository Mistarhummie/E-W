import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { LoginForms } from '../../../components/account/LoginForms'
import { getCurrentUser } from '../../../lib/payload'

export const metadata: Metadata = { title: 'Log in', robots: { index: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = '/account', error } = await searchParams
  const user = await getCurrentUser()
  if (user?.role === 'customer') redirect('/account')
  const message = error === 'google' ? "Google sign-in didn't work. Please try again." : error === 'staff' ? 'Staff accounts sign in at /admin.' : undefined
  return (
    <div className="container-x max-w-md pt-14">
      <h1 className="display text-5xl">Log in</h1>
      <p className="mt-2 text-muted">Track orders, save your addresses and reorder in seconds.</p>
      <LoginForms next={next.startsWith('/') ? next : '/account'} googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID)} error={message} />
    </div>
  )
}
