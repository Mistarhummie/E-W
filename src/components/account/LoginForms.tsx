'use client'

import { Mail, Smartphone } from 'lucide-react'
import Link from 'next/link'
import React, { useActionState, useState } from 'react'

import { emailLogin, phoneLogin } from '../../app/(frontend)/actions/auth'
import { cn } from '../../lib/cn'

export function LoginForms({ next, googleEnabled, error }: { next: string; googleEnabled: boolean; error?: string }) {
  const [tab, setTab] = useState<'phone' | 'email'>('phone')
  return (
    <div className="mt-8">
      {error ? <p className="mb-4 rounded-xl bg-sale/5 p-3 text-sm text-sale">{error}</p> : null}
      <div className="mb-6 grid grid-cols-2 rounded-full bg-mist p-1">
        {(
          [
            ['phone', 'Phone', Smartphone],
            ['email', 'Email', Mail],
          ] as const
        ).map(([key, label, Icon]) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={cn('flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-all', tab === key ? 'bg-ink text-white shadow' : 'hover:text-teal-dark')}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      {tab === 'phone' ? <PhoneForm next={next} /> : <EmailForm next={next} />}
      {googleEnabled ? (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
          <a href={`/auth/google?next=${encodeURIComponent(next)}`} className="btn btn-outline w-full normal-case">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z" />
              <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.4 7.4 24 12 24z" />
              <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.6.4-2.4V6.5H1.4C.5 8.2 0 10.1 0 12s.5 3.8 1.4 5.5l4-3.1z" />
              <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.5l4 3.1c.9-2.8 3.5-4.8 6.6-4.8z" />
            </svg>
            Continue with Google
          </a>
        </>
      ) : null}
      <p className="mt-8 text-center text-sm text-muted">
        New here? <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline">Create an account</Link>
      </p>
    </div>
  )
}

function PhoneForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(phoneLogin, null)
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      {state?.step === 'code' || state?.step === 'name' ? <input type="hidden" name="phone" value={state.phone} /> : null}
      {!state?.step ? (
        <label>
          <span className="label">Mobile number</span>
          <input name="phone" type="tel" inputMode="tel" required autoComplete="tel" className="field" placeholder="0712 345 678" />
          <span className="mt-1.5 block text-xs text-muted">We&apos;ll text you a 6-digit code. No password needed.</span>
        </label>
      ) : null}
      {state?.step === 'code' ? (
        <label className="animate-fade-up">
          <span className="label">Code sent to {state.phone}</span>
          <input name="code" required autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="field text-center text-2xl font-bold tracking-[0.5em]" placeholder="••••••" />
          {state.demoCode ? <span className="mt-1.5 block text-xs text-amber-700">Test mode (no SMS set up): your code is {state.demoCode}</span> : null}
          {state.message ? <span className="mt-1.5 block text-xs text-muted">{state.message}</span> : null}
        </label>
      ) : null}
      {state?.step === 'name' ? (
        <div className="grid animate-fade-up gap-4">
          <p className="text-sm">Welcome! Your number is verified. What should we call you?</p>
          <label>
            <span className="label">Your name</span>
            <input name="name" required autoFocus autoComplete="name" className="field" />
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="consent" className="mt-0.5 h-5 w-5 accent-teal" />
            <span>Send me new kits and offers. You can opt out any time.</span>
          </label>
        </div>
      ) : null}
      {state?.error ? <p className="text-sm text-sale">{state.error}</p> : null}
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? 'Please wait…' : state?.step === 'code' ? 'Verify code' : state?.step === 'name' ? 'Create my account' : 'Send code'}
      </button>
      {state?.step === 'code' ? (
        <button formAction={action} formNoValidate name="code" value="" className="text-sm font-semibold text-teal-dark hover:underline">
          Send a new code
        </button>
      ) : null}
    </form>
  )
}

function EmailForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(emailLogin, null)
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <label>
        <span className="label">Email</span>
        <input name="email" type="email" required autoComplete="email" className="field" />
      </label>
      <label>
        <span className="label">Password</span>
        <input name="password" type="password" required autoComplete="current-password" className="field" />
      </label>
      {state?.error ? <p className="text-sm text-sale">{state.error}</p> : null}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? 'Logging in…' : 'Log in'}</button>
    </form>
  )
}
