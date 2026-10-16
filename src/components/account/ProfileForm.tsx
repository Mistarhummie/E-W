'use client'

import React, { useActionState, useState } from 'react'

import { deleteAccount, updateProfile } from '../../app/(frontend)/actions/auth'

type Profile = {
  name?: string | null
  email?: string | null
  birthday?: string | null
  favouriteClub?: string | null
  marketingConsent?: boolean | null
  address?: string | null
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, null)
  return (
    <form action={action} className="grid gap-4">
      <label>
        <span className="label">Full name</span>
        <input name="name" defaultValue={profile.name ?? ''} required autoComplete="name" className="field" />
      </label>
      <label>
        <span className="label">Email</span>
        <input name="email" type="email" defaultValue={profile.email ?? ''} autoComplete="email" className="field" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Birthday</span>
          <input name="birthday" type="date" defaultValue={profile.birthday?.slice(0, 10) ?? ''} className="field" />
        </label>
        <label>
          <span className="label">Favourite club</span>
          <input name="club" defaultValue={profile.favouriteClub ?? ''} className="field" />
        </label>
      </div>
      <label>
        <span className="label">Delivery address</span>
        <textarea name="address" rows={3} defaultValue={profile.address ?? ''} className="field" placeholder="Building, street, area, town" />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" defaultChecked={Boolean(profile.marketingConsent)} className="mt-0.5 h-5 w-5 accent-teal" />
        <span>Send me new kits and offers by SMS and email.</span>
      </label>
      {state && 'error' in state && state.error ? <p className="text-sm text-sale">{state.error}</p> : null}
      {state && 'ok' in state ? <p className="text-sm font-semibold text-teal-dark">Saved.</p> : null}
      <button className="btn btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}

export function DeleteAccountButton() {
  const [confirm, setConfirm] = useState(false)
  const [pending, setPending] = useState(false)
  if (!confirm)
    return (
      <button type="button" onClick={() => setConfirm(true)} className="text-sm font-semibold text-sale underline underline-offset-4">
        Delete my account
      </button>
    )
  return (
    <div className="rounded-2xl border border-sale/30 bg-sale/5 p-4 text-sm">
      <p>This deletes your profile, saved addresses and wishlist link. Past orders are kept for our records without your account.</p>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            setPending(true)
            await deleteAccount()
          }}
          className="btn bg-sale px-5 py-2.5 text-white"
        >
          {pending ? 'Deleting…' : 'Yes, delete it'}
        </button>
        <button type="button" onClick={() => setConfirm(false)} className="btn btn-outline px-5 py-2.5">
          Cancel
        </button>
      </div>
    </div>
  )
}
