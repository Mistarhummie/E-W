'use client'

import { CheckCircle2 } from 'lucide-react'
import React, { useActionState } from 'react'

import { sendMessage } from '../../app/(frontend)/actions/contact'

const SUBJECTS = ['An order', 'Jersey printing', 'Sizes & stock', 'Returns', 'Wholesale or team kits', 'Something else']

export function ContactForm() {
  const [state, action, pending] = useActionState(sendMessage, null)
  if (state && 'ok' in state)
    return (
      <div className="animate-pop rounded-2xl bg-teal-light p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-teal-dark" />
        <p className="mt-3 text-lg font-semibold">Message sent</p>
        <p className="mt-1 text-sm text-muted">We usually reply within a few hours during store hours.</p>
      </div>
    )
  return (
    <form action={action} className="grid gap-4">
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label>
        <span className="label">Your name</span>
        <input name="name" required autoComplete="name" className="field" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Email</span>
          <input name="email" type="email" autoComplete="email" className="field" />
        </label>
        <label>
          <span className="label">Phone</span>
          <input name="phone" type="tel" autoComplete="tel" className="field" placeholder="0712 345 678" />
        </label>
      </div>
      <label>
        <span className="label">About</span>
        <select name="subject" className="field">
          {SUBJECTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="label">Message</span>
        <textarea name="message" required rows={5} className="field" placeholder="Include your order number if you have one." />
      </label>
      {state && 'error' in state ? <p className="text-sm text-sale">{state.error}</p> : null}
      <button className="btn btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
