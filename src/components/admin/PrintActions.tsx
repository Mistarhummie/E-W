'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

export function PrintActions({ day, showPrinted, orderIds }: { day: string; showPrinted: boolean; orderIds: (number | string)[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const markPrinted = async () => {
    if (!orderIds.length) return
    if (!confirm(`Mark ${orderIds.length} order(s) as printed? Pickup orders become "Ready for pickup" and those customers get an SMS with their pickup code.`)) return
    setBusy(true)
    const res = await fetch('/api/orders/mark-printed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ orderIds }),
    })
    setBusy(false)
    if (!res.ok) alert('Could not update. Please try again.')
    router.refresh()
  }

  return (
    <div className="print-hide" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
      <label>
        Night:{' '}
        <input
          type="date"
          defaultValue={day}
          onChange={(e) => router.push(`/admin/print-queue?night=${e.target.value}${showPrinted ? '&printed=1' : ''}`)}
        />
      </label>
      <label>
        <input
          type="checkbox"
          defaultChecked={showPrinted}
          onChange={(e) => router.push(`/admin/print-queue?night=${day}${e.target.checked ? '&printed=1' : ''}`)}
        />{' '}
        Show already printed
      </label>
      <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => window.print()}>
        Print job sheet
      </button>
      <button type="button" className="btn btn--style-primary btn--size-small" disabled={busy || !orderIds.length} onClick={markPrinted}>
        {busy ? 'Saving…' : 'Mark all as printed'}
      </button>
    </div>
  )
}
