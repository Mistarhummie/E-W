'use client'

import Link from 'next/link'
import React, { useActionState } from 'react'

import { register } from '../../app/(frontend)/actions/auth'

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(register, null)
  return (
    <form action={action} className="mt-8 grid gap-4">
      <input type="hidden" name="next" value={next} />
      <label>
        <span className="label">Full name</span>
        <input name="name" required autoComplete="name" className="field" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Email</span>
          <input name="email" type="email" required autoComplete="email" className="field" />
        </label>
        <label>
          <span className="label">Mobile</span>
          <input name="phone" type="tel" autoComplete="tel" className="field" placeholder="0712 345 678" />
        </label>
      </div>
      <label>
        <span className="label">Password</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Birthday (optional)</span>
          <input name="birthday" type="date" className="field" />
          <span className="mt-1 block text-xs text-muted">For a birthday treat.</span>
        </label>
        <label>
          <span className="label">Favourite club (optional)</span>
          <input name="club" className="field" placeholder="Arsenal, Gor Mahia…" />
        </label>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" className="mt-0.5 h-5 w-5 accent-teal" />
        <span>Send me new kits and offers by SMS and email. You can opt out any time.</span>
      </label>
      <p className="text-xs text-muted">
        By creating an account you agree to our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
      </p>
      {state?.error ? <p className="text-sm text-sale">{state.error}</p> : null}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? 'Creating…' : 'Create account'}</button>
      <p className="text-center text-sm text-muted">
        Prefer no password? <Link href="/login" className="font-semibold text-ink underline">Log in with your phone</Link>
      </p>
    </form>
  )
}
