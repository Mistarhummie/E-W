import type { Metadata } from 'next'

import { RegisterForm } from '../../../components/account/RegisterForm'

export const metadata: Metadata = { title: 'Create account', robots: { index: false } }

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = '/account' } = await searchParams
  return (
    <div className="container-x max-w-lg pt-14">
      <h1 className="display text-5xl">Create account</h1>
      <p className="mt-2 text-muted">Faster checkout, order tracking and member-only offers.</p>
      <RegisterForm next={next.startsWith('/') ? next : '/account'} />
    </div>
  )
}
