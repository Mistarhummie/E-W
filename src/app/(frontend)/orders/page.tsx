import type { Metadata } from 'next'

import { TrackForm } from '../../../components/checkout/TrackForm'

export const metadata: Metadata = { title: 'Track your order' }

export default function TrackPage() {
  return (
    <div className="container-x max-w-xl pt-14">
      <h1 className="display text-5xl">Track your order</h1>
      <p className="mt-3 text-muted">Enter your order number (from the SMS) and the phone number you ordered with.</p>
      <TrackForm />
    </div>
  )
}
