'use client'

import React, { useActionState } from 'react'

import { trackOrder } from '../../app/(frontend)/actions/checkout'

export function TrackForm() {
  const [state, action, pending] = useActionState(trackOrder, null)
  return (
    <form action={action} className="mt-8 grid gap-4">
      <label>
        <span className="label">Order number</span>
        <input name="order" required className="field uppercase" placeholder="EW-XXXXXX" />
      </label>
      <label>
        <span className="label">Phone number</span>
        <input name="phone" required type="tel" className="field" placeholder="0712 345 678" />
      </label>
      {state?.error ? <p className="text-sm text-sale">{state.error}</p> : null}
      <button className="btn btn-primary" disabled={pending}>{pending ? 'Finding…' : 'Track order'}</button>
    </form>
  )
}
