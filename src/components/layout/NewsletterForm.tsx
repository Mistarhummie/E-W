'use client'

import React, { useActionState } from 'react'

import { subscribe } from '../../app/(frontend)/actions/newsletter'

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribe, null)
  return (
    <form action={action} className="flex w-full flex-col gap-3 sm:flex-row lg:justify-end">
      <label className="sr-only" htmlFor="nl-email">Email address</label>
      <input
        id="nl-email"
        name="email"
        type="email"
        required
        placeholder="Your email address"
        className="h-14 flex-1 rounded-full border border-white/20 bg-white/5 px-6 text-white outline-none placeholder:text-white/40 focus:border-teal lg:max-w-sm"
      />
      <button className="btn btn-teal h-14 px-8" disabled={pending}>
        {pending ? 'Joining…' : 'Join'}
      </button>
      {state ? (
        <p role="status" className={`text-sm sm:basis-full lg:text-right ${state.ok ? 'text-teal' : 'text-red-300'}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
